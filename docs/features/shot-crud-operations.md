# Feature Specification: Shot Data CRUD Operations

## Overview

This feature provides complete Create, Read, Update, and Delete (CRUD) functionality for shot data, including full integration with related entities like machines, beans, batches, and detailed shot parameters. This enables baristas to manage their entire shot history with rich context and relationships.

## User Stories

### Primary User Stories
**As a** barista **I want** to enter new shot data with all relevant parameters **so that** I can track my espresso preparation and build a comprehensive history.

**As a** barista **I want** to view my shot history with all related information **so that** I can analyze my performance and identify patterns.

**As a** barista **I want** to edit existing shot data **so that** I can correct mistakes or update missing information.

**As a** barista **I want** to delete shot records **so that** I can maintain clean and accurate data.

### Secondary User Stories
- **As a** barista **I want** to select machines, beans, and batches from dropdowns **so that** I can easily associate shots with the right equipment and ingredients.
- **As a** barista **I want** to see shot preparation and extraction details **so that** I can replicate successful shots precisely.
- **As a** barista **I want** to filter and sort my shot history **so that** I can find specific shots or analyze trends.
- **As a** barista **I want** to export my shot data **so that** I can backup or share my brewing history.

## Functional Requirements

### 1. Shot Data Entry (Create)
- **Comprehensive Form Fields**:
  - **Basic Info**: Date/time, shot type, success status
  - **Equipment Selection**: Machine, grinder, bean batch (with search/filter)
  - **Preparation Parameters**:
    - Grind setting (numeric with presets)
    - Dose weight (grams, with validation)
    - Basket type and size
    - Distribution method (WDT, Weiss, etc.)
    - Tamp type and pressure category
  - **Extraction Parameters**:
    - Yield weight (grams)
    - Extraction time (seconds, with timer)
    - Temperature (Celsius)
    - Pressure (bars)
    - Notes and observations

- **Form Validation**:
  - Required field validation
  - Numeric range validation
  - Date/time validation
  - Equipment relationship validation

- **Auto-save Functionality**:
  - Draft saving during entry
  - Recovery of incomplete entries
  - Confirmation before final save

### 2. Shot Data Viewing (Read)
- **List View**: 
  - Sortable columns (date, success, yield, etc.)
  - Filterable by date range, equipment, success status
  - Pagination for large datasets
  - Quick stats summary

- **Detail View**:
  - Complete shot information display
  - Related equipment details
  - Preparation vs extraction comparison
  - Historical context (similar shots)

- **Visual Elements**:
  - Success/failure indicators
  - Performance metrics visualization
  - Trend indicators
  - Equipment tags

### 3. Shot Data Editing (Update)
- **Inline Editing**: Quick edits from list view
- **Full Form Edit**: Complete parameter modification
- **Change Tracking**: Audit trail of modifications
- **Validation**: Same rules as creation

### 4. Shot Data Deletion
- **Soft Delete**: Mark as deleted with recovery option
- **Bulk Operations**: Multiple selection for batch deletion
- **Confirmation**: Clear warnings before deletion
- **Impact Analysis**: Show related data affected

## Technical Implementation

### 1. Backend Components

