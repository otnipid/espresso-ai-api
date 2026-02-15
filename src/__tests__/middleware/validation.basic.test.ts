import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

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

describe('Validation Middleware - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should validate basic UUID format', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { CreateShotSchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(CreateShotSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid UUID format', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { CreateShotSchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({
        machineId: 'invalid-uuid',
        beanBatchId: 'invalid-uuid',
        shot_type: 'normale',
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
        })
      );
    });

    it('should validate shot type enum', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { CreateShotSchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'invalid-type',
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
              field: 'shot_type',
            }),
          ]),
        })
      );
    });

    it('should validate numeric ranges', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { CreateShotSchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale',
        extraction: {
          dose_grams: -5, // Invalid: negative
          yield_grams: 200, // Invalid: too high
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
            }),
            expect.objectContaining({
              field: 'extraction.yield_grams',
            }),
          ]),
        })
      );
    });
  });

  describe('Query Parameter Validation', () => {
    it('should validate pagination parameters', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { ShotQuerySchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({}, {
        page: '1',
        limit: '10',
        sortBy: 'pulled_at',
        sortOrder: 'ASC',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(ShotQuerySchema, 'query')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should apply default values', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { ShotQuerySchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({}, {});
      const res = mockResponse();
      const next = mockNext;

      await validate(ShotQuerySchema, 'query')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should validate date ranges', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { ShotQuerySchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({}, {
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-12-31T23:59:59Z',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(ShotQuerySchema, 'query')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid date ranges', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { ShotQuerySchema } = require('../../middleware/validation/schemas');

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
            }),
          ]),
        })
      );
    });
  });

  describe('Business Rule Validation', () => {
    it('should validate dose consistency', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { CreateShotSchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale',
        preparation: {
          dose_grams: 18.0,
        },
        extraction: {
          dose_grams: 25.0, // Too different from preparation dose
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
          ]),
        })
      );
    });

    it('should validate extraction ratios', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { CreateShotSchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale',
        extraction: {
          dose_grams: 18.0,
          yield_grams: 100.0, // Too high ratio (5.5x)
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
              field: 'extraction.yield_grams',
              message: expect.stringContaining('between 0.5x and 3x'),
            }),
          ]),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should format validation errors correctly', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { CreateShotSchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({
        machineId: 'invalid-uuid',
        shot_type: 'invalid-type',
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
          code: undefined,
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

    it('should handle missing required fields', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { CreateShotSchema } = require('../../middleware/validation/schemas');

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
  });

  describe('Update Validation', () => {
    it('should allow partial updates', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { UpdateShotSchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({
        success: false,
        notes: 'Updated notes',
      });
      const res = mockResponse();
      const next = mockNext;

      await validate(UpdateShotSchema, 'body')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should validate update data types', async () => {
      const { validate } = require('../../middleware/validation/shotValidation');
      const { UpdateShotSchema } = require('../../middleware/validation/schemas');

      const req = mockRequest({
        success: 'not-boolean',
        shot_type: 'invalid-type',
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
              field: 'success',
            }),
            expect.objectContaining({
              field: 'shot_type',
            }),
          ]),
        })
      );
    });
  });
});

describe('Error Handler Middleware - Basic Tests', () => {
  it('should handle validation errors', () => {
    const { errorHandler } = require('../../middleware/errorHandler');
    const { ValidationError } = require('../../middleware/errorHandler');

    const error = new ValidationError('Test validation error', { field: 'test' });
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation Error',
        message: 'Test validation error',
        code: 'VALIDATION_FAILED',
        details: { field: 'test' },
      })
    );
  });

  it('should handle not found errors', () => {
    const { errorHandler } = require('../../middleware/errorHandler');
    const { NotFoundError } = require('../../middleware/errorHandler');

    const error = new NotFoundError('Resource not found');
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Not Found',
        message: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND',
      })
    );
  });

  it('should handle business rule errors', () => {
    const { errorHandler } = require('../../middleware/errorHandler');
    const { BusinessRuleError } = require('../../middleware/errorHandler');

    const error = new BusinessRuleError('Business rule violated', { rule: 'test' });
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Business Rule Violation',
        message: 'Business rule violated',
        code: 'BUSINESS_RULE_VIOLATION',
        details: { rule: 'test' },
      })
    );
  });

  it('should handle Zod validation errors', () => {
    const { errorHandler } = require('../../middleware/errorHandler');
    const { ZodError } = require('zod');

    const zodError = new ZodError([
      {
        code: 'invalid_string',
        path: ['test'],
        message: 'Invalid string',
      },
    ]);

    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext;

    errorHandler(zodError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation Error',
        message: 'Invalid input data provided',
        code: 'VALIDATION_FAILED',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'test',
            message: 'Invalid string',
            code: 'invalid_string',
          }),
        ]),
      })
    );
  });

  it('should handle default errors', () => {
    const { errorHandler } = require('../../middleware/errorHandler');

    const error = new Error('Unexpected error');
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal Server Error',
        message: expect.any(String),
        code: 'INTERNAL_ERROR',
      })
    );
  });
});
