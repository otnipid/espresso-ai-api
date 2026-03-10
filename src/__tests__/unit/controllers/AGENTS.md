# Controller Unit Testing Guide

## 🎯 Controller Testing Principles

- **HTTP Interface Focus**: Test request/response handling, not business logic
- **Mock Dependencies**: All services and repositories must be mocked
- **Status Code Validation**: Always verify HTTP status codes
- **Response Body Testing**: Validate response structure and content
- **Error Scenarios**: Test both success and error cases

## 🚨 Critical Rules for Controllers

### **Rule: Mock All External Dependencies**

Controllers depend on services and middleware - these must be completely mocked:

```typescript
// ✅ CORRECT - Complete mocking
const mockShotService = {
  createShot: jest.fn(),
  getShotById: jest.fn(),
  getShots: jest.fn(),
  updateShot: jest.fn(),
  deleteShot: jest.fn(),
};

// ❌ WRONG - Missing dependencies
const mockShotService = {
  createShot: jest.fn(),
  // Missing other methods...
};
```

### **Rule: Test HTTP Interface, Not Business Logic**

```typescript
// ✅ GOOD - Test HTTP response
it('should return 201 with created shot data', async () => {
  const result = await shotController.create(mockRequest, mockResponse);
  expect(mockResponse.status).toHaveBeenCalledWith(201);
  expect(mockResponse.json).toHaveBeenCalledWith({
    id: expect.any(String),
    message: 'Shot created successfully',
    data: expect.objectContaining({
      shot_type: 'espresso',
    }),
  });
});

// ❌ BAD - Test business logic details
it('should call service.createShot with correct data', async () => {
  await shotController.create(mockRequest, mockResponse);
  expect(mockShotService.createShot).toHaveBeenCalledWith({
    shot_type: 'espresso',
    dose: 18.5,
  });
});
```

### **Rule: Always Test Status Codes and Response Bodies**

```typescript
it('should handle validation errors', async () => {
  mockRequest.body = { invalid_field: 'value' };
  mockShotService.createShot.mockRejectedValue(new ValidationError('Invalid data'));

  await shotController.create(mockRequest, mockResponse);

  // Test both status and response body
  expect(mockResponse.status).toHaveBeenCalledWith(400);
  expect(mockResponse.json).toHaveBeenCalledWith({
    error: 'Validation Error',
    message: 'Invalid input data provided',
    code: 'VALIDATION_FAILED',
  });
});
```

## 🛠️ Controller Test Setup

### **Standard Mock Setup**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ShotController } from '../../../src/controllers/shot.controller';

describe('ShotController', () => {
  let shotController: ShotController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: { id: 'test-user-id' },
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup mock next
    mockNext = jest.fn();

    // Initialize controller with mocked dependencies
    shotController = new ShotController(mockShotService as any);
  });
});
```

### **Request Mock Patterns**

```typescript
// GET request with query parameters
mockRequest = {
  method: 'GET',
  query: {
    page: '1',
    limit: '10',
    machine_id: '550e8400-e29b-41d4-a716-446655440000',
  },
};

// POST request with body
mockRequest = {
  method: 'POST',
  body: {
    machine_id: '550e8400-e29b-41d4-a716-446655440000',
    bean_batch_id: '550e8400-e29b-41d4-a716-446655440001',
    shot_type: 'espresso',
    dose: 18.5,
  },
};

// PUT request with params and body
mockRequest = {
  method: 'PUT',
  params: {
    id: '550e8400-e29b-41d4-a716-446655440002',
  },
  body: {
    shot_type: 'ristretto',
    dose: 16.0,
  },
};

