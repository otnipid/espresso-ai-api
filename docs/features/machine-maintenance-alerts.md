# Feature Specification: Machine Maintenance Tracking and User Alerts

## Overview

This feature provides comprehensive machine maintenance scheduling, tracking, and alerting system for espresso-ML platform. It ensures optimal machine performance through preventive maintenance, timely notifications, and detailed maintenance history.

## User Stories

### Primary User Stories
**As a** barista **I want** to receive alerts when machine maintenance is due **so that** I can schedule service before problems occur and avoid downtime during busy periods.

**As a** barista **I want** to track machine maintenance history **so that** I can identify recurring issues and plan for replacements or upgrades.

**As a** barista **I want** to schedule maintenance tasks **so that** I can perform routine cleaning, calibration, and part replacements at optimal times.

### Secondary User Stories
- **As a** barista **I want** to see maintenance recommendations based on usage patterns **so that** I can optimize machine performance and lifespan.
- **As a** barista **I want** to receive multiple alert types (email, SMS, in-app) **so that** I never miss important maintenance notifications.
- **As an** administrator **I want** to manage maintenance schedules for multiple machines **so that** I can coordinate service across all equipment.
- **As a** barista **I want** to log maintenance activities **so that** I have a complete record of all service performed and can track costs.

## Functional Requirements

### 1. Maintenance Scheduling
- **Automated Scheduling**:
  - Usage-based scheduling (shots per day/week)
  - Time-based scheduling (hours of operation)
  - Performance-based scheduling (pressure consistency, temperature stability)
  - Calendar integration with conflict detection

- **Maintenance Types**:
  - **Daily**: Backflush cleaning, group head cleaning
  - **Weekly**: Deep cleaning, gasket inspection, water filter replacement
  - **Monthly**: Descaling, lubrication, seal inspection
  - **Quarterly**: Professional service, part replacement, calibration
  - **Annual**: Major overhaul, electronics inspection, warranty review

- **Smart Scheduling**:
  - Machine downtime detection and avoidance
  - Peak usage period identification
  - Weather/seasonal considerations
  - Staff availability integration

### 2. Alert System
- **Alert Types**:
  - **Maintenance Due**: Upcoming scheduled maintenance
  - **Performance Issues**: Declining metrics, error patterns
  - **Critical Alerts**: Machine failures, emergency maintenance
  - **Reminders**: Scheduled tasks, part replacements
  - **Achievement**: Maintenance milestones, streak tracking

- **Notification Channels**:
  - **In-App**: Real-time notifications, badge indicators
  - **Email**: Scheduled maintenance, reports, summaries
  - **SMS**: Critical alerts, immediate notifications
  - **Push**: Mobile push notifications for urgent issues

- **Alert Customization**:
  - User-defined alert thresholds
  - Quiet hours for non-critical alerts
  - Alert escalation preferences
  - Team member notifications

### 3. Maintenance Tracking
- **Activity Logging**:
  - Complete maintenance records
  - Time tracking per task
  - Parts and supplies inventory
  - Cost tracking and budgeting
  - Before/after performance metrics

- **Documentation**:
  - Photo uploads for maintenance activities
  - Notes and observations
  - Tool and equipment used
  - Issue resolution details
  - Performance impact assessment

- **Analytics**:
  - Maintenance frequency analysis
  - Downtime tracking and impact
  - Cost per shot analysis
  - Performance trend correlation
  - Predictive maintenance scheduling

## Technical Implementation

### 1. Backend Components

