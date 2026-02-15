import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppDataSource } from '../../data-source';
import { Machine } from '../../entities/Machine';
import { BeanBatch } from '../../entities/BeanBatch';
import { Shot } from '../../entities/Shot';
import {
  CreateShotSchema,
  UpdateShotSchema,
  ShotQuerySchema,
  ShotIdSchema,
  BulkShotIdsSchema,
  ExportOptionsSchema,
  CreateShotData,
  UpdateShotData,
  ShotQueryParams,
  ShotIdParams,
  BulkShotIdsData,
  ExportOptionsData,
} from './schemas';

/**
 * Validation middleware factory function
 * Creates middleware that validates request data against a Zod schema
 */
export const validate = <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validatedData = await schema.parseAsync(data);
      
      // Store validated data in request for use in controllers
      req.validated = req.validated || {};
      (req.validated as any)[source] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid input data',
          details: validationErrors,
        });
      }
      
      // For non-Zod errors, pass to next error handler
      next(error);
    }
  };
};

/**
 * Custom validation middleware for machine existence
 * Validates that the machine ID exists in the database
 */
export const validateMachineExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const machineId = (req.validated?.body as any)?.machineId || req.body?.machineId;
    
    if (!machineId) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Machine ID is required',
      });
    }
    
    const machineRepository = AppDataSource.getRepository(Machine);
    const machine = await machineRepository.findOne({ where: { id: machineId } });
    
    if (!machine) {
      return res.status(404).json({
        error: 'Validation failed',
        message: 'Machine not found',
        field: 'machineId',
      });
    }
    
    // Store the machine in request for use in controllers
    req.validated = req.validated || {};
    req.validated.machine = machine;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Custom validation middleware for bean batch existence
 * Validates that the bean batch ID exists in the database
 */
export const validateBeanBatchExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const beanBatchId = (req.validated?.body as any)?.beanBatchId || req.body?.beanBatchId;
    
    if (!beanBatchId) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Bean batch ID is required',
      });
    }
    
    const beanBatchRepository = AppDataSource.getRepository(BeanBatch);
    const beanBatch = await beanBatchRepository.findOne({ 
      where: { id: beanBatchId },
      relations: ['bean']
    });
    
    if (!beanBatch) {
      return res.status(404).json({
        error: 'Validation failed',
        message: 'Bean batch not found',
        field: 'beanBatchId',
      });
    }
    
    // Store the bean batch in request for use in controllers
    req.validated = req.validated || {};
    req.validated.beanBatch = beanBatch;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Custom validation middleware for shot existence
 * Validates that the shot ID exists in the database
 */
export const validateShotExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shotId = req.validated?.params?.id || req.params?.id;
    
    if (!shotId) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Shot ID is required',
      });
    }
    
    const shotRepository = AppDataSource.getRepository(Shot);
    const shot = await shotRepository.findOne({ 
      where: { id: shotId },
      relations: ['machine', 'beanBatch', 'preparation', 'extraction', 'environment', 'feedback']
    });
    
    if (!shot) {
      return res.status(404).json({
        error: 'Validation failed',
        message: 'Shot not found',
        field: 'id',
      });
    }
    
    // Store the shot in request for use in controllers
    req.validated = req.validated || {};
    req.validated.shot = shot;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Custom validation middleware for multiple shot existence
 * Validates that all shot IDs in an array exist in the database
 */
export const validateMultipleShotsExist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = (req.validated?.body as any)?.ids || req.body?.ids;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'At least one shot ID is required',
      });
    }
    
    const shotRepository = AppDataSource.getRepository(Shot);
    const shots = await shotRepository.find({
      where: ids.map(id => ({ id })),
      relations: ['machine', 'beanBatch']
    });
    
    if (shots.length !== ids.length) {
      const foundIds = shots.map(shot => shot.id);
      const missingIds = ids.filter((id: string) => !foundIds.includes(id));
      
      return res.status(404).json({
        error: 'Validation failed',
        message: 'Some shots not found',
        missingIds,
      });
    }
    
    // Store the shots in request for use in controllers
    req.validated = req.validated || {};
    req.validated.shots = shots;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Business logic validation middleware
 * Validates business rules that require database context
 */
