# Feature Specification: Shot Predictions Based on Entered Data

## Overview

This feature enables the espresso-ML system to provide real-time predictions for shot yield, pressure, and extraction time based on the parameters and historical data that users enter when logging new shots. This helps baristas optimize their espresso preparation and achieve more consistent results.

## User Stories

### Primary User Story
**As a** barista **I want** to receive predictions for shot yield, pressure, and time **when** I enter shot parameters **so that** I can optimize my espresso preparation before actually pulling the shot.

### Secondary User Stories
- **As a** barista **I want** to see confidence levels for predictions **so that** I can trust the recommendations
- **As a** barista **I want** to compare predicted vs actual results **so that** I can improve my technique
- **As a** barista **I want** to receive real-time prediction updates **when** I change parameters **so that** I can immediately see the impact
- **As a** barista **I want** historical prediction accuracy **so that** I can understand how well the system performs

## Functional Requirements

### 1. Prediction Engine
- **Input Parameters**: Predictions based on:
  - Bean characteristics (origin, roast level, processing method)
  - Grinder settings (grind size, burr type)
  - Machine parameters (temperature, pressure profile)
  - Shot preparation (dose, basket type, distribution method)
  - Environmental factors (humidity, ambient temperature)

- **Prediction Types**:
  - **Yield Prediction**: Expected shot yield in grams (target: ±2g accuracy)
  - **Pressure Prediction**: Optimal pressure in bars (target: ±0.5 bar accuracy)
  - **Extraction Time**: Ideal extraction time in seconds (target: ±3 seconds accuracy)
  - **Success Probability**: Likelihood of successful shot (target: >85% accuracy)

- **Real-time Updates**: Predictions update instantly when users change any parameter

### 2. Prediction Interface
- **Shot Form Integration**: Predictions displayed directly in ShotForm
- **Visual Indicators**: 
  - Color-coded confidence levels (green: >90%, yellow: 70-90%, red: <70%)
  - Progress bars showing expected vs optimal ranges
  - Trend arrows indicating if parameters are improving

- **Parameter Recommendations**:
  - Suggested adjustments for each parameter
  - Reason explanations for recommendations
  - Historical context for similar shots

### 3. Historical Analysis
- **Similar Shot Comparison**: Find and display 3 most similar historical shots
- **Performance Trends**: Show user's improvement over time
- **Success Pattern Analysis**: Identify patterns in successful vs failed shots

## Technical Implementation

### 1. Backend Components

#### Prediction Service (`/src/services/predictionService.ts`)
```typescript
interface PredictionService {
  // Get real-time predictions for shot parameters
  getPredictions(shotParams: ShotParameters): Promise<Predictions>;
  
  // Get similar historical shots
  getSimilarShots(shotParams: ShotParameters, limit: number): Promise<HistoricalShot[]>;
  
  // Update prediction models with new shot data
  updateModels(newShotData: Shot): Promise<void>;
  
  // Get prediction accuracy metrics
  getPredictionAccuracy(timeframe: string): Promise<AccuracyMetrics>;
}

interface ShotParameters {
  beanId: string;
  machineId: string;
  grinderId: string;
  grindSetting: number;
  doseGrams: number;
  basketType: string;
  basketSizeGrams: number;
  distributionMethod: string;
  tampType: string;
  tampPressure: string;
  temperatureCelsius: number;
  pressureBars: number;
}

interface Predictions {
  yieldGrams: {
    predicted: number;
    confidence: number;
    range: { min: number; max: number };
  };
  pressureBars: {
    predicted: number;
    confidence: number;
    range: { min: number; max: number };
  };
  extractionTimeSeconds: {
    predicted: number;
    confidence: number;
    range: { min: number; max: number };
  };
  successProbability: {
    predicted: number;
    confidence: number;
    factors: { [key: string]: number };
  };
  recommendations: Recommendation[];
  similarShots: HistoricalShot[];
}
```

#### Machine Learning Models
```typescript
interface PredictionModels {
  // Random Forest models for regression
  yieldModel: RandomForestRegressor;
  pressureModel: RandomForestRegressor;
  timeModel: RandomForestRegressor;
  
  // Neural network for classification
  successModel: MLPClassifier;
  
  // Feature encoders for categorical data
  beanEncoder: LabelEncoder;
  machineEncoder: LabelEncoder;
  grinderEncoder: LabelEncoder;
}
```

### 2. Database Schema Updates