#### Maintenance Service (`/src/services/maintenanceService.ts`)
```typescript
interface MaintenanceService {
  // Scheduling operations
  scheduleMaintenance(task: MaintenanceTask): Promise<ScheduledMaintenance>;
  updateSchedule(maintenanceId: string, updates: ScheduleUpdate): Promise<void>;
  cancelMaintenance(maintenanceId: string): Promise<void>;
  
  // Alert management
  createAlert(alert: CreateAlertRequest): Promise<Alert>;
  getAlerts(userId: string, filters?: AlertFilters): Promise<Alert[]>;
  acknowledgeAlert(alertId: string): Promise<void>;
  dismissAlert(alertId: string): Promise<void>;
  
  // Maintenance tracking
  logMaintenance(log: MaintenanceLog): Promise<MaintenanceLog>;
  getMaintenanceHistory(machineId: string, filters?: MaintenanceFilters): Promise<MaintenanceLog[]>;
  getUpcomingMaintenance(userId: string): Promise<ScheduledMaintenance[]>;
  
  // Analytics and insights
  getMaintenanceAnalytics(machineId: string, timeframe: AnalyticsTimeframe): Promise<MaintenanceAnalytics>;
  getMaintenancePredictions(machineId: string): Promise<MaintenancePrediction[]>;
}

interface MaintenanceTask {
  machineId: string;
  type: MaintenanceType;
  title: string;
  description: string;
  estimatedDuration: number; // minutes
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: Date;
  recurringPattern?: RecurringPattern;
  requiredParts?: string[];
  requiredTools?: string[];
  estimatedCost?: number;
}

interface Alert {
  id: string;
  userId: string;
  machineId: string;
  type: AlertType;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'error' | 'critical';
  scheduledFor?: Date;
  isRead: boolean;
  isAcknowledged: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actions?: AlertAction[];
}

interface MaintenanceLog {
  id: string;
  machineId: string;
  userId: string;
  taskType: MaintenanceType;
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  partsUsed?: string[];
  toolsUsed?: string[];
  cost?: number;
  photos?: string[];
  performanceBefore?: PerformanceMetrics;
  performanceAfter?: PerformanceMetrics;
}
```

#### Maintenance Scheduler (`/src/services/maintenanceScheduler.ts`)
```typescript
interface MaintenanceScheduler {
  // Calculate optimal maintenance timing
  calculateOptimalSchedule(
    machineId: string, 
    usage: UsagePatterns,
    businessHours: BusinessHours
  ): Promise<OptimalSchedule>;
  
  // Detect maintenance conflicts
  detectScheduleConflicts(
    machineId: string,
    proposedDate: Date
  ): Promise<ScheduleConflict[]>;
  
  // Generate maintenance predictions
  predictMaintenanceNeeds(
    machineId: string,
    historicalData: MaintenanceLog[],
    performanceData: PerformanceMetrics[]
  ): Promise<MaintenancePrediction[]>;
  
  // Auto-schedule based on usage
  autoScheduleMaintenance(machineId: string): Promise<ScheduledMaintenance[]>;
}

interface OptimalSchedule {
  recommendedDates: Date[];
  reasoning: string;
  confidence: number;
  alternativeOptions: AlternativeSchedule[];
  conflictsAvoided: ScheduleConflict[];
}
```

### 2. Database Schema

#### Maintenance Tables
```sql
-- Maintenance schedules
CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP NOT NULL,
  estimated_duration INTEGER NOT NULL, -- minutes
  priority VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  recurring_pattern JSONB,
  required_parts JSONB,
  required_tools JSONB,
  estimated_cost DECIMAL(10,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance logs
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  task_type VARCHAR(50) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration INTEGER, -- minutes
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  parts_used JSONB,
  tools_used JSONB,
  cost DECIMAL(10,2),
  photos JSONB,
  performance_before JSONB,
  performance_after JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts system
CREATE TABLE maintenance_alerts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  machine_id UUID REFERENCES machines(id),
  alert_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL,
  scheduled_for TIMESTAMP,
  is_read BOOLEAN DEFAULT false,
  is_acknowledged BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  actions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User notification preferences
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  machine_id UUID REFERENCES machines(id),
  alert_types JSONB NOT NULL,
  notification_channels JSONB NOT NULL,
  quiet_hours JSONB,
  advance_notice_days INTEGER DEFAULT 7,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance analytics
CREATE TABLE maintenance_analytics (
  id UUID PRIMARY KEY,
  machine_id UUID REFERENCES machines(id),
  timeframe VARCHAR(50) NOT NULL,
  total_maintenance_time INTEGER, -- minutes
  total_cost DECIMAL(10,2),
  downtime_impact INTEGER, -- shots missed
  performance_change DECIMAL(5,2), -- percentage
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. API Endpoints

#### Maintenance Management
```
POST   /api/maintenance/schedule          # Schedule maintenance
GET    /api/maintenance/schedules/:machineId # Get machine schedules
PUT    /api/maintenance/schedules/:id        # Update schedule
DELETE /api/maintenance/schedules/:id        # Cancel schedule
POST   /api/maintenance/log               # Log maintenance activity
GET    /api/maintenance/logs/:machineId     # Get maintenance history
GET    /api/maintenance/upcoming           # Get upcoming maintenance

