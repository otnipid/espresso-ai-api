import 'reflect-metadata';

// Mock the data source for unit tests
jest.mock('../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    createQueryRunner: jest.fn(),
    manager: {
      query: jest.fn(),
    },
  },
}));

// Create mock error handler
const mockErrorHandler = jest.fn();

// Mock error classes
class MockValidationError extends Error {
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

class MockNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class MockBusinessRuleError extends Error {
  constructor(message: string, details?: any) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

// Mock middleware modules
jest.mock('../middleware/errorHandler', () => ({
  errorHandler: mockErrorHandler,
  ValidationError: MockValidationError,
  NotFoundError: MockNotFoundError,
  BusinessRuleError: MockBusinessRuleError,
  DatabaseError: class extends Error {
    constructor(message: string, originalError?: any) {
      super(message);
      this.name = 'DatabaseError';
    }
  },
  asyncHandler: (fn: any) => fn,
  validationErrorHandler: jest.fn(),
  notFoundHandler: jest.fn(),
  rateLimitHandler: jest.fn(),
  logError: jest.fn(),
  performanceMonitor: jest.fn((req, res, next) => next()),
}));

// Export mocks for test files to use
export { mockErrorHandler, MockValidationError, MockNotFoundError, MockBusinessRuleError };

// Global test utilities
(globalThis as any).createMockDataSource = () => ({
  getRepository: jest.fn(),
  createQueryRunner: jest.fn(),
  manager: {
    query: jest.fn(),
  },
});

beforeEach(() => {
  jest.clearAllMocks();
});
