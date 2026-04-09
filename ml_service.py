import os
import sys
import json
import numpy as np
import pandas as pd
import requests
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
from datetime import datetime
from typing import Dict, Tuple, Any
import pdb

class PredictionFeatures:
    """Data class for prediction features"""
    def __init__(self, shot_id: str, **kwargs):
        self.shot_id = shot_id
        # Raw features
        self.dose_grams = kwargs.get('dose_grams', 18.0)
        self.burr_setting = kwargs.get('burr_setting', 15.0)
        self.side_hopper = kwargs.get('side_hopper', 1)
        self.water_temp_c = kwargs.get('water_temp_c', 92.0)
        self.extraction_time_seconds = kwargs.get('extraction_time_seconds', 25.0)
        self.yield_grams = kwargs.get('yield_grams', 36.0)
        self.pressure_bars = kwargs.get('pressure_bars', 9.0)
        self.roast_date = kwargs.get('roast_date')
        
        # Engineered features
        self.extraction_ratio = kwargs.get('extraction_ratio', self.yield_grams / self.dose_grams)
        self.flow_rate = kwargs.get('flow_rate', self.yield_grams / self.extraction_time_seconds)
        self.roast_age = kwargs.get('roast_age', (datetime.now() - self.roast_date).days)
        
        # Equipment features
        self.machine_model = kwargs.get('machine_model', 'unknown')
        self.grinder_model = kwargs.get('grinder_model', 'unknown')
        self.grinder_manufacturer = kwargs.get('grinder_manufacturer', 'unknown')
        
        # Bean features
        self.bean_name = kwargs.get('bean_name', 'unknown')
        self.bean_roaster = kwargs.get('bean_roaster', 'unknown')
        self.roast_level = kwargs.get('roast_level', 'medium')

class ParameterPrediction:
    """Data class for parameter predictions"""
    def __init__(self, burr_setting: float, side_hopper: int, water_temp_c: float,
                 extraction_time_seconds: float, pressure_bars: float,
                 uncertainty: float, yield_grams: float):
        self.burr_setting = burr_setting
        self.side_hopper = side_hopper
        self.water_temp_c = water_temp_c
        self.extraction_time_seconds = extraction_time_seconds
        self.pressure_bars = pressure_bars
        self.uncertainty = uncertainty
        self.yield_grams = yield_grams

    def to_dict(self):
        return {
            'burrSetting': self.burr_setting,
            'sideHopper': self.side_hopper,
            'waterTempC': self.water_temp_c,
            'extractionTimeSeconds': self.extraction_time_seconds,
            'pressureBars': self.pressure_bars,
            'uncertainty': self.uncertainty,
            'yieldGrams': self.yield_grams
        }

