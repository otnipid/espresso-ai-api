# Feature Specification: Bean Grinding Insights Based on Barista Rules

## Overview

This feature provides intelligent recommendations for bean grinding settings based on well-established barista rules, user preferences, historical performance data, and bean characteristics. It helps baristas achieve consistent extraction and optimal flavor profiles through data-driven grinding guidance.

## User Stories

### Primary User Story
**As a** barista **I want** to receive grinding recommendations for my beans **when** I select them for a shot **so that** I can achieve optimal extraction and flavor consistency.

### Secondary User Stories
- **As a** barista **I want** to understand why certain grind settings work better **so that** I can improve my technique and knowledge.
- **As a** barista **I want** to save successful grinding combinations **so that** I can quickly replicate good results.
- **As a** barista **I want** to see grinding recommendations based on bean characteristics **so that** I can adapt my approach to different coffee origins.
- **As a** barista **I want** to receive real-time grinding adjustments **when** I change equipment or beans **so that** I can maintain optimal settings.

## Functional Requirements

### 1. Barista Rule Engine
- **Rule Categories**:
  - **Extraction Rules**: Target extraction times (1:1.5 to 1:2.5 ratio)
  - **Flavor Rules**: Balance between acidity, sweetness, and bitterness
  - **Consistency Rules**: Grind uniformity and particle size distribution
  - **Equipment Rules**: Machine-specific and grinder-specific optimizations

- **Rule Definitions**:
  ```typescript
  interface GrindingRule {
    id: string;
    name: string;
    category: 'extraction' | 'flavor' | 'consistency' | 'equipment';
    conditions: RuleCondition[];
    recommendations: GrindingRecommendation[];
    priority: 'high' | 'medium' | 'low';
    source: 'community' | 'expert' | 'ml-derived';
    confidence: number; // 0-100
  }

  interface RuleCondition {
    parameter: 'bean_type' | 'roast_level' | 'machine_type' | 'grinder_type';
    operator: 'equals' | 'in_range' | 'greater_than' | 'less_than';
    value: string | number | boolean;
  }

  interface GrindingRecommendation {
    type: 'grind_setting' | 'technique' | 'equipment_adjustment';
    description: string;
    value: number | string;
    range?: { min: number; max: number };
    reasoning: string;
  }
  ```

### 2. Bean Analysis System
- **Bean Characteristics**:
  - Origin and growing region analysis
  - Processing method impact on grind
  - Roast level optimization
  - Density and moisture content considerations
  - Varietal-specific recommendations

- **Grinding Calculations**:
  - Optimal particle size distribution
  - Surface area calculations
  - Extraction resistance estimates
  - Flow rate predictions

### 3. Recommendation Engine
- **Multi-factor Analysis**:
  - Bean characteristics × Equipment capabilities
  - Historical shot performance × Current conditions
  - Environmental factors (humidity, temperature)
  - User preferences and taste profile

- **Real-time Adjustments**:
  - Dynamic grind setting updates
  - Equipment compensation factors
  - Environmental condition adaptations
  - User feedback integration

## Technical Implementation

### 1. Backend Components