// DELETE request with params
mockRequest = {
  method: 'DELETE',
  params: {
    id: '550e8400-e29b-41d4-a716-446655440002',
  },
};
```

## 🎯 Controller Method Testing Patterns

### **GET All (Index) Tests**

```typescript
describe('getAll', () => {
  it('should return paginated shots with default values', async () => {
    // Arrange
    const mockShots = [
      { id: '1', shot_type: 'espresso' },
      { id: '2', shot_type: 'ristretto' },
    ];
    mockShotService.getShots.mockResolvedValue({
      data: mockShots,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });

    mockRequest.query = {};

    // Act
    await shotController.getAll(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockShotService.getShots).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      data: mockShots,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('should handle pagination parameters', async () => {
    // Arrange
    mockRequest.query = { page: '2', limit: '5' };
    mockShotService.getShots.mockResolvedValue({
      data: [],
      pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
    });

    // Act
    await shotController.getAll(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockShotService.getShots).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it('should handle service errors', async () => {
    // Arrange
    mockShotService.getShots.mockRejectedValue(new Error('Database error'));
    mockRequest.query = {};

    // Act
    await shotController.getAll(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });
});
```

### **GET Single (Show) Tests**

```typescript
describe('getById', () => {
  it('should return shot when found', async () => {
    // Arrange
    const mockShot = { id: '1', shot_type: 'espresso' };
    mockRequest.params = { id: '1' };
    mockShotService.getShotById.mockResolvedValue(mockShot);

    // Act
    await shotController.getById(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockShotService.getShotById).toHaveBeenCalledWith('1');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      data: mockShot,
    });
  });

  it('should return 404 when shot not found', async () => {
    // Arrange
    mockRequest.params = { id: 'non-existent' };
    mockShotService.getShotById.mockResolvedValue(null);

    // Act
    await shotController.getById(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'Shot not found',
    });
  });

  it('should handle invalid ID format', async () => {
    // Arrange
    mockRequest.params = { id: 'invalid-uuid' };
    mockShotService.getShotById.mockRejectedValue(new Error('Invalid ID format'));

    // Act
    await shotController.getById(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'Invalid shot ID format',
    });
  });
});
```

### **POST (Create) Tests**

```typescript
describe('create', () => {
  it('should create shot and return 201', async () => {
    // Arrange
    const shotData = {
      machine_id: '550e8400-e29b-41d4-a716-446655440000',
      bean_batch_id: '550e8400-e29b-41d4-a716-446655440001',
      shot_type: 'espresso',
      dose: 18.5,
    };
    mockRequest.body = shotData;

    const createdShot = { id: 'new-shot-id', ...shotData };
    mockShotService.createShot.mockResolvedValue(createdShot);

    // Act
    await shotController.create(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockShotService.createShot).toHaveBeenCalledWith(shotData);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Shot created successfully',
      data: createdShot,
    });
  });

  it('should handle validation errors', async () => {
    // Arrange
    const invalidData = { shot_type: 'invalid-type' };
    mockRequest.body = invalidData;
    mockShotService.createShot.mockRejectedValue(new ValidationError('Invalid shot type'));

    // Act
    await shotController.create(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: 'Invalid shot type',
      code: 'VALIDATION_FAILED',
    });
  });

  it('should handle missing required fields', async () => {
    // Arrange
    const incompleteData = { shot_type: 'espresso' }; // Missing machine_id
    mockRequest.body = incompleteData;

    // Act
    await shotController.create(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      message: expect.stringContaining('required'),
    });
  });
});
```

### **PUT (Update) Tests**

```typescript
describe('update', () => {
  it('should update shot and return 200', async () => {
    // Arrange
    const updateData = {
      shot_type: 'ristretto',
      dose: 16.0,
    };
    mockRequest.params = { id: '1' };
    mockRequest.body = updateData;

    const updatedShot = { id: '1', ...updateData };
    mockShotService.updateShot.mockResolvedValue(updatedShot);

    // Act
    await shotController.update(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockShotService.updateShot).toHaveBeenCalledWith('1', updateData);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Shot updated successfully',
      data: updatedShot,
    });
  });

  it('should return 404 when updating non-existent shot', async () => {
    // Arrange
    mockRequest.params = { id: 'non-existent' };
    mockRequest.body = { shot_type: 'espresso' };
    mockShotService.updateShot.mockResolvedValue(null);

    // Act
    await shotController.update(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'Shot not found',
    });
  });
});
```

### **DELETE Tests**

```typescript
describe('remove', () => {
  it('should delete shot and return 200', async () => {
    // Arrange
    mockRequest.params = { id: '1' };
    mockShotService.deleteShot.mockResolvedValue(true);

    // Act
    await shotController.remove(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockShotService.deleteShot).toHaveBeenCalledWith('1');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: 'Shot deleted successfully',
    });
  });

  it('should return 404 when deleting non-existent shot', async () => {
    // Arrange
    mockRequest.params = { id: 'non-existent' };
    mockShotService.deleteShot.mockResolvedValue(false);

    // Act
    await shotController.remove(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'Shot not found',
    });
  });
});
```

## 🔍 Error Testing Patterns

### **Validation Error Testing**

```typescript
describe('validation errors', () => {
  const validationTestCases = [
    {
      name: 'invalid shot type',
      data: { shot_type: 'invalid' },
      expectedError: 'Invalid shot type',
    },
    {
      name: 'missing machine ID',
      data: { bean_batch_id: 'valid-id' },
      expectedError: 'Machine ID is required',
    },
    {
      name: 'invalid UUID format',
      data: { machine_id: 'invalid-uuid' },
      expectedError: 'Invalid UUID format',
    },
  ];

  validationTestCases.forEach(({ name, data, expectedError }) => {
    it(`should return 400 for ${name}`, async () => {
      mockRequest.body = data;
      mockShotService.createShot.mockRejectedValue(new ValidationError(expectedError));

      await shotController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toEqual({
        error: 'Validation Error',
        message: expectedError,
        code: 'VALIDATION_FAILED',
      });
    });
  });
});
```

### **Service Error Handling**

```typescript
describe('service error handling', () => {
  it('should handle database connection errors', async () => {
    // Arrange
    mockRequest.body = validShotData;
    mockShotService.createShot.mockRejectedValue(new Error('Database connection failed'));

    // Act
    await shotController.create(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });

  it('should handle timeout errors', async () => {
    // Arrange
    mockRequest.body = validShotData;
    mockShotService.createShot.mockRejectedValue(new Error('Request timeout'));

    // Act
    await shotController.create(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(503);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Service Unavailable',
      message: 'Service temporarily unavailable',
    });
  });
});
```

## 📋 Controller Test Checklist

### **Before Writing Tests:**

- [ ] Identify all service dependencies
- [ ] Mock all service methods completely
- [ ] Setup request/response mocks
- [ ] Define test data with valid UUIDs
- [ ] Plan success and error scenarios

### **For Each Test:**

- [ ] Arrange: Set up request data and mocks
- [ ] Act: Call controller method
- [ ] Assert status code
- [ ] Assert response body structure
- [ ] Verify service method calls
- [ ] Test error scenarios

### **Test Coverage Requirements:**

- [ ] All HTTP methods (GET, POST, PUT, DELETE)
- [ ] Success scenarios (200, 201)
- [ ] Error scenarios (400, 404, 500)
- [ ] Validation errors
- [ ] Edge cases (empty data, invalid formats)
- [ ] Service error handling

## 🚨 Critical Rules for Controller Testing

### **Rule: Always Mock Services, Never Repositories**

**Problem**: Repository mocking breaks separation of concerns and couples tests to implementation details.

**Rule**: Controller tests must mock service dependencies, not database repositories:

```typescript
// ❌ FORBIDDEN - Repository direct access
jest.mock('../../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('BeanController', () => {
  let mockRepository: any;
  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
  });
});

