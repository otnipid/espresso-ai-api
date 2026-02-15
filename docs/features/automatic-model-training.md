# Feature Specification: Automatic Model Training on New Shot Data

## Overview

This feature enables the espresso-ML system to automatically retrain and update its machine learning models whenever new shot data is entered, ensuring the system continuously improves its prediction accuracy for shot yield, pressure, and extraction time.

## User Stories

### Primary User Story
**As a** barista **I want** the system to automatically retrain its prediction models **when** I enter new shot data **so that** future predictions become more accurate based on my actual brewing results.

### Secondary User Stories
- **As a** barista **I want** to see when the last model training occurred **so that** I can trust the prediction freshness
- **As a** barista **I want** to be notified if training fails **so that** I can take corrective action
- **As a** system administrator **I want** to monitor training performance **so that** I can optimize the system

## Functional Requirements

### 1. Training Trigger System
- **Trigger Events**: Automatic training initiates when:
  - New shot is created via ShotForm
  - Existing shot is updated via ShotForm
  - Batch import of multiple shots
- **Debouncing**: Prevent excessive training by implementing:
  - Minimum 5 new shots since last training
  - Minimum 30-minute interval between training sessions
  - Maximum 1 training session per hour

### 2. Model Training Pipeline
- **Data Preparation**:
  - Validate new shot data completeness
  - Normalize numerical features (dose, yield, time, temperature, pressure)
  - Encode categorical features (bean type, machine model, grinder settings)
  - Split data: 80% training, 20% validation

- **Model Types**:
  - **Yield Prediction Model**: Predict shot yield (grams) based on input parameters
  - **Pressure Prediction Model**: Optimize pressure recommendations
  - **Extraction Time Model**: Predict ideal extraction time
  - **Success Classification Model**: Predict shot success probability

- **Training Algorithms**:
  - Primary: Random Forest Regressor (for yield, pressure, time)
  - Secondary: Gradient Boosting (for success classification)
  - Hyperparameter optimization using GridSearchCV

### 3. Model Storage & Versioning
- **Model Registry**: Store trained models with metadata:
  ```typescript
  interface ModelVersion {
    id: string;
    modelType: 'yield' | 'pressure' | 'time' | 'success';
    version: string;
    trainedAt: Date;
    trainingDataSize: number;
    accuracy: number;
    features: string[];
    modelPath: string;
  }
  ```
- **Version Control**: Maintain last 3 versions for rollback capability
- **Model Persistence**: Store models in both:
  - Database (metadata)
  - File system (serialized model files)

### 4. Training Monitoring & Logging
- **Training Metrics**:
  - Mean Absolute Error (MAE) for regression models
  - Accuracy/F1-score for classification models
  - Training duration
  - Memory usage during training

- **Logging System**:
  ```typescript
  interface TrainingLog {
    id: string;
    triggeredBy: 'shot_creation' | 'shot_update' | 'manual';
    startTime: Date;
    endTime: Date;
    status: 'started' | 'completed' | 'failed';
    dataPointsUsed: number;
    modelVersions: ModelVersion[];
    errors?: string[];
  }
  ```

## Technical Implementation

### 1. Backend Components

#### Training Service (`/src/services/trainingService.ts`)
```typescript
interface TrainingService {
  // Trigger training based on new data
  triggerTrainingOnNewShot(shotId: string): Promise<void>;
  
  // Check if training should run
  shouldTriggerTraining(): Promise<boolean>;
  
  // Execute training pipeline
  executeTraining(): Promise<TrainingResult>;
  
  // Get training status
  getTrainingStatus(): Promise<TrainingStatus>;
}
```

#### Model Manager (`/src/services/modelManager.ts`)
```typescript
interface ModelManager {
  // Load current models
  loadModels(): Promise<ModelRegistry>;
  
  // Save new models
  saveModels(models: ModelVersion[]): Promise<void>;
  
  // Get predictions using current models
  predict(features: ShotFeatures): Promise<Prediction>;
  
  // Rollback to previous model version
  rollbackModel(modelType: string, version: string): Promise<void>;
}
```

#### Training Queue System
- **Redis Queue**: For asynchronous training jobs
- **Worker Process**: Background training execution
- **Job Priority**: Manual triggers > batch imports > single shot updates

### 2. Database Schema Updates