#### Grinding Insights Service (`/src/services/grindingInsightsService.ts`)
```typescript
interface GrindingInsightsService {
  // Get grinding recommendations for specific bean
  getGrindingRecommendations(
    beanId: string, 
    equipment: EquipmentInfo,
    userPreferences?: UserPreferences
  ): Promise<GrindingInsights>;
  
  // Apply barista rules to current context
  applyBaristaRules(
    context: GrindingContext
  ): Promise<RuleApplication[]>;
  
  // Get optimal grind settings based on historical data
  getOptimalGrindSettings(
    beanId: string,
    historicalShots: Shot[]
  ): Promise<OptimalSettings>;
  
  // Update rule engine with new community rules
  updateCommunityRules(rules: GrindingRule[]): Promise<void>;
  
  // Get rule explanations
  getRuleExplanation(ruleId: string): Promise<RuleExplanation>;
}

interface GrindingContext {
  bean: Bean;
  equipment: {
    machine: Machine;
    grinder: Grinder;
  };
  environment: {
    humidity: number;
    temperature: number;
    altitude: number;
  };
  userPreferences?: UserPreferences;
  shotHistory: Shot[];
}

interface GrindingInsights {
  recommendations: GrindingRecommendation[];
  appliedRules: RuleApplication[];
  optimalSettings: OptimalSettings;
  confidence: number;
  reasoning: string;
  alternativeApproaches: AlternativeApproach[];
}

interface OptimalSettings {
  grindSetting: number;
  particleSizeDistribution: ParticleSizeRange;
  extractionTarget: ExtractionTarget;
  flavorProfile: FlavorProfile;
  consistency: ConsistencyMetrics;
}
```

#### Barista Rules Engine (`/src/services/baristaRulesEngine.ts`)
```typescript
interface BaristaRulesEngine {
  // Load and categorize rules
  loadRules(): Promise<GrindingRule[]>;
  
  // Apply rules to specific context
  evaluateRules(context: GrindingContext): Promise<RuleApplication[]>;
  
  // Create custom rules
  createCustomRule(rule: CreateRuleRequest): Promise<GrindingRule>;
  
  // Validate rule logic
  validateRule(rule: GrindingRule): Promise<RuleValidation>;
  
  // Get rule conflicts
  getRuleConflicts(rule: GrindingRule): Promise<RuleConflict[]>;
}

interface RuleApplication {
  ruleId: string;
  ruleName: string;
  applied: boolean;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  result: GrindingRecommendation;
  explanation: string;
}

interface ParticleSizeRange {
  fine: number;    // < 400 microns
  medium: number;  // 400-800 microns
  coarse: number;   // > 800 microns
  distribution: {
    fine: number;    // percentage
    medium: number;  // percentage
    coarse: number;   // percentage
  };
}
```

### 2. Database Schema

#### Grinding Rules Storage
```sql
-- Barista rules table
CREATE TABLE grinding_rules (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  conditions JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  priority VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Grinding insights cache
CREATE TABLE grinding_insights_cache (
  id UUID PRIMARY KEY,
  bean_id UUID REFERENCES beans(id),
  equipment_info JSONB NOT NULL,
  insights JSONB NOT NULL,
  optimal_settings JSONB NOT NULL,
  confidence DECIMAL(3,2),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User grinding preferences
CREATE TABLE user_grinding_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  bean_id UUID REFERENCES beans(id),
  preferred_grind_setting DECIMAL(5,2),
  flavor_profile_preference JSONB,
  extraction_target VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Grinding rule applications (audit trail)
CREATE TABLE grinding_rule_applications (
  id UUID PRIMARY KEY,
  rule_id UUID REFERENCES grinding_rules(id),
  user_id UUID REFERENCES users(id),
  context JSONB NOT NULL,
  applied BOOLEAN NOT NULL,
  confidence DECIMAL(3,2),
  impact VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. API Endpoints

#### Grinding Insights Management
```
GET  /api/grinding-insights/recommendations
GET  /api/grinding-insights/rules
POST /api/grinding-insights/rules
PUT  /api/grinding-insights/rules/:id
DELETE /api/grinding-insights/rules/:id
GET  /api/grinding-insights/optimal-settings
POST /api/grinding-insights/feedback
GET  /api/grinding-insights/explanations
```

#### Request/Response Formats
```typescript
// Grinding recommendations request
interface GrindingRecommendationsRequest {
  beanId: string;
  equipment: EquipmentInfo;
  userPreferences?: UserPreferences;
  includeRules?: boolean;
  includeHistorical?: boolean;
}