#### New Tables
```sql
-- Shot predictions cache
CREATE TABLE shot_predictions (
  id UUID PRIMARY KEY,
  shot_parameters JSONB NOT NULL,
  predictions JSONB NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  confidence_threshold DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Similar shots index
CREATE TABLE similar_shots_index (
  id UUID PRIMARY KEY,
  shot_id UUID REFERENCES shots(id),
  feature_vector JSONB NOT NULL,
  similarity_score DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Prediction accuracy tracking
CREATE TABLE prediction_accuracy (
  id UUID PRIMARY KEY,
  prediction_type VARCHAR(50) NOT NULL,
  actual_value DECIMAL(10,4),
  predicted_value DECIMAL(10,4),
  confidence_level DECIMAL(3,2),
  error_margin DECIMAL(10,4),
  shot_id UUID REFERENCES shots(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. API Endpoints

#### Prediction Management
```
POST /api/predictions/shot
GET  /api/predictions/similar-shots
GET  /api/predictions/accuracy
POST /api/predictions/feedback
GET  /api/predictions/recommendations
```

#### Request/Response Formats
```typescript
// Shot prediction request
interface ShotPredictionRequest {
  shotParameters: ShotParameters;
  includeSimilarShots?: boolean;
  includeRecommendations?: boolean;
}

// Shot prediction response
interface ShotPredictionResponse {
  predictions: Predictions;
  processingTime: number;
  modelVersion: string;
  lastTrained: Date;
}

// Similar shots request
interface SimilarShotsRequest {
  shotParameters: ShotParameters;
  limit?: number;
  minSimilarity?: number;
}

