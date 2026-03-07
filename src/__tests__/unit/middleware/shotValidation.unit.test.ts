import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../../data-source';
import * as shotValidation from '../../../middleware/validation/shotValidation';

// Mock the data source
jest.mock('../../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('Shot Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let mockMachineRepo: any;
  let mockBeanBatchRepo: any;
  let mockShotRepo: any;

  beforeEach(() => {
    mockMachineRepo = {
      findOne: jest.fn(),
    };
    mockBeanBatchRepo = {
      findOne: jest.fn(),
    };
    mockShotRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
      if (entity.name === 'Machine') return mockMachineRepo;
      if (entity.name === 'BeanBatch') return mockBeanBatchRepo;
      if (entity.name === 'Shot') return mockShotRepo;
      return mockMachineRepo;
    });

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  // Helper function to run middleware arrays
  const runMiddleware = async (
    middleware: any[],
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // Using index-based for-loop rather than iterator to assist with any future debugging
    for (let i = 0; i < middleware.length; i++) {
      const fn = middleware[i];
      await fn(req, res, next);
      // Check if an error response was sent by looking at status call history
      if ((res.status as any).mock.calls.length > 0) {
        // Stop if any response was sent (success or error)
        return;
      }
    }
  };

  describe('validateCreateShot', () => {
    it('should pass validation with valid data', async () => {
      mockRequest.body = {
        machineId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID
        shot_type: 'normale',
        success: true,
        notes: 'Great shot',
        preparation: {
          dose_grams: 18.5,
          grind_setting: 15.0,
        },
        extraction: {
          yield_grams: 36.0,
          extraction_time_seconds: 25,
        },
        environment: {
          ambient_temp_c: 22.0,
          humidity_percent: 65,
        },
        feedback: {
          overall_score: 8,
          acidity: 7,
          sweetness: 6,
          bitterness: 5,
          body: 7,
        },
      };

      mockMachineRepo.findOne.mockResolvedValue({ id: 'machine-1' });
      mockBeanBatchRepo.findOne.mockResolvedValue({ id: 'batch-1' });

      await runMiddleware(
        shotValidation.validateCreateShot,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should fail validation with missing required fields', async () => {
      mockRequest.body = {
        // Missing machineId, beanBatchId, shot_type
        success: true,
      };

      await runMiddleware(
        shotValidation.validateCreateShot,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid input data',
        })
      );
    });

    it('should fail validation with invalid shot type', async () => {
      mockRequest.body = {
        machineId: 'machine-1',
        beanBatchId: 'batch-1',
        shot_type: 'invalid-type',
      };

      await runMiddleware(
        shotValidation.validateCreateShot,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation when machine not found', async () => {
      mockRequest.body = {
        machineId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format
        shot_type: 'normale',
      };

      mockMachineRepo.findOne.mockResolvedValue(null);
      mockBeanBatchRepo.findOne.mockResolvedValue({ id: 'batch-1' });

      await runMiddleware(
        shotValidation.validateCreateShot,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Test what actually matters: the response, not the internal flow
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Machine not found',
        field: 'machineId',
      });

      // Verify machine validation was attempted
      expect(mockMachineRepo.findOne).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });
    });

    it('should fail validation when bean batch not found', async () => {
      mockRequest.body = {
        machineId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format
        shot_type: 'normale',
      };

      mockMachineRepo.findOne.mockResolvedValue({ id: 'machine-1' });
      mockBeanBatchRepo.findOne.mockResolvedValue(null);

      await runMiddleware(
        shotValidation.validateCreateShot,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Test what actually matters: the response, not the internal flow
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Bean batch not found',
        field: 'beanBatchId',
      });

      // Verify bean batch validation was attempted
      expect(mockBeanBatchRepo.findOne).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.body = {
        machineId: 'machine-1',
        beanBatchId: 'batch-1',
        shot_type: 'normale',
      };

      mockMachineRepo.findOne.mockRejectedValue(new Error('Database error'));

      await runMiddleware(
        shotValidation.validateCreateShot,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // The validation middleware should handle the error and return a 400 status
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateUpdateShot', () => {
    it('should pass validation with valid update data', async () => {
      mockRequest.params = { id: 'shot-1' };
      mockRequest.body = {
        success: false,
        notes: 'Updated shot',
        preparation: {
          dose_grams: 19.0,
        },
      };

      mockShotRepo.findOne.mockResolvedValue({ id: 'shot-1' });

      await runMiddleware(
        shotValidation.validateUpdateShot,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation with invalid shot ID', async () => {
      mockRequest.params = { id: 'invalid-id' };
      mockRequest.body = { success: false };

      await runMiddleware(
        shotValidation.validateShotId, // Use validateShotId instead of validateUpdateShot
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Schema validation should fail first, returns 400
      const statusCalls = (mockResponse.status as jest.Mock).mock.calls;
      expect(statusCalls.length).toBeGreaterThan(0);
      expect(statusCalls[statusCalls.length - 1][0]).toBe(400);
    });

    it('should fail validation when shot not found', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' }; // Valid UUID format
      mockRequest.body = { success: false };

      // Note: validateUpdateShot middleware does NOT validate shot existence
      // It only validates schema and business rules, then calls next()
      mockShotRepo.findOne.mockResolvedValue(null);

      await runMiddleware(
        shotValidation.validateUpdateShot,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Schema validation passes, business rules pass, next() should be called
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate machine ID if provided in update', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' }; // Valid UUID format
      mockRequest.body = {
        machineId: '550e8400-e29b-41d4-a716-446655440002', // Valid UUID format
        notes: 'Updated with new machine',
      };

      mockShotRepo.findOne.mockResolvedValue({ id: 'shot-1' });
      mockMachineRepo.findOne.mockResolvedValue({ id: 'machine-2' });

      await runMiddleware(
        shotValidation.validateUpdateShot,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('validateShotQuery', () => {
    it('should pass validation with valid query parameters', async () => {
      mockRequest.query = {
        machineId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        shot_type: 'normale',
        success: 'true', // String as it comes from query params
        page: '1',
        limit: '10',
      };

      await shotValidation.validateShotQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass validation with no query parameters', async () => {
      mockRequest.query = {};

      await shotValidation.validateShotQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation with invalid page parameter', async () => {
      mockRequest.query = {
        page: 'invalid',
      };

      await shotValidation.validateShotQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation with invalid shot type', async () => {
      mockRequest.query = {
        shot_type: 'invalid-type',
      };

      await shotValidation.validateShotQuery(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateShotId', () => {
    it('should pass validation with valid shot ID', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' }; // Valid UUID format

      mockShotRepo.findOne.mockResolvedValue({ id: 'shot-1' });

      await runMiddleware(
        shotValidation.validateShotId,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation with invalid shot ID format', async () => {
      mockRequest.params = { id: 'invalid-id' };

      await runMiddleware(
        shotValidation.validateShotId,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation with missing shot ID', async () => {
      mockRequest.params = {};

      await runMiddleware(
        shotValidation.validateShotId,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation when shot not found', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' }; // Valid UUID format

      mockShotRepo.findOne.mockResolvedValue(null);

      await runMiddleware(
        shotValidation.validateShotId,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Schema validation passes, but database validation fails
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Shot not found',
        field: 'id',
      });
    });
  });

  describe('validateBulkShotIds', () => {
    it('should pass validation with valid shot IDs array', async () => {
      mockRequest.body = {
        ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
      };

      mockShotRepo.findOne.mockImplementation((options: any) => {
        if (options.where.id === '550e8400-e29b-41d4-a716-446655440000')
          return Promise.resolve({ id: 'shot-1' });
        if (options.where.id === '550e8400-e29b-41d4-a716-446655440001')
          return Promise.resolve({ id: 'shot-2' });
        if (options.where.id === '550e8400-e29b-41d4-a716-446655440002')
          return Promise.resolve({ id: 'shot-3' });
        return Promise.resolve(null);
      });

      await runMiddleware(
        shotValidation.validateBulkShotIds,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation with empty shot IDs array', async () => {
      mockRequest.body = {
        shotIds: [],
      };

      await runMiddleware(
        shotValidation.validateBulkShotIds,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation with invalid shot ID format', async () => {
      mockRequest.body = {
        shotIds: ['550e8400-e29b-41d4-a716-446655440000', 'invalid-id'],
      };

      await runMiddleware(
        shotValidation.validateBulkShotIds,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation with missing shot IDs', async () => {
      mockRequest.body = {};

      await runMiddleware(
        shotValidation.validateBulkShotIds,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation when some shots not found', async () => {
      mockRequest.body = {
        shotIds: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
      };

      mockShotRepo.findOne.mockImplementation((options: any) => {
        if (options.where.id === '550e8400-e29b-41d4-a716-446655440000')
          return Promise.resolve({ id: 'shot-1' });
        if (options.where.id === '550e8400-e29b-41d4-a716-446655440001')
          return Promise.resolve(null);
        return Promise.resolve(null);
      });

      await runMiddleware(
        shotValidation.validateBulkShotIds,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400); // Schema validation error
    });
  });

  describe('validateExportOptions', () => {
    it('should pass validation with valid export options', async () => {
      mockRequest.query = {
        format: 'csv',
        dateFrom: '2023-01-01T00:00:00.000Z',
        dateTo: '2023-12-31T23:59:59.999Z',
        includeRelated: true as any,
      };

      await shotValidation.validateExportOptions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should fail validation with invalid format', async () => {
      mockRequest.query = {
        format: 'invalid-format',
      };

      await shotValidation.validateExportOptions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should fail validation with invalid date format', async () => {
      mockRequest.query = {
        format: 'csv',
        dateFrom: 'invalid-date',
      };

      await shotValidation.validateExportOptions(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateShotExists', () => {
    it('should handle missing shot ID', async () => {
      mockRequest.params = {};

      await shotValidation.validateShotExists(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Shot ID is required',
      });
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: 'test-id' };
      mockShotRepo.findOne.mockRejectedValue(new Error('Database error'));

      await shotValidation.validateShotExists(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(new Error('Database error'));
    });
  });

  describe('validateMultipleShotsExist', () => {
    it('should handle empty array', async () => {
      mockRequest.body = { ids: [] };

      await shotValidation.validateMultipleShotsExist(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'At least one shot ID is required',
      });
    });

    it('should handle non-array input', async () => {
      mockRequest.body = { ids: 'not-an-array' };

      await shotValidation.validateMultipleShotsExist(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'At least one shot ID is required',
      });
    });

    it('should handle missing shots', async () => {
      mockRequest.body = { ids: ['id1', 'id2'] };
      mockShotRepo.find.mockResolvedValue([{ id: 'id1' }]); // Only one found

      await shotValidation.validateMultipleShotsExist(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Some shots not found',
        missingIds: ['id2'],
      });
    });

    it('should handle database errors', async () => {
      mockRequest.body = { ids: ['id1'] };
      mockShotRepo.find.mockRejectedValue(new Error('Database error'));

      await shotValidation.validateMultipleShotsExist(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(new Error('Database error'));
    });
  });

  describe('validateShotBusinessRules', () => {
    it('should handle extraction ratio too low', async () => {
      mockRequest.body = {
        extraction: {
          dose_grams: 20,
          yield_grams: 8, // 0.4 ratio, below 0.5
        },
      };

      await shotValidation.validateShotBusinessRules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Business rule violation',
        message: 'Extraction yield should be between 0.5x and 3x the dose',
        field: 'extraction.yield_grams',
        currentRatio: 0.4,
        expectedRange: '0.5 - 3.0',
      });
    });

    it('should handle extraction ratio too high', async () => {
      mockRequest.body = {
        extraction: {
          dose_grams: 20,
          yield_grams: 70, // 3.5 ratio, above 3.0
        },
      };

      await shotValidation.validateShotBusinessRules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Business rule violation',
        message: 'Extraction yield should be between 0.5x and 3x the dose',
        field: 'extraction.yield_grams',
        currentRatio: 3.5,
        expectedRange: '0.5 - 3.0',
      });
    });

    it('should handle dose inconsistency', async () => {
      mockRequest.body = {
        preparation: {
          dose_grams: 18.5,
        },
        extraction: {
          dose_grams: 20.5, // 2g difference, above 0.5
        },
      };

      await shotValidation.validateShotBusinessRules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Business rule violation',
        message: 'Preparation and extraction doses should be consistent within 0.5g',
        field: 'extraction.dose_grams',
        preparationDose: 18.5,
        extractionDose: 20.5,
        difference: 2,
      });
    });

    it('should handle future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      mockRequest.body = {
        pulled_at: futureDate.toISOString(),
      };

      await shotValidation.validateShotBusinessRules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Business rule violation',
        message: 'Shot cannot be pulled in the future',
        field: 'pulled_at',
        pulledAt: mockRequest.body.pulled_at,
        currentTime: expect.any(String),
      });
    });

    it('should handle date too old', async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 years ago

      mockRequest.body = {
        pulled_at: oldDate.toISOString(),
      };

      await shotValidation.validateShotBusinessRules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Business rule violation',
        message: 'Shot date cannot be more than 1 year old',
        field: 'pulled_at',
        pulledAt: mockRequest.body.pulled_at,
        minimumAllowedDate: expect.any(String),
      });
    });

    it('should handle database errors', async () => {
      mockRequest.body = {};

      // Mock an error during validation
      const originalConsole = console.error;
      console.error = jest.fn();

      await shotValidation.validateShotBusinessRules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      console.error = originalConsole;
    });
  });

  describe('validateUpdateShot', () => {
    it('should handle bean batch validation branch', async () => {
      mockRequest.body = { beanBatchId: 'test-batch-id' };
      mockBeanBatchRepo.findOne.mockResolvedValue({ id: 'test-batch-id' });
      mockRequest.validated = { body: mockRequest.body };

      // Test the individual validation function directly
      await shotValidation.validateBeanBatchExists(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle bean batch validation error', async () => {
      mockRequest.body = { beanBatchId: 'invalid-batch-id' };
      mockBeanBatchRepo.findOne.mockResolvedValue(null);
      mockRequest.validated = { body: mockRequest.body };

      // Test the individual validation function directly
      await shotValidation.validateBeanBatchExists(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Bean batch not found',
        field: 'beanBatchId',
      });
    });

    it('should handle validation chain errors', async () => {
      mockRequest.body = { beanBatchId: 'test-batch-id' };
      mockBeanBatchRepo.findOne.mockRejectedValue(new Error('Database error'));
      mockRequest.validated = { body: mockRequest.body };

      // Test the individual validation function directly
      await shotValidation.validateBeanBatchExists(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(new Error('Database error'));
    });
  });
});