export const validateShotBusinessRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shotData = req.validated?.body || req.body;
    
    // Validate extraction ratios if both dose and yield are provided
    if (shotData.extraction?.dose_grams && shotData.extraction?.yield_grams) {
      const dose = shotData.extraction.dose_grams;
      const yield_ = shotData.extraction.yield_grams;
      const ratio = yield_ / dose;
      
      if (ratio < 0.5 || ratio > 3.0) {
        return res.status(400).json({
          error: 'Business rule violation',
          message: 'Extraction yield should be between 0.5x and 3x the dose',
          field: 'extraction.yield_grams',
          currentRatio: ratio,
          expectedRange: '0.5 - 3.0',
        });
      }
    }
    
    // Validate dose consistency between preparation and extraction
    if (shotData.preparation?.dose_grams && shotData.extraction?.dose_grams) {
      const prepDose = shotData.preparation.dose_grams;
      const extDose = shotData.extraction.dose_grams;
      const difference = Math.abs(prepDose - extDose);
      
      if (difference > 0.5) {
        return res.status(400).json({
          error: 'Business rule violation',
          message: 'Preparation and extraction doses should be consistent within 0.5g',
          field: 'extraction.dose_grams',
          preparationDose: prepDose,
          extractionDose: extDose,
          difference,
        });
      }
    }
    
    // Validate date ranges
    if (shotData.pulled_at) {
      const pulledAt = new Date(shotData.pulled_at);
      const now = new Date();
      
      if (pulledAt > now) {
        return res.status(400).json({
          error: 'Business rule violation',
          message: 'Shot cannot be pulled in the future',
          field: 'pulled_at',
          pulledAt: shotData.pulled_at,
          currentTime: now.toISOString(),
        });
      }
      
      // Don't allow shots older than 1 year in the future
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (pulledAt < oneYearAgo) {
        return res.status(400).json({
          error: 'Business rule violation',
          message: 'Shot date cannot be more than 1 year old',
          field: 'pulled_at',
          pulledAt: shotData.pulled_at,
          minimumAllowedDate: oneYearAgo.toISOString(),
        });
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validation middleware for query parameters
 * Ensures query parameters are properly validated for filtering and pagination
 */
export const validateShotQuery = validate(ShotQuerySchema, 'query');

/**
 * Validation middleware for shot creation
 * Combines schema validation with database validation
 */
export const validateCreateShot = [
  validate(CreateShotSchema, 'body'),
  validateMachineExists,
  validateBeanBatchExists,
  validateShotBusinessRules,
];

/**
 * Validation middleware for shot updates
 * Combines schema validation with optional database validation
 */
export const validateUpdateShot = [
  validate(UpdateShotSchema, 'body'),
  // Only validate machine/bean batch if they're being updated
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updateData = (req.validated?.body as any);
      
      if (updateData?.machineId) {
        await validateMachineExists(req, res, next);
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updateData = (req.validated?.body as any);
      
      if (updateData?.beanBatchId) {
        await validateBeanBatchExists(req, res, next);
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  },
  validateShotBusinessRules,
];

/**
 * Validation middleware for shot ID parameter
 */
export const validateShotId = [
  validate(ShotIdSchema, 'params'),
  validateShotExists,
];

/**
 * Validation middleware for bulk operations
 */
export const validateBulkShotIds = [
  validate(BulkShotIdsSchema, 'body'),
  validateMultipleShotsExist,
];

/**
 * Validation middleware for export options
 */
export const validateExportOptions = validate(ExportOptionsSchema, 'query');

// Extend Express Request type to include validated data
declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: CreateShotData | UpdateShotData | BulkShotIdsData;
        query?: ShotQueryParams | ExportOptionsData;
        params?: ShotIdParams;
        machine?: Machine;
        beanBatch?: BeanBatch;
        shot?: Shot;
        shots?: Shot[];
      };
    }
  }
}