// Prediction feedback (for continuous learning)
interface PredictionFeedbackRequest {
  shotId: string;
  predictions: Predictions;
  actualResults: ShotResults;
  userRating: 'accurate' | 'somewhat_accurate' | 'inaccurate';
}
```

### 4. Frontend Integration

#### Enhanced Shot Form
```typescript
// In ShotForm.tsx
export const ShotForm = ({ initialData, onSuccess, onCancel }: ShotFormProps) => {
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  
  // Watch form values and trigger predictions
  const { watch, control } = useForm<ShotFormData>({
    defaultValues: initialData || { ...defaultValues }
  });
  
  const formValues = watch();
  
  // Debounced prediction function
  const debouncedPredict = useMemo(
    () => debounce(async (params: ShotFormData) => {
      setIsPredicting(true);
      try {
        const result = await api.predictions.getShotPredictions(params);
        setPredictions(result.predictions);
      } catch (error) {
        console.error('Prediction failed:', error);
      } finally {
        setIsPredicting(false);
      }
    }, 500),
    []
  );
  
  // Trigger predictions when form values change
  useEffect(() => {
    if (formValues.beanId && formValues.machineId) {
      debouncedPredict(formValues);
    }
  }, [formValues, debouncedPredict]);
  
  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
      {/* Existing form fields */}
      
      {/* Predictions Panel */}
      {predictions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Predictions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Yield Prediction */}
            <div className="bg-white rounded p-4">
              <h4 className="font-medium text-gray-900">Yield</h4>
              <div className="text-2xl font-bold text-blue-600">
                {predictions.yieldGrams.predicted}g
              </div>
              <div className="flex items-center mt-2">
                <div className={`w-full bg-gray-200 rounded-full h-2`}>
                  <div 
                    className={`h-2 rounded-full ${
                      predictions.yieldGrams.confidence > 0.9 ? 'bg-green-500' :
                      predictions.yieldGrams.confidence > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${predictions.yieldGrams.confidence * 100}%` }}
                  />
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {Math.round(predictions.yieldGrams.confidence * 100)}% confidence
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Range: {predictions.yieldGrams.range.min}g - {predictions.yieldGrams.range.max}g
              </div>
            </div>
            
            {/* Pressure Prediction */}
            <div className="bg-white rounded p-4">
              <h4 className="font-medium text-gray-900">Pressure</h4>
              <div className="text-2xl font-bold text-blue-600">
                {predictions.pressureBars.predicted} bar
              </div>
              {/* Similar confidence indicator */}
            </div>
            
            {/* Time Prediction */}
            <div className="bg-white rounded p-4">
              <h4 className="font-medium text-gray-900">Extraction Time</h4>
              <div className="text-2xl font-bold text-blue-600">
                {predictions.extractionTimeSeconds.predicted}s
              </div>
              {/* Similar confidence indicator */}
            </div>
          </div>
          
          {/* Success Probability */}
          <div className="mt-4 bg-white rounded p-4">
            <h4 className="font-medium text-gray-900">Success Probability</h4>
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(predictions.successProbability.predicted * 100)}%
              </div>
              <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                predictions.successProbability.predicted > 0.85 ? 'bg-green-100 text-green-800' :
                predictions.successProbability.predicted > 0.70 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {predictions.successProbability.predicted > 0.85 ? 'High' :
                 predictions.successProbability.predicted > 0.70 ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          {predictions.recommendations.length > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Recommendations</h4>
              <ul className="space-y-2">
                {predictions.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-700 mr-2">•</span>
                    <span className="text-sm text-yellow-800">{rec.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Similar Shots */}
          {predictions.similarShots.length > 0 && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-4">
              <h4 className="font-medium text-gray-900 mb-2">Similar Historical Shots</h4>
              <div className="space-y-2">
                {predictions.similarShots.map((shot) => (
                  <div key={shot.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">
                      {shot.date} - {shot.yield}g - {shot.time}s
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      shot.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {shot.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Loading indicator */}
      {isPredicting && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-blue-600">Calculating predictions...</span>
        </div>
      )}
      
      {/* Rest of form */}
    </form>
  );
};
```

## Non-Functional Requirements

### 1. Performance
- **Response Time**: Predictions within 500ms for single request
- **Accuracy**: Yield predictions within ±2g, pressure within ±0.5 bar, time within ±3 seconds
- **Scalability**: Handle 100+ concurrent prediction requests
- **Cache Performance**: 95% cache hit rate for similar parameters

### 2. Usability
- **Real-time Updates**: Predictions update without page refresh
- **Intuitive Interface**: Clear visual indicators and confidence levels
- **Mobile Responsive**: Prediction panel works on all screen sizes
- **Accessibility**: Screen reader compatible prediction displays

### 3. Reliability
- **Fallback Behavior**: Graceful degradation when models are unavailable
- **Error Handling**: Clear error messages for prediction failures
- **Data Validation**: Prevent invalid parameter combinations
- **Offline Support**: Cached predictions for basic scenarios

## Security Considerations

- **Input Validation**: Sanitize all prediction parameters
- **Rate Limiting**: Prevent abuse of prediction endpoints
- **Privacy**: No sensitive user data in prediction logs
- **Model Security**: Protect prediction models from unauthorized access

## Testing Strategy

### 1. Unit Tests
- Prediction service logic
- Feature encoding/decoding
- Similarity calculation algorithms
- Confidence score calculations

### 2. Integration Tests
- End-to-end prediction flow
- API endpoint functionality
- Database query performance
- Cache invalidation

### 3. Performance Tests
- Load testing with concurrent requests
- Memory usage during predictions
- Response time benchmarks
- Cache efficiency measurements

### 4. Accuracy Tests
- Historical prediction accuracy validation
- Confidence calibration testing
- Edge case handling
- Cross-validation with different datasets

## Success Metrics

### 1. Technical Metrics
- **Prediction Accuracy**: 
  - Yield: MAE < 2g
  - Pressure: MAE < 0.5 bar
  - Time: MAE < 3 seconds
  - Success: Accuracy > 85%
- **System Performance**: 
  - Response time < 500ms (95th percentile)
  - Cache hit rate > 90%
  - Concurrent users > 100

### 2. User Experience Metrics
- **Prediction Helpfulness**: >80% of predictions rated as helpful
- **Parameter Impact**: Users improve shot success rate by 15%
- **Engagement**: >60% of users interact with predictions
- **Trust**: >70% of users trust prediction recommendations

## Implementation Phases

### Phase 1: Core Prediction Engine
- Implement basic prediction models
- Create prediction API endpoints
- Integrate with ShotForm component

### Phase 2: Enhanced Features
- Add similar shots functionality
- Implement recommendation system
- Add confidence indicators and visual feedback

### Phase 3: Optimization & Intelligence
- Implement real-time learning
- Add advanced similarity algorithms
- Optimize for mobile performance

## Dependencies

### Technical Dependencies
- **ML Libraries**: scikit-learn, numpy, pandas, scipy
- **Caching**: Redis for prediction cache
- **Similarity Search**: FAISS or Annoy for efficient nearest neighbors
- **Real-time**: WebSockets for live prediction updates

### External Services
- **Feature Processing**: Optional integration with bean analysis APIs
- **Weather Data**: Environmental factor integration
- **Analytics**: User interaction tracking with prediction system

## Risks & Mitigations

### 1. Prediction Inaccuracy
- **Risk**: Poor predictions lead to user frustration
- **Mitigation**: Confidence levels, user feedback system, A/B testing

### 2. Performance Issues
- **Risk**: Slow predictions hurt user experience
- **Mitigation**: Caching, model optimization, background processing

### 3. Over-reliance
- **Risk**: Users depend too heavily on predictions
- **Mitigation**: Educational content, skill development emphasis

---

*This feature specification provides comprehensive guidance for implementing an intelligent prediction system that helps baristas optimize their espresso preparation through data-driven insights and real-time recommendations.*