// ✅ REQUIRED - Service layer abstraction
jest.mock('../../../services/BeanService');

describe('BeanController', () => {
  let mockBeanService: jest.Mocked<BeanService>;
  beforeEach(() => {
    mockBeanService = {
      getBeans: jest.fn(),
      getBeanById: jest.fn(),
      createBean: jest.fn(),
      updateBean: jest.fn(),
      deleteBean: jest.fn(),
    } as any;
    (BeanService as jest.Mock).mockImplementation(() => mockBeanService);
  });
});
```

**Enforcement**: All controller tests must follow service mocking pattern without exception.

### **Rule: Use Type Assertions for Mock Data**

**Problem**: Strict TypeScript causes compilation errors in mock data setup.

**Rule**: Use strategic `as any` type assertions for mock data to focus on behavior testing:

```typescript
// ❌ FORBIDDEN - Strict typing causes errors
const mockShot = { id: '1', shot_type: 'espresso' }; // Missing required properties
const mockResult = { shots: mockShots, total: 2 }; // Type mismatch

// ✅ REQUIRED - Use type assertions for mock data
const mockShot = { id: '1', shot_type: 'espresso' } as any;
const mockResult = { 
  shots: mockShots as any, 
  total: 2, 
  page: 1, 
  limit: 10, 
  totalPages: 1 
};

// ✅ ALTERNATIVE - Partial mocks with type assertions
const mockShot: Partial<Shot> = { 
  id: '1', 
  shot_type: 'espresso' 
} as Shot;
```

**Enforcement**: All mock data must use appropriate type assertions to avoid TypeScript errors.

### **Rule: Follow Standard Controller Test Template**

**Problem**: Inconsistent test structure makes maintenance difficult and error-prone.

**Rule**: All controller tests must follow this exact structure:

```typescript
import { Request, Response } from 'express';
import { ControllerName } from '../../../controllers/controllerName';
import { ServiceName } from '../../../services/serviceName';

// Mock the service
jest.mock('../../../services/serviceName');

