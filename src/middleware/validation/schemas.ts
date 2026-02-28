import { z } from 'zod';

/**
 * Validation schemas for shot data based on user stories and requirements
 * These schemas provide comprehensive validation for all shot-related operations
 */

// Base shot type enum
const ShotTypeSchema = z.enum(['ristretto', 'normale', 'lungo']);

// UUID validation helper
const UUIDSchema = z.string().uuid('Invalid UUID format');

// Date validation helper
const DateSchema = z.string().datetime('Invalid datetime format').optional();

// Numeric range helpers
const PositiveNumberSchema = z.number().positive('Must be a positive number');
const NonNegativeNumberSchema = z.number().nonnegative('Must be zero or positive');
const PercentageSchema = z.number().min(0).max(100, 'Must be between 0 and 100');
const TemperatureSchema = z.number().min(0).max(120, 'Temperature must be between 0°C and 120°C');
const PressureSchema = z.number().min(0).max(20, 'Pressure must be between 0 and 20 bars');
const ScoreSchema = z.number().min(1).max(10, 'Score must be between 1 and 10');

// Shot Preparation schema
const ShotPreparationSchema = z.object({
  grind_setting: z
    .number()
    .int()
    .min(1)
    .max(50, 'Grind setting must be between 1 and 50')
    .optional(),
  dose_grams: z.number().min(1).max(30, 'Dose must be between 1 and 30 grams').optional(),
  basket_type: z.enum(['single', 'double', 'triple', 'bottomless', 'custom']).optional(),
  basket_weight_grams: PositiveNumberSchema.optional(),
  puck_thickness_mm: z
    .number()
    .min(1)
    .max(30, 'Puck thickness must be between 1 and 30mm')
    .optional(),
  tamping_pressure: PositiveNumberSchema.optional(),
  tamping_method: z.enum(['classic', 'nutating', 'stockfleth', 'custom']).optional(),
  distribution_method: z.enum(['none', 'WDT', 'naked', 'custom']).optional(),
  pre_infusion_time_seconds: NonNegativeNumberSchema.optional(),
  pre_infusion_pressure_bars: PressureSchema.optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Shot Extraction schema
const ShotExtractionSchema = z.object({
  dose_grams: z.number().min(1).max(30, 'Dose must be between 1 and 30 grams').optional(),
  yield_grams: z.number().min(1).max(100, 'Yield must be between 1 and 100 grams').optional(),
  extraction_time_seconds: z
    .number()
    .min(1)
    .max(300, 'Extraction time must be between 1 and 300 seconds')
    .optional(),
  temperature_celsius: TemperatureSchema.optional(),
  pressure_bars: PressureSchema.optional(),
  flow_rate_ml_s: PositiveNumberSchema.optional(),
  resistance_ohms: PositiveNumberSchema.optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Shot Environment schema
const ShotEnvironmentSchema = z.object({
  ambient_temp_c: z
    .number()
    .min(-10)
    .max(50, 'Ambient temperature must be between -10°C and 50°C')
    .optional(),
  humidity_percent: PercentageSchema.optional(),
  water_source: z.enum(['tap', 'filtered', 'bottled', 'reverse_osmosis', 'custom']).optional(),
  estimated_water_hardness_ppm: z
    .number()
    .min(0)
    .max(1000, 'Water hardness must be between 0 and 1000 ppm')
    .optional(),
  water_ph: z.number().min(6).max(9, 'Water pH must be between 6 and 9').optional(),
  machine_warmup_minutes: NonNegativeNumberSchema.optional(),
  shots_since_clean: z
    .number()
    .int()
    .min(0)
    .max(100, 'Shots since clean must be between 0 and 100')
    .optional(),
  portafilter_temp_c: TemperatureSchema.optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Shot Feedback schema
const ShotFeedbackSchema = z.object({
  overall_score: ScoreSchema.optional(),
  acidity: ScoreSchema.optional(),
  sweetness: ScoreSchema.optional(),
  bitterness: z.number().min(1).max(10, 'Bitterness must be between 1 and 10').optional(),
  body: ScoreSchema.optional(),
  finish: ScoreSchema.optional(),
  balance: ScoreSchema.optional(),
  flavor_notes: z
    .array(z.string().max(50, 'Flavor note must be less than 50 characters'))
    .max(10, 'Maximum 10 flavor notes allowed')
    .optional(),
  extraction_assessment: z
    .enum(['underextracted', 'optimal', 'overextracted', 'channeling', 'uneven'])
    .optional(),
  would_repeat: z.boolean().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

// Main Shot schema for creation
export const CreateShotSchema = z
  .object({
    machineId: UUIDSchema.refine(async id => {
      // This would be validated in the middleware with database check
      return true;
    }, 'Machine not found'),
    beanBatchId: UUIDSchema.refine(async id => {
      // This would be validated in the middleware with database check
      return true;
    }, 'Bean batch not found'),
    shot_type: ShotTypeSchema,
    pulled_at: DateSchema,
    success: z.boolean().optional(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
    preparation: ShotPreparationSchema.optional(),
    extraction: ShotExtractionSchema.optional(),
    environment: ShotEnvironmentSchema.optional(),
    feedback: ShotFeedbackSchema.optional(),
  })
  .refine(
    data => {
      // Business rule: If extraction data is provided, dose should be consistent
      if (data.preparation?.dose_grams && data.extraction?.dose_grams) {
        const doseDiff = Math.abs(data.preparation.dose_grams - data.extraction.dose_grams);
        return doseDiff <= 0.5; // Allow 0.5g tolerance
      }
      return true;
    },
    {
      message: 'Preparation and extraction doses should be consistent within 0.5g',
      path: ['extraction', 'dose_grams'],
    }
  )
  .refine(
    data => {
      // Business rule: Extraction yield should be reasonable compared to dose
      if (data.extraction?.dose_grams && data.extraction?.yield_grams) {
        const ratio = data.extraction.yield_grams / data.extraction.dose_grams;
        return ratio >= 0.5 && ratio <= 3.0; // 1:2 to 1:3 ratio is typical
      }
      return true;
    },
    {
      message: 'Extraction yield should be between 0.5x and 3x the dose',
      path: ['extraction', 'yield_grams'],
    }
  );

// Shot schema for updates (all fields optional)
export const UpdateShotSchema = z
  .object({
    machineId: UUIDSchema.optional(),
    beanBatchId: UUIDSchema.optional(),
    shot_type: ShotTypeSchema.optional(),
    pulled_at: DateSchema.optional(),
    success: z.boolean().optional(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
    preparation: ShotPreparationSchema.optional(),
    extraction: ShotExtractionSchema.optional(),
    environment: ShotEnvironmentSchema.optional(),
    feedback: ShotFeedbackSchema.optional(),
  })
  .refine(
    data => {
      // Apply the same business rules for updates
      if (data.preparation?.dose_grams && data.extraction?.dose_grams) {
        const doseDiff = Math.abs(data.preparation.dose_grams - data.extraction.dose_grams);
        return doseDiff <= 0.5;
      }
      return true;
    },
    {
      message: 'Preparation and extraction doses should be consistent within 0.5g',
      path: ['extraction', 'dose_grams'],
    }
  )
  .refine(
    data => {
      if (data.extraction?.dose_grams && data.extraction?.yield_grams) {
        const ratio = data.extraction.yield_grams / data.extraction.dose_grams;
        return ratio >= 0.5 && ratio <= 3.0;
      }
      return true;
    },
    {
      message: 'Extraction yield should be between 0.5x and 3x the dose',
      path: ['extraction', 'yield_grams'],
    }
  );

// Query parameters schema for filtering and pagination
export const ShotQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit cannot exceed 100')
      .default(20),
    machineId: UUIDSchema.optional(),
    beanBatchId: UUIDSchema.optional(),
    shot_type: ShotTypeSchema.optional(),
    success: z.coerce.boolean().optional(),
    dateFrom: DateSchema.optional(),
    dateTo: DateSchema.optional(),
    sortBy: z.enum(['pulled_at', 'shot_type', 'success', 'created_at']).default('pulled_at'),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
  })
  .refine(
    data => {
      // Business rule: dateFrom should be before dateTo
      if (data.dateFrom && data.dateTo) {
        return new Date(data.dateFrom) <= new Date(data.dateTo);
      }
      return true;
    },
    {
      message: 'dateFrom must be before or equal to dateTo',
      path: ['dateTo'],
    }
  );

// ID parameter schema
export const ShotIdSchema = z.object({
  id: UUIDSchema,
});

// Bulk operations schema
export const BulkShotIdsSchema = z.object({
  ids: z
    .array(UUIDSchema)
    .min(1, 'At least one ID must be provided')
    .max(50, 'Cannot process more than 50 items at once'),
});

// Export options schema
export const ExportOptionsSchema = z.object({
  format: z.enum(['csv', 'json', 'excel']).default('csv'),
  dateFrom: DateSchema.optional(),
  dateTo: DateSchema.optional(),
  machineId: UUIDSchema.optional(),
  beanBatchId: UUIDSchema.optional(),
  includeRelated: z.boolean().default(true),
  fields: z.array(z.string()).optional(),
});

// Type exports for TypeScript
export type CreateShotData = z.infer<typeof CreateShotSchema>;
export type UpdateShotData = z.infer<typeof UpdateShotSchema>;
export type ShotQueryParams = z.infer<typeof ShotQuerySchema>;
export type ShotIdParams = z.infer<typeof ShotIdSchema>;
export type BulkShotIdsData = z.infer<typeof BulkShotIdsSchema>;
export type ExportOptionsData = z.infer<typeof ExportOptionsSchema>;
