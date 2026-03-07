import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Unmock the error handler to test actual behavior
jest.unmock('../../../middleware/errorHandler');
import {
  errorHandler,
  ValidationError,
  NotFoundError,
  BusinessRuleError,
  DatabaseError,
  asyncHandler,
  validationErrorHandler,
  notFoundHandler,
  rateLimitHandler,
  logError,
  performanceMonitor,
  corsErrorHandler,
  timeoutHandler,
  healthCheckErrorHandler,
  testExport,
} from '../../../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      method: 'GET',
      url: '/api/test',
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle Zod validation errors', async () => {
      // Arrange: Create Zod error
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['name'],
          message: 'Expected string, received number'
        } as any
      ]);

      // Act: Call error handler
      errorHandler(
        zodError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert: Test behavior, not implementation
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Invalid input data provided',
        code: 'VALIDATION_FAILED',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Expected string, received number',
            code: 'invalid_type'
          })
        ])
      });
    });

    it('should handle ValidationError', async () => {
      
      // Arrange: Create validation error
      const error = new ValidationError('Custom validation failed', { field: 'email' });

      // Act: Call error handler
      await errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert: Test behavior, not implementation
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation Error',
        message: 'Custom validation failed',
        code: 'VALIDATION_FAILED',
        details: { field: 'email' }
      });
      
    });

    it('should handle NotFoundError', async () => {
      
      // Arrange: Create not found error
      const error = new NotFoundError('Resource not found');

      // Act: Call error handler
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert: Test behavior, not implementation
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND'
      });
    });

    it('should handle JWT errors', async () => {
      
      // Arrange: Create JWT error
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      // Act: Call error handler
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert: Test behavior, not implementation
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication Error',
        message: 'Invalid token provided',
        code: 'INVALID_TOKEN'
      });
    });

    it('should handle default errors', async () => {
      
      // Arrange: Create generic error
      const error = new Error('Something went wrong');

      // Act: Call error handler
      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert: Test behavior, not implementation
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should handle 404 not found errors', async () => {
      
      // Act: Call not found handler
      await notFoundHandler(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert: Test behavior, not implementation
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Route GET /api/test not found',
        code: 'ROUTE_NOT_FOUND'
      });
    });
  });

  describe('rateLimitHandler', () => {
    it('should handle rate limit errors', async () => {
      
      // Arrange: Set retry-after header
      (mockResponse as any).get = jest.fn().mockReturnValue('120');

      // Act: Call rate limit handler
      await rateLimitHandler(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert: Test behavior, not implementation
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '120'
      });
      
      
    });
  });

  describe('asyncHandler', () => {
    it('should wrap async functions and handle errors', async () => {
      
      // Arrange: Create failing async function
      const asyncFn = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrappedFn = asyncHandler(asyncFn);

      // Act: Call wrapped function
      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert: Test behavior, not implementation
      expect(mockNext).toHaveBeenCalledWith(new Error('Async error'));
      
    });

    it('should pass through successful async functions', async () => {
      
      // Arrange: Create successful async function
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      // Act: Call wrapped function
      await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert: Test behavior, not implementation
      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      
    });
  });

  describe('logError', () => {
    it('should log errors with context', () => {
      
      // Arrange: Create error and spy on console
      const error = new Error('Test error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act: Log error
      logError(error, 'test-context');

      // Assert: Test behavior, not implementation
      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe('Test error');
      expect(loggedData.context).toBe('test-context');
      
      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should log errors without context', () => {
      
      // Arrange: Create error and spy on console
      const error = new Error('Test error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act: Log error
      logError(error);

      // Assert: Test behavior, not implementation
      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(loggedData.message).toBe('Test error');
      expect(loggedData.context).toBeUndefined();
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('performanceMonitor', () => {
    it('should monitor request performance', async () => {
      
      // Arrange: Mock console.warn and setup response with finish event
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock response with finish event
      const mockRes = {
        ...mockResponse,
        statusCode: 200,
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'finish') {
            // Simulate slow request
            setTimeout(callback, 10);
          }
        })
      } as any;

      // Act: Call performance monitor
      
      
      
      performanceMonitor(
        mockRequest as Request,
        mockRes as Response,
        mockNext
      );

      // Wait for finish event to be processed
      await new Promise(resolve => setTimeout(resolve, 20));

      console.log('🔧 MOCK CALLS:', {
        nextCalls: (mockNext as jest.Mock).mock.calls,
        consoleWarnCalls: consoleSpy.mock.calls,
        responseOnCalls: (mockRes.on as jest.Mock).mock.calls
      });

      // Assert: Test behavior, not implementation
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
      
      // Cleanup
      consoleSpy.mockRestore();
      
    });

    it('should log slow requests (> 1s)', async () => {
      
      
      // Arrange: Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock response with slow finish event
      const mockRes = {
        ...mockResponse,
        statusCode: 200,
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'finish') {
            // Simulate slow request (> 1s)
            setTimeout(callback, 1100);
          }
        })
      } as any;

      // Act: Call performance monitor
      performanceMonitor(
        mockRequest as Request,
        mockRes as Response,
        mockNext
      );

      // Wait for finish event to be processed
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Assert: Slow request should be logged
      expect(consoleSpy).toHaveBeenCalledWith('Slow request detected:', {
        method: expect.any(String),
        url: expect.any(String),
        duration: expect.stringMatching(/\d+ms/),
        statusCode: 200,
      });
      
      // Cleanup
      consoleSpy.mockRestore();
      
    });
  });

  describe('DatabaseError', () => {
    it('should create DatabaseError with correct properties', () => {
      
      
      // Arrange
      const originalError = new Error('Connection failed');
      
      // Act
      const error = new DatabaseError('Database operation failed', originalError);

      // Assert
      expect(error.message).toBe('Database operation failed');
      expect(error.name).toBe('DatabaseError');
      expect(error.statusCode).toBe(500);
      expect(error.originalError).toBe(originalError);
      
    });

    it('should create DatabaseError without original error', () => {
      
      
      // Act
      const error = new DatabaseError('Simple database error');

      // Assert
      expect(error.message).toBe('Simple database error');
      expect(error.name).toBe('DatabaseError');
      expect(error.statusCode).toBe(500);
      expect(error.originalError).toBeUndefined();
      
    });
  });

  describe('BusinessRuleError', () => {
    it('should create BusinessRuleError with correct properties', () => {
      
      
      // Arrange
      const details = { field: 'shot_type', value: 'invalid' };
      
      // Act
      const error = new BusinessRuleError('Invalid shot type', details);

      // Assert
      expect(error.message).toBe('Invalid shot type');
      expect(error.name).toBe('BusinessRuleError');
      expect(error.statusCode).toBe(422);
      expect(error.details).toBe(details);
      
    });
  });

  describe('validationErrorHandler', () => {
    it('should handle ValidationError instances', () => {
      
      
      // Arrange
      const validationError = new ValidationError('Invalid data');
      const mockRequest = {};
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const mockNext = jest.fn();

      // Act
      validationErrorHandler(validationError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      
    });

    it('should pass non-ValidationError to next middleware', () => {
      
      
      // Arrange
      const regularError = new Error('Regular error');
      const mockRequest = {};
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const mockNext = jest.fn();

      // Act
      validationErrorHandler(regularError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(regularError);
      
    });
  });

  describe('errorHandler', () => {
    it('should handle BusinessRuleError instances', () => {
      
      
      // Arrange
      const details = { field: 'shot_type', value: 'invalid' };
      const businessRuleError = new BusinessRuleError('Invalid shot type', details);
      const mockRequest = {};
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const mockNext = jest.fn();

      // Act
      errorHandler(businessRuleError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Business Rule Violation',
        message: 'Invalid shot type',
        code: 'BUSINESS_RULE_VIOLATION',
        details: details,
      });
      expect(mockNext).not.toHaveBeenCalled();
      
    });

    it('should handle DatabaseError instances', () => {
      
      
      // Arrange
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development'; // Set to development to expose error message
      
      const databaseError = new DatabaseError('Database connection failed');
      const mockRequest = {};
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const mockNext = jest.fn();

      // Act
      errorHandler(databaseError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Database Error',
        message: 'Database connection failed',
        code: 'DATABASE_ERROR',
      });
      expect(mockNext).not.toHaveBeenCalled();
      
      // Cleanup
      process.env.NODE_ENV = originalNodeEnv;
      
    });

    it('should handle QueryFailedError instances', () => {
      
      
      // Arrange
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development'; // Set to development to expose error message
      
      const queryFailedError = new Error('Query failed');
      queryFailedError.name = 'QueryFailedError';
      const mockRequest = {};
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const mockNext = jest.fn();

      // Act
      errorHandler(queryFailedError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Database Error',
        message: 'Database query failed',
        code: 'DATABASE_ERROR',
        details: 'Query failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
      
      // Cleanup
      process.env.NODE_ENV = originalNodeEnv;
      
    });

    it('should handle TokenExpiredError instances', () => {
      
      
      // Arrange
      const tokenExpiredError = new Error('Token expired');
      tokenExpiredError.name = 'TokenExpiredError';
      const mockRequest = {};
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const mockNext = jest.fn();

      // Act
      errorHandler(tokenExpiredError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication Error',
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
      });
      expect(mockNext).not.toHaveBeenCalled();
      
    });
  });

  describe('corsErrorHandler', () => {
    it('should handle CORS errors', () => {
      // Arrange: Create CORS error
      const error = new Error('Not allowed by CORS');

      // Act: Call CORS error handler
      corsErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert: Test behavior, not implementation
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'CORS Error',
        message: 'Cross-origin request blocked',
        code: 'CORS_VIOLATION'
      });
    });

    it('should pass non-CORS errors to next', () => {
      // Arrange: Create non-CORS error
      const error = new Error('Some other error');

      // Act: Call CORS error handler
      corsErrorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert: Test behavior, not implementation
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('timeoutHandler', () => {
    it('should handle request timeouts', () => {
      // Act: Call timeout handler
      timeoutHandler(mockRequest as Request, mockResponse as Response);

      // Assert: Test behavior, not implementation
      expect(mockResponse.status).toHaveBeenCalledWith(408);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Request Timeout',
        message: 'Request took too long to process',
        code: 'REQUEST_TIMEOUT'
      });
    });
  });

  describe('healthCheckErrorHandler', () => {
    it('should handle health check errors gracefully', () => {
      // Arrange: Create error and health check request
      const error = new Error('Health check failed');
      const healthCheckRequest = {
        ...mockRequest,
        url: '/health'
      } as Request;

      // Act: Call health check error handler
      healthCheckErrorHandler(error, healthCheckRequest, mockResponse as Response, mockNext);

      // Assert: Test behavior, not implementation
      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'unhealthy',
        error: error.message,
        timestamp: expect.any(String)
      });
    });

    it('should pass non-health check errors to next', () => {
      // Arrange: Create error and non-health check request
      const error = new Error('Some other error');
      const regularRequest = {
        ...mockRequest,
        url: '/api/shots'
      } as Request;

      // Act: Call health check error handler
      healthCheckErrorHandler(error, regularRequest, mockResponse as Response, mockNext);

      // Assert: Test behavior, not implementation
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('testExport', () => {
    it('should return test string', () => {
      // Act: Call test export function
      const result = testExport();

      // Assert: Test behavior, not implementation
      expect(result).toBe('test export works');
    });
  });
});