describe('ControllerName', () => {
  let controller: ControllerName;
  let mockService: jest.Mocked<ServiceName>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create fresh mock for each test
    mockService = {
      method1: jest.fn(),
      method2: jest.fn(),
      method3: jest.fn(),
      method4: jest.fn(),
      method5: jest.fn(),
    } as any;

    // Mock the constructor to return our mock service
    (ServiceName as jest.Mock).mockImplementation(() => mockService);

    // Initialize controller
    controller = new ControllerName();

    // Setup mock request
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('HTTP Interface Tests', () => {
    describe('methodName', () => {
      it('should handle success scenario', async () => {
        // Test success path
      });

      it('should handle validation errors', async () => {
        // Test validation failures
      });

      it('should handle service errors', async () => {
        // Test service errors
      });

      it('should handle null/undefined returns', async () => {
        // Test not found scenarios
      });
    });
  });
});
```

**Structure Requirements**:
1. **Import Order**: Express → Controller → Service
2. **Service Mocking**: Always mock services, never repositories
3. **Mock Setup**: Fresh mocks in beforeEach
4. **Request/Response**: Standardized mock objects
5. **Test Organization**: Group by HTTP method, then by scenario
6. **Error Coverage**: All methods must test error scenarios

**Enforcement**: Deviation from this template is not permitted.

### **Rule: Achieve Comprehensive Branch Coverage**

**Problem**: High branch coverage requires testing all conditional branches, especially error handling.

**Rule**: All controller tests must include comprehensive error path testing:

```typescript
describe('comprehensive error handling', () => {
  // Required: Test all try/catch blocks
  it('should handle database connection errors', async () => {
    mockService.method.mockRejectedValue(new Error('Database connection failed'));
    await controller.method(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error message' });
  });

  // Required: Test conditional branches
  it('should handle null data assignment', async () => {
    mockRequest.body = { field: null };
    const existingEntity = { id: '1', field: 'existing-value' };
    mockService.method.mockResolvedValue(existingEntity);
    
    await controller.update(mockRequest, mockResponse);
    
    expect(mockService.method).toHaveBeenCalledWith('1', { field: null });
  });

  // Required: Test type conversion branches
  it('should handle invalid number conversions', async () => {
    mockRequest.query = { page: 'invalid-number' };
    mockService.method.mockResolvedValue({ data: [], pagination: {} });
    
    await controller.all(mockRequest, mockResponse);
    
    expect(mockService.method).toHaveBeenCalledWith(expect.objectContaining({
      page: expect.any(Number), // Should be NaN or default
    }));
  });

  // Required: Test business rule validation branches
  it('should handle business rule violations', async () => {
    mockRequest.body = { field: 'invalid-value' };
    mockService.method.mockRejectedValue(new Error('Business rule violation'));
    
    await controller.method(mockRequest, mockResponse);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Business rule violation' 
    });
  });

  // Required: Test entity existence checks
  it('should handle not found scenarios', async () => {
    mockRequest.params = { id: 'non-existent-id' };
    mockService.method.mockResolvedValue(null as any);
    
    await controller.method(mockRequest, mockResponse);
    
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ 
      message: 'Resource not found' 
    });
  });
});
```

**Branch Coverage Requirements**:
- [ ] **Database Errors**: Test all `mockRejectedValue` scenarios
- [ ] **Conditional Logic**: Test both true/false branches
- [ ] **Type Conversions**: Test parseInt, parseFloat with invalid inputs
- [ ] **Null Assignments**: Test explicit null/undefined assignments
- [ ] **Business Rules**: Test validation failures and boundary values
- [ ] **Entity Existence**: Test not found scenarios with `mockResolvedValue(null)`
- [ ] **Error Response Format**: Verify consistent error response structure
- [ ] **Status Code Logic**: Test all possible status code paths

**Enforcement**: Coverage targets must be met: 95%+ line, 90%+ branch, 100% function, 95%+ error path.

## � Common Controller Testing Issues

### **Issue: Mock Response Chain**

```typescript
// ❌ WRONG - Response methods not chained properly
mockResponse.status = jest.fn().mockReturnValue(200);
mockResponse.json = jest.fn();

// ✅ CORRECT - Chainable response mock
mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};
```

### **Issue: Async/Await Missing**

```typescript
// ❌ WRONG - Missing await
it('should handle async operation', () => {
  shotController.create(mockRequest, mockResponse);
  expect(mockResponse.status).toHaveBeenCalledWith(201);
});

// ✅ CORRECT - Proper async handling
it('should handle async operation', async () => {
  await shotController.create(mockRequest, mockResponse);
  expect(mockResponse.status).toHaveBeenCalledWith(201);
});
```

### **Issue: Incomplete Request Mocking**

```typescript
// ❌ WRONG - Missing required request properties
mockRequest = { body: testData };

// ✅ CORRECT - Complete request mock
mockRequest = {
  method: 'POST',
  body: testData,
  params: {},
  query: {},
  user: { id: 'test-user-id' },
} as Request;
```
