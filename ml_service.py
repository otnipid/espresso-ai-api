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
            shots_response = requests.get(f"{api_base_url}/shots")
            shots_response.raise_for_status()
            shots_data = shots_response.json()
            print("Shots Data:")
            print("*"*80)
            print(shots_data)
            
            # Fetch related data
            preparations_response = requests.get(f"{api_base_url}/preparations")
            preparations_response.raise_for_status()
            preparations_data = preparations_response.json()
            print("Preparations Data:")
            print("*"*80)
            print(preparations_data)
            
            extractions_response = requests.get(f"{api_base_url}/extractions")
            extractions_response.raise_for_status()
            extractions_data = extractions_response.json()
            print("Extractions Data:")
            print("*"*80)
            print(extractions_data)
            
            # Fetch bean and equipment data
            beans_response = requests.get(f"{api_base_url}/beans")
            beans_response.raise_for_status()
            beans_data = beans_response.json()
            print("Beans Data:")
            print("*"*80)
            print(beans_data)
            
            bean_batches_response = requests.get(f"{api_base_url}/batches")
            bean_batches_response.raise_for_status()
            bean_batches_data = bean_batches_response.json()
            print("Bean Batches Data:")
            print("*"*80)
            print(bean_batches_data)
            
            machines_response = requests.get(f"{api_base_url}/machines")
            machines_response.raise_for_status()
            machines_data = machines_response.json()
            print("Machines Data:")
            print("*"*80)
            print(machines_data)
            
            grinders_response = requests.get(f"{api_base_url}/grinders")
            grinders_response.raise_for_status()
            grinders_data = grinders_response.json()
            print("Grinders Data:")
            print("*"*80)
            print(grinders_data)
            
            # Create dataframes with robust error handling
            def safe_create_dataframe(data, name):
                """Create dataframe with error handling for different data structures"""
                try:
                    if not data:
                        print(f"Warning: Empty data for {name}")
                        return pd.DataFrame()
                    
                    # Handle different response formats
                    if isinstance(data, list):
                        if len(data) == 0:
                            print(f"Warning: Empty list for {name}")
                            return pd.DataFrame()
                        return pd.DataFrame(data)
                    elif isinstance(data, dict):
                        # Check if it's a paginated response with 'data' field
                        if 'data' in data and isinstance(data['data'], list):
                            if len(data['data']) == 0:
                                print(f"Warning: Empty data list for {name}")
                                return pd.DataFrame()
                            return pd.DataFrame(data['data'])
                        # Check if it's a paginated response with 'shots' field
                        if 'shots' in data and isinstance(data['shots'], list):
                            if len(data['shots']) == 0:
                                print(f"Warning: Empty shots list for {name}")
                                return pd.DataFrame()
                            return pd.DataFrame(data['shots'])
                        # Check if it's a single item
                        elif 'id' in data or any(key in data for key in ['name', 'model', 'created_at']):
                            return pd.DataFrame([data])
                        else:
                            print(f"Warning: Unexpected dict structure for {name}: {list(data.keys())}")
                            return pd.DataFrame()
                    else:
                        print(f"Warning: Unexpected data type for {name}: {type(data)}")
                        return pd.DataFrame()
                        
                except Exception as e:
                    print(f"Error creating dataframe for {name}: {e}")
                    return pd.DataFrame()
            
            shots_df = safe_create_dataframe(shots_data, "shots")
            preparations_df = safe_create_dataframe(preparations_data, "preparations")
            extractions_df = safe_create_dataframe(extractions_data, "extractions")
            beans_df = safe_create_dataframe(beans_data, "beans")
            bean_batches_df = safe_create_dataframe(bean_batches_data, "bean_batches")
            machines_df = safe_create_dataframe(machines_data, "machines")
            grinders_df = safe_create_dataframe(grinders_data, "grinders")
            
            # Debug info
            print(f"Dataframe shapes:")
            print(f"  Shots: {shots_df.shape}")
            print(f"  Preparations: {preparations_df.shape}")
            print(f"  Extractions: {extractions_df.shape}")
            print(f"  Beans: {beans_df.shape}")
            print(f"  Bean Batches: {bean_batches_df.shape}")
            print(f"  Machines: {machines_df.shape}")
            print(f"  Grinders: {grinders_df.shape}")
            
            # Join data together to create comprehensive training dataset
            # Start with shots and join with related data
            if shots_df.empty:
                print("Warning: No shots data available, returning empty dataframe")
                return pd.DataFrame()
            
            training_df = shots_df.copy()
            
            # Join with preparations if available
            if not preparations_df.empty:
                if 'shot_id' in preparations_df.columns:
                    training_df = training_df.merge(
                        preparations_df, 
                        left_on='id', 
                        right_on='shot_id', 
                        how='inner', 
                        suffixes=('', '_prep')
                    )
                else:
                    print("Warning: 'shot_id' column not found in preparations data")
            
            # Join with extractions if available
            if not extractions_df.empty:
                if 'shot_id' in extractions_df.columns:
                    training_df = training_df.merge(
                        extractions_df, 
                        left_on='id', 
                        right_on='shot_id', 
                        how='inner', 
                        suffixes=('', '_extr')
                    )
                else:
                    print("Warning: 'shot_id' column not found in extractions data")
            
            # Join with bean batches if available
            if not bean_batches_df.empty and 'beanBatchId' in training_df.columns:
                training_df = training_df.merge(
                    bean_batches_df, 
                    left_on='beanBatchId', 
                    right_on='id', 
                    how='left', 
                    suffixes=('', '_batch')
                )
            
            # Join with beans if available
            if not beans_df.empty and 'beanId' in training_df.columns:
                training_df = training_df.merge(
                    beans_df, 
                    left_on='beanId', 
                    right_on='id', 
                    how='left', 
                    suffixes=('', '_bean')
                )
            
            # Join with machines if available
            if not machines_df.empty and 'machineId' in training_df.columns:
                training_df = training_df.merge(
                    machines_df, 
                    left_on='machineId', 
                    right_on='id', 
                    how='left', 
                    suffixes=('', '_machine')
                )
            
            # Join with grinders if available
            if not grinders_df.empty and 'grinderId' in training_df.columns:
                training_df = training_df.merge(
                    grinders_df, 
                    left_on='grinderId', 
                    right_on='id', 
                    how='left', 
                    suffixes=('', '_grinder')
                )
            
            print(f"Training dataframe shape after joins: {training_df.shape}")
            
            # Select available columns (handle missing columns gracefully)
            available_columns = []
            required_columns = [
                # Shot identifiers
                'id',
                # Preparation features
                'dose_grams', 'burr_setting', 'side_hopper', 'basket_type', 
                'basket_size_grams', 'distribution_method', 'tamp_type', 'tamp_pressure_category',
                # Extraction features
                'water_temp_c', 'shot_time_seconds', 'yield_grams', 'avg_pressure_bar',
                # Bean features
                'name', 'roaster', 'roastLevel', 'roastDate',
                # Equipment features
                'model', 'manufacturer'
            ]
            
            for col in required_columns:
                # Try different column name variations
                col_variations = [col, f"{col}_prep", f"{col}_extr", f"{col}_batch", f"{col}_bean", f"{col}_machine", f"{col}_grinder"]
                for variation in col_variations:
                    if variation in training_df.columns:
                        available_columns.append(variation)
                        break
            
            if available_columns:
                training_df = training_df[available_columns].copy()
                print(f"Selected {len(available_columns)} columns: {available_columns}")
            else:
                print("Warning: No required columns found in training data")
                return pd.DataFrame()
            
            # Calculate engineered features with proper type conversion
            try:
                # Convert numeric columns to proper types
                numeric_columns = ['dose_grams', 'yield_grams', 'shot_time_seconds']
                for col in numeric_columns:
                    if col in training_df.columns:
                        training_df[col] = pd.to_numeric(training_df[col], errors='coerce')
                
                # Calculate engineered features only if we have valid data
                if all(col in training_df.columns for col in ['dose_grams', 'yield_grams', 'shot_time_seconds']):
                    # Remove rows with invalid numeric data
                    valid_mask = (
                        training_df['dose_grams'].notna() & 
                        training_df['yield_grams'].notna() & 
                        training_df['shot_time_seconds'].notna() &
                        (training_df['dose_grams'] > 0) &
                        (training_df['shot_time_seconds'] > 0)
                    )
                    training_df = training_df[valid_mask].copy()
                    
                    if not training_df.empty:
                        training_df['extraction_ratio'] = training_df['yield_grams'] / training_df['dose_grams']
                        training_df['flow_rate'] = training_df['yield_grams'] / training_df['shot_time_seconds']
                        
                        # Calculate roast age if roastDate is available
                        if 'roastDate' in training_df.columns:
                            try:
                                training_df['roast_age'] = (datetime.now() - pd.to_datetime(training_df['roastDate'])).dt.days
                            except Exception as e:
                                print(f"Warning: Could not calculate roast_age: {e}")
                                training_df['roast_age'] = 30  # Default value
                        else:
                            training_df['roast_age'] = 30  # Default value
                            
                        print(f"Successfully calculated engineered features for {len(training_df)} records")
                    else:
                        print("Warning: No valid records after filtering for engineered features")
                        return pd.DataFrame()
                else:
                    print("Warning: Missing required columns for engineered features")
                    return pd.DataFrame()
                    
            except Exception as e:
                print(f"Error calculating engineered features: {e}")
                return pd.DataFrame()
            
            # Remove rows with missing critical data
            critical_columns = ['dose_grams', 'burr_setting', 'side_hopper', 'water_temp_c', 
                               'shot_time_seconds', 'yield_grams', 'avg_pressure_bar']
            training_df = training_df.dropna(subset=critical_columns)
            
            print(f"Fetched {len(training_df)} training samples from API")
            return training_df
            
        except Exception as e:
            print(f"Error fetching training data from API: {e}")
            # Return empty dataframe as fallback
            return pd.DataFrame()
    
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