#### Shot Service (`/src/services/shotService.ts`)
```typescript
interface ShotService {
  // CRUD operations
  createShot(shotData: CreateShotRequest): Promise<Shot>;
  getShots(filters: ShotFilters, pagination: PaginationOptions): Promise<PaginatedResponse<Shot>>;
  getShot(id: string): Promise<Shot>;
  updateShot(id: string, updates: UpdateShotRequest): Promise<Shot>;
  deleteShot(id: string, options?: DeleteOptions): Promise<void>;
  
  // Bulk operations
  bulkDeleteShots(ids: string[]): Promise<BulkOperationResult>;
  bulkUpdateShots(updates: BulkUpdateRequest[]): Promise<BulkOperationResult>;
  
  // Advanced queries
  getShotsByDateRange(startDate: Date, endDate: Date): Promise<Shot[]>;
  getShotsByEquipment(machineId?: string, grinderId?: string): Promise<Shot[]>;
  getShotStatistics(timeframe: StatisticsTimeframe): Promise<ShotStatistics>;
}

interface CreateShotRequest {
  pulled_at: string;
  shot_type: string;
  success: boolean;
  bean_batch_id: string;
  machine_id: string;
  grinder_id: string;
  preparation: CreatePreparationRequest;
  extraction: CreateExtractionRequest;
  notes?: string;
}

interface UpdateShotRequest {
  pulled_at?: string;
  shot_type?: string;
  success?: boolean;
  bean_batch_id?: string;
  machine_id?: string;
  grinder_id?: string;
  preparation?: UpdatePreparationRequest;
  extraction?: UpdateExtractionRequest;
  notes?: string;
}
```

#### Enhanced Database Schema
```sql
-- Enhanced shots table with full relationships
CREATE TABLE shots (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  bean_batch_id UUID REFERENCES bean_batches(id),
  machine_id UUID REFERENCES machines(id),
  grinder_id UUID REFERENCES grinders(id),
  shot_type VARCHAR(50) NOT NULL,
  pulled_at TIMESTAMP NOT NULL,
  success BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP, -- Soft delete
  version INTEGER DEFAULT 1 -- For change tracking
);

-- Shot preparation details
CREATE TABLE shot_preparation (
  id UUID PRIMARY KEY,
  shot_id UUID REFERENCES shots(id) ON DELETE CASCADE,
  grind_setting DECIMAL(8,2),
  dose_grams DECIMAL(5,2),
  basket_type VARCHAR(50),
  basket_size_grams DECIMAL(5,2),
  distribution_method VARCHAR(50),
  tamp_type VARCHAR(50),
  tamp_pressure_category VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Shot extraction details
CREATE TABLE shot_extraction (
  id UUID PRIMARY KEY,
  shot_id UUID REFERENCES shots(id) ON DELETE CASCADE,
  dose_grams DECIMAL(5,2),
  yield_grams DECIMAL(5,2),
  extraction_time_seconds DECIMAL(5,2),
  temperature_celsius DECIMAL(5,2),
  pressure_bars DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Shot change tracking
CREATE TABLE shot_history (
  id UUID PRIMARY KEY,
  shot_id UUID REFERENCES shots(id),
  changed_fields JSONB NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Shot drafts for auto-save
CREATE TABLE shot_drafts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  draft_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

### 2. API Endpoints

#### CRUD Operations
```
POST   /api/shots                    # Create new shot
GET    /api/shots                    # List shots with filters
GET    /api/shots/:id                 # Get single shot
PUT    /api/shots/:id                 # Update shot
DELETE  /api/shots/:id                 # Delete shot
POST    /api/shots/bulk-delete          # Bulk delete
POST    /api/shots/bulk-update          # Bulk update

GET    /api/shots/statistics          # Shot statistics
GET    /api/shots/export              # Export data
GET    /api/shots/drafts              # Get user drafts
POST    /api/shots/drafts              # Save draft
```

#### Enhanced Request/Response Formats
```typescript
// List shots with advanced filtering
interface ListShotsQuery {
  page?: number;
  limit?: number;
  sortBy?: 'pulled_at' | 'success' | 'yield_grams' | 'extraction_time';
  sortOrder?: 'asc' | 'desc';
  filters?: {
    dateRange?: { start: string; end: string };
    machineId?: string;
    grinderId?: string;
    beanBatchId?: string;
    success?: boolean;
    shotType?: string;
  };
}

interface ShotListResponse {
  data: Shot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statistics: {
    totalShots: number;
    successRate: number;
    averageYield: number;
    averageTime: number;
  };
}