#### New Tables
```sql
-- Model versions tracking
CREATE TABLE model_versions (
  id UUID PRIMARY KEY,
  model_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  trained_at TIMESTAMP NOT NULL,
  training_data_size INTEGER NOT NULL,
  accuracy DECIMAL(5,4),
  features JSONB,
  model_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Training logs
CREATE TABLE training_logs (
  id UUID PRIMARY KEY,
  triggered_by VARCHAR(50) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  data_points_used INTEGER,
  model_versions JSONB,
  errors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Training configuration
CREATE TABLE training_config (
  id UUID PRIMARY KEY,
  min_shots_for_training INTEGER DEFAULT 5,
  min_interval_minutes INTEGER DEFAULT 30,
  max_training_per_hour INTEGER DEFAULT 1,
  auto_training_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. API Endpoints

#### Training Management
```
POST /api/training/trigger
GET  /api/training/status
GET  /api/training/history
POST /api/training/config
GET  /api/models/current
POST /api/models/rollback
```

#### Response Formats
```typescript
// Training trigger response
interface TriggerTrainingResponse {
  success: boolean;
  message: string;
  trainingId?: string;
  estimatedDuration?: number;
}

// Training status response
interface TrainingStatusResponse {
  isTraining: boolean;
  currentTraining?: TrainingLog;
  lastTraining?: TrainingLog;
  queuedJobs: number;
}
```

### 4. Frontend Integration

#### Shot Form Integration
```typescript
// In ShotFormContainer.tsx
const handleSuccess = async () => {
  // ... existing success logic ...
  
  // Trigger training check
  try {
    await api.training.checkAndTrigger();
    toast.success('Shot saved! Model training initiated.');
  } catch (error) {
    toast.error('Shot saved, but training failed to start.');
  }
};
```

#### Training Status Component
```typescript
// New component: TrainingStatusIndicator.tsx
export const TrainingStatusIndicator = () => {
  const { data: trainingStatus } = useQuery({
    queryKey: ['training-status'],
    queryFn: () => api.training.getStatus(),
    refetchInterval: 30000, // Check every 30 seconds
  });

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
      {trainingStatus?.isTraining ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm">Training models...</span>
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          Last trained: {trainingStatus?.lastTraining?.endTime}
        </div>
      )}
    </div>
  );
};
```

## Non-Functional Requirements

### 1. Performance
- **Training Time**: Complete training within 2 minutes for 1000+ shots
- **Memory Usage**: Stay under 512MB during training
- **API Impact**: Training should not block other API requests

### 2. Reliability
- **Error Handling**: Graceful failure with detailed logging
- **Data Integrity**: Validate all input data before training
- **Rollback Capability**: Quick revert to previous working model

### 3. Usability
- **Progress Indication**: Real-time training progress
- **Clear Messaging**: User-friendly status updates
- **Configuration**: Admin controls for training thresholds

## Security Considerations

- **Data Privacy**: Ensure shot data remains confidential
- **Model Security**: Prevent unauthorized model access
- **Audit Trail**: Log all training activities

## Testing Strategy

### 1. Unit Tests
- Training service logic
- Model manager operations
- Data validation functions

### 2. Integration Tests
- End-to-end training pipeline
- API endpoint functionality
- Database operations

### 3. Performance Tests
- Training with large datasets
- Concurrent request handling
- Memory usage monitoring

## Success Metrics

### 1. Technical Metrics
- **Training Success Rate**: >95% automatic training completions
- **Model Accuracy**: Improve prediction accuracy by 10% within 100 shots
- **System Performance**: <2 second API response time during training

### 2. User Experience Metrics
- **Transparency**: Users can see training status and history
- **Reliability**: No data loss during training failures
- **Control**: Users can configure training behavior

## Implementation Phases

### Phase 1: Core Training Infrastructure
- Implement training service
- Create model management system
- Basic API endpoints

### Phase 2: User Interface Integration
- Training status indicators
- Configuration management
- History and monitoring

### Phase 3: Optimization & Monitoring
- Performance optimization
- Advanced monitoring
- Error recovery mechanisms

## Dependencies

### Technical Dependencies
- **Python ML Libraries**: scikit-learn, pandas, numpy
- **Job Queue**: Redis/RQ for async training
- **Model Storage**: Pickle for serialization, PostgreSQL for metadata

### External Services
- **Monitoring**: Application performance monitoring
- **Logging**: Structured logging service
- **Notifications**: Email/webhook for training failures

## Risks & Mitigations

### 1. Training Failures
- **Risk**: Model training crashes
- **Mitigation**: Try-catch blocks, fallback to previous model

### 2. Performance Degradation
- **Risk**: Training slows down system
- **Mitigation**: Background processing, rate limiting

### 3. Data Quality Issues
- **Risk**: Poor quality training data
- **Mitigation**: Data validation, outlier detection

---

*This feature specification provides the foundation for implementing automatic model training that continuously improves the espresso-ML system's prediction capabilities based on user-entered shot data.*
