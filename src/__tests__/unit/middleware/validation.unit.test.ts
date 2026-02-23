import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { validate, validateMachineExists, validateBeanBatchExists } from '../../middleware/validation/shotValidation';
import { CreateShotSchema, UpdateShotSchema, ShotQuerySchema } from '../../middleware/validation/schemas';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../middleware/errorHandler';

// Mock data-source module
jest.mock('../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

// Mock Express request/response
const mockRequest = (body: any = {}, query: any = {}, params: any = {}) => ({
  body,
  query,
  params,
  validated: {},
} as Request);

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate function', () => {
    it('should pass validation with valid data', async () => {
      const req = mockRequest({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale',
        success: true,
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(CreateShotSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.validated?.body).toBeDefined();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return validation error with invalid data', async () => {
      const req = mockRequest({
        machineId: 'invalid-uuid',
        beanBatchId: 'invalid-uuid',
        shot_type: 'invalid-type',
        success: 'not-boolean',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(CreateShotSchema, 'body')(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          message: 'Invalid input data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
              code: expect.any(String),
            }),
          ]),
        })
      );
    });

    it('should validate query parameters', async () => {
      const req = mockRequest({}, {
        page: '1',
        limit: '10',
        success: 'true',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(ShotQuerySchema, 'query')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.validated?.query).toBeDefined();
      expect((req.validated?.query as any)?.page).toBe(1);
      expect((req.validated?.query as any)?.limit).toBe(10);
      expect((req.validated?.query as any)?.success).toBe(true);
    });

    it('should validate route parameters', async () => {
      const req = mockRequest({}, {}, {
        id: '550e8400-e29b-41d4-a716-446655440000',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(CreateShotSchema.pick({ machineId: true }), 'params')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.validated?.params).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext;

      await validate(CreateShotSchema, 'body')(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'machineId',
            }),
            expect.objectContaining({
              field: 'beanBatchId',
            }),
            expect.objectContaining({
              field: 'shot_type',
            }),
          ]),
        })
      );
    });

    it('should handle business rule violations', async () => {
      const req = mockRequest({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale',
        preparation: {
          dose_grams: 18.0,
        },
        extraction: {
          dose_grams: 25.0, // Too different from preparation dose
          yield_grams: 100.0, // Too high ratio
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(CreateShotSchema, 'body')(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'extraction.dose_grams',
              message: expect.stringContaining('consistent within 0.5g'),
            }),
            expect.objectContaining({
              field: 'extraction.yield_grams',
              message: expect.stringContaining('between 0.5x and 3x'),
            }),
          ]),
        })
      );
    });
  });

  describe('Update validation', () => {
    it('should allow partial updates with valid data', async () => {
      const req = mockRequest({
        success: false,
        notes: 'Updated notes',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(UpdateShotSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.validated?.body).toBeDefined();
      expect((req.validated?.body as any)?.success).toBe(false);
      expect((req.validated?.body as any)?.notes).toBe('Updated notes');
    });

    it('should validate optional fields in updates', async () => {
      const req = mockRequest({
        extraction: {
          yield_grams: 36.0,
          extraction_time_seconds: 25,
        },
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(UpdateShotSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect((req.validated?.body as any)?.extraction).toBeDefined();
    });

    it('should reject invalid update data', async () => {
      const req = mockRequest({
        shot_type: 'invalid-type',
        success: 'not-boolean',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(UpdateShotSchema, 'body')(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'shot_type',
            }),
            expect.objectContaining({
              field: 'success',
            }),
          ]),
        })
      );
    });
  });

  describe('Query validation', () => {
    it('should validate pagination parameters', async () => {
      const req = mockRequest({}, {
        page: '2',
        limit: '15',
        sortBy: 'pulled_at',
        sortOrder: 'ASC',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(ShotQuerySchema, 'query')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect((req.validated?.query as any)?.page).toBe(2);
      expect((req.validated?.query as any)?.limit).toBe(15);
      expect((req.validated?.query as any)?.sortBy).toBe('pulled_at');
      expect((req.validated?.query as any)?.sortOrder).toBe('ASC');
    });

    it('should apply default values for query parameters', async () => {
      const req = mockRequest({}, {});
      const res = mockResponse();
      const next = mockNext;

      await validate(ShotQuerySchema, 'query')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect((req.validated?.query as any)?.page).toBe(1);
      expect((req.validated?.query as any)?.limit).toBe(20);
      expect((req.validated?.query as any)?.sortBy).toBe('pulled_at');
      expect((req.validated?.query as any)?.sortOrder).toBe('DESC');
    });

    it('should validate date range in query', async () => {
      const req = mockRequest({}, {
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-12-31T23:59:59Z',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(ShotQuerySchema, 'query')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.validated?.query?.dateFrom).toBe('2024-01-01T00:00:00Z');
      expect(req.validated?.query?.dateTo).toBe('2024-12-31T23:59:59Z');
    });

    it('should reject invalid date range', async () => {
      const req = mockRequest({}, {
        dateFrom: '2024-12-31T00:00:00Z',
        dateTo: '2024-01-01T00:00:00Z', // Before dateFrom
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(ShotQuerySchema, 'query')(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'dateTo',
              message: expect.stringContaining('dateFrom must be before'),
            }),
          ]),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle ZodError correctly', async () => {
      const req = mockRequest({
        machineId: 'invalid-uuid',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(CreateShotSchema, 'body')(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          message: 'Invalid input data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'machineId',
              message: expect.stringContaining('Invalid UUID format'),
            }),
          ]),
        })
      );
    });

    it('should pass non-Zod errors to next handler', async () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext;

      // Mock ZodError to throw a different error
      const mockError = new Error('Unexpected error');
      jest.spyOn(CreateShotSchema, 'parseAsync').mockRejectedValue(mockError);

      await validate(CreateShotSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Type safety', () => {
    it('should maintain TypeScript types for validated data', async () => {
      const req = mockRequest({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale' as const,
        success: true,
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(CreateShotSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      
      // TypeScript should infer the correct type
      const validatedData = req.validated?.body as any;
      expect(validatedData.shot_type).toBe('normale');
      expect(validatedData.success).toBe(true);
    });

    it('should handle optional fields correctly', async () => {
      const req = mockRequest({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale' as const,
        // Optional fields omitted
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(CreateShotSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalledWith();
      
      const validatedData = req.validated?.body as any;
      expect(validatedData.success).toBeUndefined();
      expect(validatedData.notes).toBeUndefined();
    });
  });
});

describe('Database Validation Middleware', () => {
  // Mock database operations
  const mockMachineRepository = {
    findOne: jest.fn(),
  };

  const mockBeanBatchRepository = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock repositories
    const { AppDataSource } = require('../../data-source');
    AppDataSource.getRepository.mockImplementation((entity: any) => {
      if (entity.name === 'Machine') return mockMachineRepository;
      if (entity.name === 'BeanBatch') return mockBeanBatchRepository;
      return {};
    });
  });

  describe('validateMachineExists', () => {
    it('should pass when machine exists', async () => {
      const req = mockRequest({ machineId: 'valid-machine-id' });
      const res = mockResponse();
      const next = mockNext;

      mockMachineRepository.findOne.mockResolvedValue({ id: 'valid-machine-id', model: 'Test Machine' });

      await validateMachineExists(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.validated?.machine).toBeDefined();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 404 when machine does not exist', async () => {
      const req = mockRequest({ machineId: 'non-existent-machine' });
      const res = mockResponse();
      const next = mockNext;

      mockMachineRepository.findOne.mockResolvedValue(null);

      await validateMachineExists(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          message: 'Machine not found',
          field: 'machineId',
        })
      );
    });

    it('should return 400 when machineId is missing', async () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext;

      await validateMachineExists(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          message: 'Machine ID is required',
        })
      );
    });

    it('should handle database errors', async () => {
      const req = mockRequest({ machineId: 'valid-machine-id' });
      const res = mockResponse();
      const next = mockNext;

      mockMachineRepository.findOne.mockRejectedValue(new Error('Database connection failed'));

      await validateMachineExists(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validateBeanBatchExists', () => {
    it('should pass when bean batch exists', async () => {
      const req = mockRequest({ beanBatchId: 'valid-batch-id' });
      const res = mockResponse();
      const next = mockNext;

      mockBeanBatchRepository.findOne.mockResolvedValue({ 
        id: 'valid-batch-id', 
        bean: { id: 'bean-id', name: 'Test Bean' }
      });

      await validateBeanBatchExists(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.validated?.beanBatch).toBeDefined();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 404 when bean batch does not exist', async () => {
      const req = mockRequest({ beanBatchId: 'non-existent-batch' });
      const res = mockResponse();
      const next = mockNext;

      mockBeanBatchRepository.findOne.mockResolvedValue(null);

      await validateBeanBatchExists(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          message: 'Bean batch not found',
          field: 'beanBatchId',
        })
      );
    });

    it('should return 400 when beanBatchId is missing', async () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext;

      await validateBeanBatchExists(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          message: 'Bean batch ID is required',
        })
      );
    });
  });
});