// Create shot with full relationships
interface CreateShotResponse {
  shot: Shot;
  relationships: {
    beanBatch: BeanBatch;
    machine: Machine;
    grinder: Grinder;
  };
  warnings?: string[];
}
```

### 3. Frontend Components

#### Enhanced Shot Form
```typescript
// ShotForm.tsx - Comprehensive form with all parameters
export const ShotForm = ({ initialData, onSuccess, onCancel }: ShotFormProps) => {
  const [draftSaved, setDraftSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    control, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors, dirtyFields } 
  } = useForm<ShotFormData>({
    defaultValues: initialData || defaultShotValues,
    resolver: shotFormValidator,
    mode: 'onChange'
  });
  
  // Auto-save draft functionality
  const debouncedSaveDraft = useMemo(
    () => debounce(async (data: ShotFormData) => {
      if (dirtyFields && Object.keys(dirtyFields).length > 0) {
        await api.shots.saveDraft(data);
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 3000);
      }
    }, 2000),
    [dirtyFields]
  );
  
  useEffect(() => {
    const subscription = watch((value) => {
      debouncedSaveDraft(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, debouncedSaveDraft]);
  
  const onSubmit = async (data: ShotFormData) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        await api.shots.updateShot(initialData.id, data);
        toast.success('Shot updated successfully!');
      } else {
        await api.shots.createShot(data);
        toast.success('Shot created successfully!');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save shot');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Draft saved indicator */}
      {draftSaved && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <span className="text-blue-800">Draft saved automatically</span>
        </div>
      )}
      
      {/* Basic Information Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="pulled_at"
            label="Date & Time"
            type="datetime-local"
            control={control}
            error={errors.pulled_at}
          />
          <FormField
            name="shot_type"
            label="Shot Type"
            type="select"
            control={control}
            error={errors.shot_type}
            options={shotTypeOptions}
          />
          <FormField
            name="success"
            label="Success"
            type="checkbox"
            control={control}
            error={errors.success}
          />
        </div>
      </div>
      
      {/* Equipment Selection Section */}
      <EquipmentSection 
        control={control}
        errors={errors}
        watch={watch}
        setValue={setValue}
      />
      
      {/* Preparation Section */}
      <PreparationSection 
        control={control}
        errors={errors}
        watch={watch}
      />
      
      {/* Extraction Section */}
      <ExtractionSection 
        control={control}
        errors={errors}
        watch={watch}
      />
      
      {/* Notes Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
        <FormField
          name="notes"
          label="Observations & Notes"
          type="textarea"
          rows={4}
          control={control}
          error={errors.notes}
          placeholder="Add any observations about this shot..."
        />
      </div>
      
      {/* Form Actions */}
      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        isDirty={Object.keys(dirtyFields).length > 0}
        submitText={initialData ? 'Update Shot' : 'Create Shot'}
      />
    </form>
  );
};
```

#### Enhanced Shot List
```typescript
// ShotList.tsx - Advanced list with filtering and bulk operations
export const ShotList = () => {
  const [filters, setFilters] = useState<ShotFilters>({});
  const [selectedShots, setSelectedShots] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const { 
    data: shotsData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['shots', filters],
    queryFn: () => api.shots.getShots(filters),
    keepPreviousData: true
  });
  
  const bulkDeleteMutation = useMutation({
    mutationFn: api.shots.bulkDeleteShots,
    onSuccess: () => {
      setSelectedShots([]);
      refetch();
      toast.success('Shots deleted successfully');
    }
  });
  
  const columns = useMemo(() => [
    {
      key: 'pulled_at',
      label: 'Date/Time',
      sortable: true,
      render: (shot: Shot) => (
        <div>
          <div className="font-medium">{format(new Date(shot.pulled_at), 'MMM dd, yyyy')}</div>
          <div className="text-sm text-gray-500">{format(new Date(shot.pulled_at), 'HH:mm')}</div>
        </div>
      )
    },
    {
      key: 'success',
      label: 'Result',
      sortable: true,
      render: (shot: Shot) => (
        <StatusIndicator success={shot.success} />
      )
    },
    // ... more columns
  ], []);
  
  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <ShotFilters 
        filters={filters}
        onFiltersChange={setFilters}
        onBulkDelete={(ids) => bulkDeleteMutation.mutate(ids)}
        selectedCount={selectedShots.length}
      />
      
      {/* View Toggle */}
      <ViewToggle 
        mode={viewMode}
        onModeChange={setViewMode}
      />
      
      {/* Data Display */}
      {viewMode === 'list' ? (
        <ShotTable 
          shots={shotsData?.data || []}
          columns={columns}
          selectedShots={selectedShots}
          onSelectionChange={setSelectedShots}
          isLoading={isLoading}
        />
      ) : (
        <ShotGrid 
          shots={shotsData?.data || []}
          selectedShots={selectedShots}
          onSelectionChange={setSelectedShots}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
```

## Non-Functional Requirements

### 1. Performance
- **Response Time**: CRUD operations within 200ms
- **Data Loading**: Lists load within 1 second for 1000+ records
- **Search Performance**: Filter/search results within 500ms
- **Memory Usage**: Efficient rendering for large datasets

### 2. Usability
- **Intuitive Interface**: Clear form sections and validation
- **Keyboard Navigation**: Full keyboard accessibility
- **Mobile Responsive**: Works on all screen sizes
- **Offline Support**: Basic functionality when offline

### 3. Data Integrity
- **Validation**: Comprehensive input validation
- **Relationship Integrity**: Maintain foreign key constraints
- **Audit Trail**: Complete change tracking
- **Backup/Recovery**: Draft saving and recovery options

## Security Considerations

- **Input Sanitization**: Prevent XSS and injection attacks
- **Authorization**: User can only modify their own shots
- **Rate Limiting**: Prevent abuse of bulk operations
- **Data Privacy**: Secure handling of sensitive brewing data

## Testing Strategy

### 1. Unit Tests
- Form validation logic
- CRUD service methods
- Data transformation functions
- Filter and sorting logic

### 2. Integration Tests
- End-to-end CRUD workflows
- API endpoint functionality
- Database operations
- Form submission flows

### 3. Performance Tests
- Large dataset handling
- Concurrent user operations
- Memory usage optimization
- Database query performance

## Success Metrics

### 1. Technical Metrics
- **CRUD Success Rate**: >99% successful operations
- **Data Accuracy**: 100% data integrity
- **Response Time**: <200ms for 95% of operations
- **Error Rate**: <1% for all operations

### 2. User Experience Metrics
- **Task Completion**: >90% of users complete intended tasks
- **Error Recovery**: >95% of users recover from errors
- **Efficiency**: 50% reduction in time to manage shots
- **Satisfaction**: >85% user satisfaction with interface

## Implementation Phases

### Phase 1: Core CRUD
- Basic create, read, update, delete operations
- Simple form and list components
- Basic validation and error handling

### Phase 2: Enhanced Features
- Advanced filtering and sorting
- Bulk operations
- Auto-save drafts
- Export functionality

### Phase 3: Advanced Features
- Real-time collaboration
- Advanced analytics
- Mobile optimization
- Offline capabilities

## Dependencies

### Technical Dependencies
- **Frontend**: React Hook Form, React Query, Date-fns
- **Backend**: Express.js, PostgreSQL, Joi for validation
- **State Management**: React Query for server state, local state for forms

### External Services
- **Date/Time**: Timezone handling
- **Export**: CSV/Excel export libraries
- **Analytics**: User interaction tracking
- **Notifications**: Email/webhook integrations

## Risks & Mitigations

### 1. Data Loss
- **Risk**: Accidental deletion of important data
- **Mitigation**: Soft delete, confirmation dialogs, recovery options

### 2. Performance Issues
- **Risk**: Slow performance with large datasets
- **Mitigation**: Pagination, virtualization, caching

### 3. User Error
- **Risk**: Users make data entry mistakes
- **Mitigation**: Validation, auto-save, clear error messages

---

*This feature specification provides comprehensive guidance for implementing full CRUD operations for shot data with rich relationships, advanced filtering, and excellent user experience.*