# Alerts
GET    /api/maintenance/alerts            # Get user alerts
POST   /api/maintenance/alerts            # Create alert
PUT    /api/maintenance/alerts/:id/acknowledge # Acknowledge alert
PUT    /api/maintenance/alerts/:id/dismiss   # Dismiss alert
GET    /api/maintenance/alerts/preferences # Get notification preferences
PUT    /api/maintenance/alerts/preferences # Update preferences

# Analytics
GET    /api/maintenance/analytics/:machineId # Get maintenance analytics
GET    /api/maintenance/predictions/:machineId # Get maintenance predictions
POST   /api/maintenance/optimize-schedule   # Get optimized schedule
```

#### Request/Response Formats
```typescript
// Schedule maintenance request
interface ScheduleMaintenanceRequest {
  machineId: string;
  taskType: MaintenanceType;
  title: string;
  description: string;
  scheduledDate: Date;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recurringPattern?: RecurringPattern;
  notifyUsers?: string[];
}

// Maintenance schedules response
interface MaintenanceSchedulesResponse {
  schedules: ScheduledMaintenance[];
  conflicts: ScheduleConflict[];
  recommendations: ScheduleRecommendation[];
  nextOptimalDate: Date;
}

// Alert preferences
interface AlertPreferences {
  alertTypes: AlertType[];
  notificationChannels: ('email' | 'sms' | 'in_app' | 'push')[];
  quietHours: { start: string; end: string }[];
  advanceNoticeDays: number;
  escalationRules: EscalationRule[];
}
```

### 4. Frontend Integration

#### Maintenance Dashboard Component
```typescript
// MaintenanceDashboard.tsx
export const MaintenanceDashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'schedule' | 'history' | 'analytics'>('schedule');
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<ScheduledMaintenance[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.getMachines()
  });
  
  const { data: schedules } = useQuery({
    queryKey: ['maintenance-schedules', selectedMachine],
    queryFn: () => selectedMachine ? api.maintenance.getSchedules(selectedMachine) : [],
    enabled: !!selectedMachine
  });
  
  return (
    <div className="space-y-6">
      {/* Machine Selection */}
      <MachineSelector 
        machines={machines || []}
        selectedMachine={selectedMachine}
        onMachineSelect={setSelectedMachine}
      />
      
      {/* Alert Summary */}
      <AlertSummary 
        alerts={alerts}
        onAcknowledge={(alertId) => api.maintenance.acknowledgeAlert(alertId)}
        onDismiss={(alertId) => api.maintenance.dismissAlert(alertId)}
      />
      
      {/* View Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['schedule', 'history', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setViewMode(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  viewMode === tab 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {viewMode === 'schedule' && (
            <MaintenanceSchedule 
              machineId={selectedMachine}
              schedules={schedules || []}
              onScheduleUpdate={() => {/* refetch */}}
            />
          )}
          
          {viewMode === 'history' && (
            <MaintenanceHistory 
              machineId={selectedMachine}
            />
          )}
          
          {viewMode === 'analytics' && (
            <MaintenanceAnalytics 
              machineId={selectedMachine}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// AlertSummary.tsx
export const AlertSummary = ({ alerts, onAcknowledge, onDismiss }: AlertSummaryProps) => {
  const criticalAlerts = alerts.filter(alert => alert.priority === 'critical');
  const unreadCount = alerts.filter(alert => !alert.isRead).length;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Maintenance Alerts</h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={() => {/* mark all as read */}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Mark All Read
          </button>
        </div>
      </div>
      
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-3">
          {criticalAlerts.map((alert) => (
            <AlertCard 
              key={alert.id}
              alert={alert}
              onAcknowledge={() => onAcknowledge(alert.id)}
              onDismiss={() => onDismiss(alert.id)}
            />
          ))}
        </div>
      )}
      
      {/* Other Alerts */}
      <div className="space-y-3">
        {alerts
          .filter(alert => alert.priority !== 'critical')
          .map((alert) => (
            <AlertCard 
              key={alert.id}
              alert={alert}
              onAcknowledge={() => onAcknowledge(alert.id)}
              onDismiss={() => onDismiss(alert.id)}
            />
          ))}
      </div>
    </div>
  );
};
```

## Non-Functional Requirements

### 1. Performance
- **Alert Delivery**: Notifications sent within 5 seconds of trigger
- **Schedule Calculation**: Optimal timing calculated within 2 seconds
- **Database Performance**: Maintenance queries optimized with proper indexing
- **Scalability**: Support 1000+ machines with 10000+ scheduled tasks

### 2. Usability
- **Intuitive Interface**: Clear maintenance status and scheduling
- **Mobile Responsive**: Maintenance dashboard works on all devices
- **Multi-language Support**: Localized maintenance terminology
- **Accessibility**: Screen reader compatible maintenance displays

### 3. Reliability
- **Alert Reliability**: 99.9% successful alert delivery
- **Schedule Accuracy**: 95% optimal timing predictions
- **Data Integrity**: Complete maintenance audit trail
- **Backup Recovery**: Restore schedules and preferences

## Security Considerations

- **Access Control**: Users only see alerts for their machines
- **Data Privacy**: Secure handling of maintenance data
- **Alert Security**: Prevent alert spoofing or unauthorized access
- **Schedule Integrity**: Prevent unauthorized schedule modifications
- **Audit Trail**: Complete logging of all maintenance activities

## Testing Strategy

### 1. Unit Tests
- Scheduling algorithm accuracy
- Alert generation logic
- Maintenance logging functionality
- Notification delivery systems

### 2. Integration Tests
- End-to-end maintenance workflows
- API endpoint functionality
- Database operations
- Frontend component rendering

### 3. Performance Tests
- Large dataset handling
- Concurrent scheduling operations
- Alert system performance under load
- Database query optimization

## Success Metrics

### 1. Technical Metrics
- **Alert Latency**: <5 seconds average delivery time
- **Schedule Optimization**: 90% of scheduled maintenance at optimal times
- **System Uptime**: >99.5% availability during maintenance windows
- **Database Performance**: <200ms average query response time

### 2. User Experience Metrics
- **Maintenance Compliance**: >85% of tasks completed on schedule
- **Alert Effectiveness**: >90% of alerts acknowledged within 1 hour
- **User Satisfaction**: >85% satisfaction with maintenance system
- **Downtime Reduction**: 50% reduction in unplanned machine downtime

## Implementation Phases

### Phase 1: Core Scheduling
- Basic maintenance scheduling
- Simple alert system
- Maintenance logging
- Machine status tracking

### Phase 2: Enhanced Intelligence
- Predictive maintenance scheduling
- Advanced analytics and insights
- Multi-channel notifications
- User preference learning

### Phase 3: Optimization & Automation
- Automatic schedule optimization
- Integration with business systems
- Advanced reporting and forecasting
- Mobile app notifications

## Dependencies

### Technical Dependencies
- **Scheduling**: Cron jobs, calendar integration
- **Notifications**: Email service, SMS gateway, push notifications
- **Analytics**: Time series analysis, predictive modeling
- **Database**: PostgreSQL with proper indexing for schedules

### External Services
- **Calendar**: Google Calendar, Outlook integration
- **Weather**: Environmental condition APIs
- **Parts Inventory**: Supplier API integration
- **Communication**: Slack, Teams integration for team alerts

## Risks & Mitigations

### 1. Missed Maintenance
- **Risk**: Critical maintenance not performed leads to machine failure
- **Mitigation**: Multiple alert channels, escalation procedures, backup schedules

### 2. Alert Fatigue
- **Risk**: Too many alerts cause users to ignore them
- **Mitigation**: Alert prioritization, smart grouping, quiet hours

### 3. Scheduling Conflicts
- **Risk**: Double bookings or resource conflicts
- **Mitigation**: Conflict detection, automatic resolution, user confirmation

---

*This feature specification provides comprehensive guidance for implementing a proactive maintenance system that minimizes downtime, extends equipment lifespan, and keeps baristas informed through intelligent scheduling and multi-channel alerting.*