// Grinding recommendations response
interface GrindingRecommendationsResponse {
  insights: GrindingInsights;
  processingTime: number;
  rulesApplied: RuleApplication[];
  alternatives: AlternativeApproach[];
  lastUpdated: Date;
}

// Equipment info
interface EquipmentInfo {
  machine: {
    id: string;
    model: string;
    type: 'espresso' | 'pour-over' | 'french-press';
  };
  grinder: {
    id: string;
    model: string;
    burrType: string;
    burrSize: number;
  };
}
```

### 4. Frontend Integration

#### Grinding Insights Component
```typescript
// GrindingInsights.tsx
export const GrindingInsights = ({ beanId, equipment }: GrindingInsightsProps) => {
  const [insights, setInsights] = useState<GrindingInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  
  const { data: bean } = useQuery({
    queryKey: ['bean', beanId],
    queryFn: () => api.beans.getBean(beanId),
    enabled: !!beanId
  });
  
  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const result = await api.grindingInsights.getRecommendations({
        beanId,
        equipment,
        userPreferences: user?.preferences
      });
      setInsights(result.insights);
    } catch (error) {
      toast.error('Failed to load grinding insights');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (beanId && equipment) {
      fetchInsights();
    }
  }, [beanId, equipment, fetchInsights]);
  
  return (
    <div className="space-y-6">
      {/* Bean Information */}
      {bean && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {bean.name} - {bean.roaster}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>Origin: {bean.country || 'Unknown'}</div>
            <div>Roast: {bean.processing_method}</div>
            <div>Varietal: {bean.varietal || 'N/A'}</div>
            <div>Altitude: {bean.altitude_m || 'N/A'}m</div>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-blue-600">Analyzing grinding requirements...</span>
        </div>
      )}
      
      {/* Grinding Insights */}
      {insights && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Grinding Recommendations</h3>
          
          {/* Optimal Settings */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Optimal Grind Setting</h4>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-blue-600">
                {insights.optimalSettings.grindSetting}
              </div>
              <div className="ml-4 text-sm text-gray-600">
                (Scale: 1-10, where 1 = finest)
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Confidence: {Math.round(insights.confidence * 100)}%
            </div>
          </div>
          
          {/* Particle Size Distribution */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Particle Size Distribution</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-20 text-sm text-gray-600">Fine:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 ml-2">
                  <div 
                    className="h-4 bg-blue-500 rounded-full"
                    style={{ width: `${insights.optimalSettings.particleSizeDistribution.distribution.fine}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-medium">{insights.optimalSettings.particleSizeDistribution.distribution.fine}%</span>
              </div>
              <div className="flex items-center">
                <span className="w-20 text-sm text-gray-600">Medium:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 ml-2">
                  <div 
                    className="h-4 bg-yellow-500 rounded-full"
                    style={{ width: `${insights.optimalSettings.particleSizeDistribution.distribution.medium}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-medium">{insights.optimalSettings.particleSizeDistribution.distribution.medium}%</span>
              </div>
              <div className="flex items-center">
                <span className="w-20 text-sm text-gray-600">Coarse:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 ml-2">
                  <div 
                    className="h-4 bg-red-500 rounded-full"
                    style={{ width: `${insights.optimalSettings.particleSizeDistribution.distribution.coarse}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-medium">{insights.optimalSettings.particleSizeDistribution.distribution.coarse}%</span>
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-800 mb-3">Recommendations</h4>
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="border-l-4 border-gray-200 pl-4">
                <div className="font-medium text-gray-900">{rec.description}</div>
                <div className="text-sm text-gray-600 mt-1">{rec.reasoning}</div>
                {rec.range && (
                  <div className="text-xs text-gray-500 mt-1">
                    Recommended: {rec.range.min} - {rec.range.max}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Applied Rules */}
          {insights.appliedRules.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium text-gray-800 mb-3">Applied Barista Rules</h4>
              <div className="space-y-2">
                {insights.appliedRules.map((rule, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{rule.ruleName}</div>
                      <div className="text-sm text-gray-600">{rule.explanation}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      rule.impact === 'high' ? 'bg-red-100 text-red-800' :
                      rule.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rule.impact} impact
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

## Non-Functional Requirements

### 1. Performance
- **Response Time**: Grinding insights within 1 second
- **Rule Processing**: Evaluate 100+ rules in <500ms
- **Cache Performance**: 95% cache hit rate for bean/equipment combinations
- **Scalability**: Handle 1000+ concurrent insight requests

### 2. Usability
- **Intuitive Interface**: Clear visual indicators and recommendations
- **Educational Content**: Explain why recommendations are made
- **Mobile Responsive**: Grinding insights work on all screen sizes
- **Accessibility**: Screen reader compatible rule explanations

### 3. Reliability
- **Fallback Behavior**: Provide basic recommendations when insights fail
- **Rule Validation**: Prevent conflicting or impossible rules
- **Data Quality**: Validate all input parameters
- **Offline Support**: Cached insights for common scenarios

## Security Considerations

- **Input Validation**: Sanitize all grinding parameters
- **Rule Security**: Prevent malicious rule injection
- **Privacy Protection**: Secure handling of user preferences
- **Access Control**: Users can only access their own grinding data
- **Audit Trail**: Log all rule applications and modifications

## Testing Strategy

### 1. Unit Tests
- Rule engine logic
- Grinding calculation algorithms
- Recommendation generation
- Bean analysis functions

### 2. Integration Tests
- End-to-end insight generation
- API endpoint functionality
- Database query performance
- Frontend component rendering

### 3. Performance Tests
- Large rule set processing
- Concurrent insight requests
- Cache efficiency measurements
- Memory usage during analysis

## Success Metrics

### 1. Technical Metrics
- **Insight Accuracy**: >90% of recommendations lead to successful shots
- **Rule Processing**: <100ms average evaluation time
- **System Performance**: <500ms API response time
- **Cache Hit Rate**: >85% for common bean/equipment combos

### 2. User Experience Metrics
- **Recommendation Helpfulness**: >80% of users find insights useful
- **Grinding Consistency**: Users achieve 25% more consistent extraction
- **Knowledge Transfer**: >70% of users understand grinding principles
- **Engagement**: >60% of users interact with rule explanations

## Implementation Phases

### Phase 1: Core Rule Engine
- Implement basic barista rules
- Create grinding calculation algorithms
- Build recommendation system
- Develop API endpoints

### Phase 2: Enhanced Intelligence
- Add machine learning to rule generation
- Implement advanced bean analysis
- Add user preference learning
- Create feedback system

### Phase 3: Optimization & Personalization
- Personalized rule recommendations
- Advanced visualization and reporting
- Community rule sharing
- Mobile optimization

## Dependencies

### Technical Dependencies
- **ML Libraries**: scikit-learn, pandas, numpy
- **Rule Engine**: Custom rule evaluation framework
- **Caching**: Redis for insight caching
- **Analytics**: User interaction tracking

### External Services
- **Coffee Data**: Integration with specialty coffee databases
- **Environmental APIs**: Weather and humidity data
- **Community Rules**: Integration with barista communities
- **Educational Content**: Coffee science and brewing resources

## Risks & Mitigations

### 1. Poor Recommendations
- **Risk**: Bad grinding advice leads to poor shots
- **Mitigation**: Expert validation, community feedback, A/B testing

### 2. Rule Conflicts
- **Risk**: Contradictory rules confuse users
- **Mitigation**: Conflict detection, priority system, rule versioning

### 3. Over-reliance
- **Risk**: Users depend too heavily on automated insights
- **Mitigation**: Educational content, skill development emphasis, manual override options

---

*This feature specification provides comprehensive guidance for implementing an intelligent grinding insights system that helps baristas achieve optimal extraction through data-driven recommendations based on established barista rules and bean characteristics.*