class PredictionService:
    """Main prediction service using scikit-learn"""
    
    def __init__(self):
        self.models = {}
        self.feature_encoders = {}
        self.scalers = {}
        self.initialize_models()
    
    def initialize_models(self):
        """Initialize or load trained models"""
        try:
            # Try to load existing models
            self.load_models()
        except:
            # Create default models if none exist
            self.create_default_models()
    
    def create_default_models(self):
        """Create default models for initial use"""
        print("Creating default ML models...")
        
        # Create parameter prediction model
        param_model = LinearRegression()
        
        # Train on real data from API
        training_df = self.fetch_training_data_from_api()
        
        if training_df.empty:
            print("Warning: No training data available from API, using minimal default model")
            # Create minimal model with default parameters
            X_train = np.array([[18, 15, 1, 92, 25, 36, 9, 2.0, 1.5, 30]])  # Default values
            y_train = np.array([18])  # Default dose
        else:
            # Prepare features and target from real data
            feature_columns = [
                'dose_grams', 'burr_setting', 'side_hopper', 'water_temp_c', 
                'shot_time_seconds', 'yield_grams', 'avg_pressure_bar',
                'extraction_ratio', 'flow_rate', 'roast_age'
            ]
            
            X_train = training_df[feature_columns].values
            y_train = training_df['yield_grams'].values  # Target: predict yield grams
        param_model.fit(X_train, y_train)
        
        # Create feature encoders
        self.feature_encoders = {
            'machine_model': LabelEncoder(),
            'grinder_model': LabelEncoder(),
            'grinder_manufacturer': LabelEncoder(),
            'bean_name': LabelEncoder(),
            'bean_roaster': LabelEncoder(),
            'roast_level': LabelEncoder()
        }
        
        # Fit encoders on common values
        common_values = {
            'machine_model': ['Barista Express', 'Breville', 'unknown'],
            'grinder_model': ['Barista Express', 'Breville', 'unknown'],
            'grinder_manufacturer': ['Breville', 'unknown'],
            'bean_name': ['Ethiopian', 'Colombian', 'Brazilian', 'unknown'],
            'bean_roaster': ['Blue Bottle', 'Intelligentsia', 'unknown'],
            'roast_level': ['light', 'medium', 'dark', 'unknown']
        }
        
        for feature, values in common_values.items():
            self.feature_encoders[feature].fit(values)
        
        # Create scaler for the numeric features
        self.scalers['numeric'] = StandardScaler()
        self.scalers['numeric'].fit(X_train[:, :10]) 
        
        # Store model
        self.models['parameter_prediction'] = param_model
        
        print("Default models created successfully")
    
    def fetch_training_data_from_api(self) -> pd.DataFrame:
        """Fetch real training data from the API and create a pandas dataframe"""
        try:
            # Get API base URL from environment or use default
            api_base_url = os.getenv('API_BASE_URL', 'http://localhost:3000/api')
            
            # Fetch shots data
            shots_data = self._fetch_shots_data(api_base_url)
            
            # Create dataframe from shots data
            shots_df = self._create_shots_dataframe(shots_data)
            
            if shots_df.empty:
                return shots_df
            
            # Calculate engineered features
            shots_df = self._calculate_engineered_features(shots_df)
            
            # Filter out invalid data
            shots_df = self._filter_valid_data(shots_df)
            
            print(f"Fetched {len(shots_df)} training samples from API")
            return shots_df
                
        except Exception as e:
            print(f"Error fetching training data from API: {e}")
            # Return empty dataframe as fallback
            return pd.DataFrame()
    
    def _fetch_shots_data(self, api_base_url: str) -> Dict:
        """Fetch shots data from API"""
        try:
            # API implementation uses eager loading for all related data
            # This means we get everything in one request
            shots_response = requests.get(f"{api_base_url}/shots")
            shots_response.raise_for_status()
            return shots_response.json()
        except Exception as e:
            print(f"Error fetching shots data: {e}")
            return {}
    
    def _get_required_columns(self) -> List[str]:
        """Get list of required columns for training data"""
        return [
            # Shot identifiers
            'id',
            # Preparation features
            'dose_grams', 'burr_setting', 'side_hopper',
            # Extraction features
            'water_temp_c', 'shot_time_seconds', 'yield_grams', 'avg_pressure_bar',
            # Bean features
            'batch_name', 'roaster_name', 'roast_level', 'roast_date',
            # Equipment features
            'machine_model', 'machine_manufacturer'
        ]
    
    def _extract_shot_data(self, shot: Dict) -> Dict:
        """Extract relevant data from a single shot"""
        try:
            return {
                'id': shot['id'],
                'dose_grams': shot.get('preparation', {}).get('dose_grams'),
                'burr_setting': shot.get('preparation', {}).get('burr_setting'),
                'side_hopper': shot.get('preparation', {}).get('side_hopper'),
                'water_temp_c': shot.get('extraction', {}).get('water_temp_c'),
                'shot_time_seconds': shot.get('extraction', {}).get('shot_time_seconds'),
                'yield_grams': shot.get('extraction', {}).get('yield_grams'),
                'avg_pressure_bar': shot.get('extraction', {}).get('avg_pressure_bar'),
                'batch_name': shot.get('beanBatch', {}).get('name'),
                'roaster_name': shot.get('beanBatch', {}).get('roaster'),
                'roast_level': shot.get('beanBatch', {}).get('roastLevel'),
                'roast_date': shot.get('beanBatch', {}).get('roastDate'),
                'machine_model': shot.get('machine', {}).get('model'),
                'machine_manufacturer': shot.get('machine', {}).get('manufacturer')
            }
        except Exception as e:
            print(f"Error extracting shot data: {e}")
            return {}
    
    def _create_shots_dataframe(self, shots_data: Dict) -> pd.DataFrame:
        """Create dataframe from shots data"""
        try:
            if not shots_data or 'shots' not in shots_data:
                print("Warning: No shots data available from API")
                return pd.DataFrame()
            
            required_columns = self._get_required_columns()
            shots_df = pd.DataFrame(columns=required_columns)
            
            for shot in shots_data['shots']:
                shot_row = self._extract_shot_data(shot)
                if shot_row:  # Only add if extraction succeeded
                    shots_df = pd.concat([shots_df, pd.DataFrame([shot_row])], ignore_index=True)
            
            return shots_df
            
        except Exception as e:
            print(f"Error creating dataframe for shots data: {e}")
            return pd.DataFrame()
    
    def _convert_numeric_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Convert numeric columns to proper types"""
        try:
            numeric_columns = ['dose_grams', 'yield_grams', 'shot_time_seconds']
            for col in numeric_columns:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            return df
        except Exception as e:
            print(f"Error converting numeric columns: {e}")
            return df
    
    def _filter_valid_numeric_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Filter out rows with invalid numeric data"""
        try:
            if all(col in df.columns for col in ['dose_grams', 'yield_grams', 'shot_time_seconds']):
                valid_mask = (
                    df['dose_grams'].notna() & 
                    df['yield_grams'].notna() & 
                    df['shot_time_seconds'].notna() &
                    (df['dose_grams'] > 0) &
                    (df['shot_time_seconds'] > 0)
                )
                return df[valid_mask].copy()
            else:
                print("Warning: Missing required columns for numeric validation")
                return df
        except Exception as e:
            print(f"Error filtering valid numeric data: {e}")
            return df
    
    def _calculate_engineered_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate engineered features"""
        try:
            # Convert numeric columns to proper types
            df = self._convert_numeric_columns(df)
            
            # Filter out invalid numeric data
            df = self._filter_valid_numeric_data(df)
            
            if df.empty:
                print("Warning: No valid records after numeric filtering")
                return df
            
            # Calculate engineered features
            df['extraction_ratio'] = df['yield_grams'] / df['dose_grams']
            df['flow_rate'] = df['yield_grams'] / df['shot_time_seconds']
            
            # Calculate roast age
            df = self._calculate_roast_age(df)
            
            print(f"Successfully calculated engineered features for {len(df)} records")
            return df
            
        except Exception as e:
            print(f"Error calculating engineered features: {e}")
            return pd.DataFrame()
    
    def _calculate_roast_age(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate roast age from roast date"""
        try:
            if 'roast_date' in df.columns:
                df['roast_age'] = (datetime.now() - pd.to_datetime(df['roast_date'])).dt.days
            else:
                df['roast_age'] = 30  # Default value
            return df
        except Exception as e:
            print(f"Warning: Could not calculate roast_age: {e}")
            df['roast_age'] = 30  # Default value
            return df
    
    def _filter_valid_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Filter out rows with missing critical data"""
        try:
            critical_columns = ['dose_grams', 'burr_setting', 'side_hopper', 'water_temp_c', 
                              'shot_time_seconds', 'yield_grams', 'avg_pressure_bar']
            return df.dropna(subset=critical_columns)
        except Exception as e:
            print(f"Error filtering valid data: {e}")
            return df
    
    def extract_features_from_data(self, shot_data: Dict[str, Any]) -> PredictionFeatures:
        """Extract features from shot data"""
        # Verify whether required fields are present
        required_fields = ['shot_id', 'dose_grams', 'burr_setting', 'side_hopper', 'extraction_time_seconds', 'yield_grams', 'pressure_bars', 'roast_level', 'roast_date']
        for field in required_fields:
            if field not in shot_data:
                raise ValueError(f"Missing required field: {field}")
        return PredictionFeatures(
            shot_id=shot_data.get('shot_id'),
            dose_grams=shot_data.get('dose_grams'),
            burr_setting=shot_data.get('burr_setting'),
            side_hopper=shot_data.get('side_hopper'),
            water_temp_c=shot_data.get('water_temp_c', 93.0),
            extraction_time_seconds=shot_data.get('extraction_time_seconds', 25.0),
            yield_grams=shot_data.get('yield_grams'),
            pressure_bars=shot_data.get('pressure_bars'),
            machine_model=shot_data.get('machine_model', 'unknown'),
            grinder_model=shot_data.get('grinder_model', 'unknown'),
            grinder_manufacturer=shot_data.get('grinder_manufacturer', 'unknown'),
            bean_name=shot_data.get('bean_name', 'unknown'),
            bean_roaster=shot_data.get('bean_roaster', 'unknown'),
            roast_level=shot_data.get('roast_level'),
            roast_date=shot_data.get('roast_date')
        )
    
    def prepare_features_for_prediction(self, features: PredictionFeatures) -> np.ndarray:
        """Prepare features for ML model prediction"""
        # Numeric features
        numeric_features = [
            features.dose_grams,
            features.burr_setting,
            features.side_hopper,
            features.water_temp_c,
            features.extraction_time_seconds,
            features.yield_grams,
            features.pressure_bars,
            features.extraction_ratio,
            features.flow_rate,
            features.roast_age
        ]
        
        # Categorical features
        categorical_features = [
            self.encode_categorical('machine_model', features.machine_model),
            self.encode_categorical('grinder_model', features.grinder_model),
            self.encode_categorical('grinder_manufacturer', features.grinder_manufacturer),
            self.encode_categorical('bean_name', features.bean_name),
            self.encode_categorical('bean_roaster', features.bean_roaster),
            self.encode_categorical('roast_level', features.roast_level)
        ]
        
        # Combine features
        all_features = numeric_features + categorical_features
        feature_array = np.array(all_features).reshape(1, -1)
        
        # Scale numeric features
        if 'numeric' in self.scalers:
            feature_array[:, :10] = self.scalers['numeric'].transform(feature_array[:, :10])
        
        return feature_array
    
    def encode_categorical(self, feature_name: str, value: str) -> int:
        """Encode categorical feature"""
        if feature_name in self.feature_encoders:
            encoder = self.feature_encoders[feature_name]
            try:
                return encoder.transform([value])[0]
            except:
                # Handle unknown values
                return encoder.transform(['unknown'])[0]
        return 0
    
    def predict_parameters(self, shot_data: Dict[str, Any]) -> ParameterPrediction:
        """Predict optimal shot parameters"""
        try:
            # Extract features
            features = self.extract_features_from_data(shot_data)
            
            # Get model
            model = self.models.get('parameter_prediction')
            if not model:
                raise ValueError("No parameter prediction model available")
            
            # Prepare features
            feature_vector = self.prepare_features_for_prediction(features)
            
            # Make prediction
            prediction = model.predict(feature_vector)[0]
            
            # Calculate uncertainty using prediction variance
            if hasattr(model, 'estimators_'):
                predictions = [estimator.predict(feature_vector)[0] for estimator in model.estimators_]
                uncertainty = np.std(predictions)
            else:
                uncertainty = 0.5  # Default uncertainty
            
            # Create parameter prediction (for now, predict dose only, others use defaults)
            predicted_yield = features.yield_grams  # Use actual yield from features
            
            return ParameterPrediction(
                burr_setting=features.burr_setting,
                side_hopper=features.side_hopper,
                water_temp_c=features.water_temp_c,
                extraction_time_seconds=features.extraction_time_seconds,
                pressure_bars=features.pressure_bars,
                uncertainty=uncertainty,
                yield_grams=predicted_yield
            )
            
        except Exception as e:
            print(f"Error predicting parameters: {e}")
            # Return default prediction
            return ParameterPrediction(
                burr_setting=15.0,
                side_hopper=1,
                water_temp_c=92.0,
                extraction_time_seconds=25.0,
                pressure_bars=9.0,
                uncertainty=1.0,
                yield_grams=36.0
            )
    
    def save_models(self, model_dir: str = 'models'):
        """Save trained models to disk"""
        os.makedirs(model_dir, exist_ok=True)
        
        for model_name, model in self.models.items():
            model_path = os.path.join(model_dir, f'{model_name}.joblib')
            joblib.dump(model, model_path)
        
        for encoder_name, encoder in self.feature_encoders.items():
            encoder_path = os.path.join(model_dir, f'encoder_{encoder_name}.joblib')
            joblib.dump(encoder, encoder_path)
        
        for scaler_name, scaler in self.scalers.items():
            scaler_path = os.path.join(model_dir, f'scaler_{scaler_name}.joblib')
            joblib.dump(scaler, scaler_path)
        
        print(f"Models saved to {model_dir}")
    
    def load_models(self, model_dir: str = 'models'):
        """Load trained models from disk"""
        if not os.path.exists(model_dir):
            raise FileNotFoundError(f"Model directory {model_dir} not found")
        
        # Load models
        for filename in os.listdir(model_dir):
            if filename.endswith('.joblib') and not filename.startswith('encoder_') and not filename.startswith('scaler_'):
                model_name = filename.replace('.joblib', '')
                model_path = os.path.join(model_dir, filename)
                self.models[model_name] = joblib.load(model_path)
        
        # Load encoders
        for filename in os.listdir(model_dir):
            if filename.startswith('encoder_') and filename.endswith('.joblib'):
                encoder_name = filename.replace('encoder_', '').replace('.joblib', '')
                encoder_path = os.path.join(model_dir, filename)
                self.feature_encoders[encoder_name] = joblib.load(encoder_path)
        
        # Load scalers
        for filename in os.listdir(model_dir):
            if filename.startswith('scaler_') and filename.endswith('.joblib'):
                scaler_name = filename.replace('scaler_', '').replace('.joblib', '')
                scaler_path = os.path.join(model_dir, filename)

def main():
    if len(sys.argv) < 2:
        print("Usage: python ml_service.py <command> [options]")
        print("Commands:")
        print("  train                    - Train the ML model with API data")
        print("  predict <json_data>      - Predict parameters from JSON data")
        print("  help                     - Show this help message")
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        # Initialize service
        service = PredictionService()
        
        if command == 'train':
            print("Training ML model with API data...")
            service.create_default_models()
            print("Model training completed successfully!")
            
        elif command == 'predict':
            if len(sys.argv) < 3:
                print("Usage: python ml_service.py predict <json_data>")
                print("Example: python ml_service.py predict '{\"shot_id\":\"test\",\"dose_grams\":18,\"burr_setting\":15}'")
                sys.exit(1)
            
            json_data = sys.argv[2]
            try:
                data = json.loads(json_data)
            except json.JSONDecodeError as e:
                print(f"Invalid JSON data: {e}")
                sys.exit(1)
            
            # Make prediction
            prediction = service.predict_parameters(data)
            result = prediction.to_dict()
            
            # Output result as JSON
            print(json.dumps(result, indent=2))

        elif command == 'save':
            print("Saving models...")
            service.save_models()
            print("Models saved successfully!")
            
        elif command == 'help':
            print("Usage: python ml_service.py <command> [options]")
            print("")
            print("Commands:")
            print("  train                    - Train the ML model with data from API")
            print("  predict <json_data>      - Predict parameters from JSON data")
            print("  help                     - Show this help message")
            print("")
            print("Examples:")
            print("  python ml_service.py train")
            print("  python ml_service.py predict '{\"shot_id\":\"test\",\"dose_grams\":18,\"burr_setting\":15,\"side_hopper\":1}'")
            
        else:
            print(f"Unknown command: {command}")
            print("Use 'python ml_service.py help' for available commands")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
