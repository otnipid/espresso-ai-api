# Routes Unit Testing Guide

## 🎯 Route Testing Principles

- **HTTP Interface Focus**: Test route definitions and middleware composition
- **Mock Express App**: Test route registration and handling
- **Middleware Chain Testing**: Verify middleware execution order
- **Request Routing**: Test correct HTTP method and path mapping
- **Error Propagation**: Ensure errors flow through middleware stack

## 🚨 Critical Rules for Routes

### **Rule: Test Route Configuration, Not Implementation**

Routes are configuration files that define HTTP endpoints. Test the routing behavior:

```typescript
// ✅ GOOD - Test route behavior
it('should register GET /shots route', () => {
  const app = express();
  shotsRoutes(app);

  // Verify route is registered
  expect(app._router.stack).toContainEqual(
    expect.objectContaining({
      route: { path: '/shots', methods: ['GET'] },
    })
  );
});

// ❌ BAD - Test implementation details
it('should call express.Router', () => {
  const routerSpy = jest.spyOn(express, 'Router');
  shotsRoutes(app);
  expect(routerSpy).toHaveBeenCalled();
});
```

### **Rule: Mock Express App for Route Testing**

```typescript
// ✅ CORRECT - Complete Express app mock
const mockApp = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  use: jest.fn(),
  _router: { stack: [] }, // For testing route registration
};

// ❌ WRONG - Incomplete app mock
const mockApp = {
  get: jest.fn(),
  // Missing other HTTP methods...
};
```

### **Rule: Test Middleware Composition**

Routes combine middleware with route handlers - test this composition:

```typescript
// ✅ GOOD - Test middleware chain
it('should apply validation middleware to POST /shots', () => {
  const app = express();
  shotsRoutes(app);

  // Extract middleware from route registration
  const postRoute = app._router.stack.find(
    route => route.route?.path === '/shots' && route.route?.methods?.includes('POST')
  );

  expect(postRoute.route.stack).toContainEqual(
    expect.objectContaining({
      handle: expect.any(Function), // Validation middleware
    })
  );
});
```

## 🛠️ Route Test Setup

### **Express App Mock**

```typescript
import { Router } from 'express';
import { shotsRoutes } from '../../../src/routes/shot.routes';

describe('Shot Routes', () => {
  let mockApp: any;
  let mockRouter: any;

  beforeEach(() => {
    // Mock Express Router
    mockRouter = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      use: jest.fn(),
      stack: [],
    };

    jest.spyOn(require('express'), 'Router').mockReturnValue(mockRouter);

    // Mock Express app
    mockApp = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      use: jest.fn(),
      _router: { stack: [] }, // Track registered routes
    };

    // Reset all mocks
    jest.clearAllMocks();
  });
});
```

### **Route Registration Testing**

```typescript
describe('route registration', () => {
  it('should register all expected routes', () => {
    shotsRoutes(mockApp);

    // Verify all routes are registered
    const registeredRoutes = mockApp._router.stack;

    expect(registeredRoutes).toContainEqual(
      expect.objectContaining({
        route: { path: '/shots', methods: ['GET'] },
      })
    );

    expect(registeredRoutes).toContainEqual(
      expect.objectContaining({
        route: { path: '/shots', methods: ['POST'] },
      })
    );

    expect(registeredRoutes).toContainEqual(
      expect.objectContaining({
        route: { path: '/shots/:id', methods: ['GET'] },
      })
    );

    expect(registeredRoutes).toContainEqual(
      expect.objectContaining({
        route: { path: '/shots/:id', methods: ['PUT'] },
      })
    );

    expect(registeredRoutes).toContainEqual(
      expect.objectContaining({
        route: { path: '/shots/:id', methods: ['DELETE'] },
      })
    );
  });
});
```

## 🎯 Route Testing Patterns

### **GET Routes Testing**

```typescript
describe('GET /shots', () => {
  it('should register GET route with correct middleware', () => {
    shotsRoutes(mockApp);

    expect(mockApp.get).toHaveBeenCalledWith(
      '/shots',
      expect.arrayContaining([
        expect.any(Function), // Controller method
        expect.any(Function), // Error handler
      ])
    );
  });

  it('should use correct controller method', () => {
    const mockShotController = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    // Import and test with mocked controller
    jest.doMock('../../../src/controllers/shot.controller', () => mockShotController);

    shotsRoutes(mockApp);

    expect(mockApp.get).toHaveBeenCalledWith(
      '/shots',
      expect.arrayContaining([mockShotController.getAll])
    );
  });
});
```

### **POST Routes Testing**

```typescript
describe('POST /shots', () => {
  it('should register POST route with validation middleware', () => {
    shotsRoutes(mockApp);

    expect(mockApp.post).toHaveBeenCalledWith(
      '/shots',
      expect.arrayContaining([
        expect.any(Function), // Validation middleware
        expect.any(Function), // Controller method
        expect.any(Function), // Error handler
      ])
    );
  });

  it('should apply validation middleware to POST route', () => {
    const mockValidation = {
      validateCreateShot: [jest.fn(), jest.fn()],
    };

    jest.doMock('../../../src/middleware/validation/shotValidation', () => mockValidation);

    shotsRoutes(mockApp);

    // Verify validation middleware is included
    const postCall = mockApp.post.mock.calls.find(call => call[0] === '/shots');

    expect(postCall[1]).toContainEqual(mockValidation.validateCreateShot[0]);
    expect(postCall[1]).toContainEqual(mockValidation.validateCreateShot[1]);
  });
});
```

### **Parameterized Routes Testing**

```typescript
describe('GET /shots/:id', () => {
  it('should register parameterized GET route', () => {
    shotsRoutes(mockApp);

    expect(mockApp.get).toHaveBeenCalledWith(
      '/shots/:id',
      expect.arrayContaining([
        expect.any(Function), // Controller method
        expect.any(Function), // Error handler
      ])
    );
  });

  it('should use correct controller method for parameterized route', () => {
    const mockShotController = {
      getById: jest.fn(),
    };

    jest.doMock('../../../src/controllers/shot.controller', () => mockShotController);

    shotsRoutes(mockApp);

    const getByIdCall = mockApp.get.mock.calls.find(call => call[0] === '/shots/:id');

    expect(getByIdCall[1]).toContainEqual(mockShotController.getById);
  });
});
```

### **PUT Routes Testing**

```typescript
describe('PUT /shots/:id', () => {
  it('should register PUT route with update middleware', () => {
    shotsRoutes(mockApp);

    expect(mockApp.put).toHaveBeenCalledWith(
      '/shots/:id',
      expect.arrayContaining([
        expect.any(Function), // Validation middleware
        expect.any(Function), // Controller method
        expect.any(Function), // Error handler
      ])
    );
  });

  it('should apply update validation middleware', () => {
    const mockValidation = {
      validateUpdateShot: [jest.fn(), jest.fn()],
    };

    jest.doMock('../../../src/middleware/validation/shotValidation', () => mockValidation);

    shotsRoutes(mockApp);

    const putCall = mockApp.put.mock.calls.find(call => call[0] === '/shots/:id');

    expect(putCall[1]).toContainEqual(mockValidation.validateUpdateShot[0]);
  });
});
```

### **DELETE Routes Testing**

```typescript
describe('DELETE /shots/:id', () => {
  it('should register DELETE route', () => {
    shotsRoutes(mockApp);

    expect(mockApp.delete).toHaveBeenCalledWith(
      '/shots/:id',
      expect.arrayContaining([
        expect.any(Function), // Controller method
        expect.any(Function), // Error handler
      ])
    );
  });

  it('should use correct controller method for DELETE', () => {
    const mockShotController = {
      remove: jest.fn(),
    };

    jest.doMock('../../../src/controllers/shot.controller', () => mockShotController);

    shotsRoutes(mockApp);

    const deleteCall = mockApp.delete.mock.calls.find(call => call[0] === '/shots/:id');

    expect(deleteCall[1]).toContainEqual(mockShotController.remove);
  });
});
```

## 🔍 Route-Specific Testing Patterns

### **Error Handler Testing**

```typescript
describe('error handling', () => {
  it('should include error handler for all routes', () => {
    shotsRoutes(mockApp);

    // All route registrations should have error handler as last argument
    const allRouteCalls = [
      ...mockApp.get.mock.calls,
      ...mockApp.post.mock.calls,
      ...mockApp.put.mock.calls,
      ...mockApp.delete.mock.calls,
    ];

    allRouteCalls.forEach(call => {
      const middleware = call[1]; // Second argument (middleware array)
      const errorHandler = middleware[middleware.length - 1]; // Last middleware

      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler).toBe('function');
    });
  });
});
```

### **Route Parameter Testing**

```typescript
describe('route parameters', () => {
  it('should correctly extract id parameter', () => {
    const mockShotController = {
      getById: jest.fn(),
    };

    jest.doMock('../../../src/controllers/shot.controller', () => mockShotController);

    shotsRoutes(mockApp);

    // Verify parameter extraction in route definition
    const getByIdCall = mockApp.get.mock.calls.find(call => call[0] === '/shots/:id');

    expect(getByIdCall[0]).toBe('/shots/:id');
    expect(mockShotController.getById).toHaveBeenCalled();
  });
});
```

## 🔍 Route Debugging Examples

### **Route Registration Debugging**

```typescript
describe('debugging route registration', () => {
  it('should log all registered routes', () => {
    console.log('🧪 ROUTE TEST START: Registering shots routes');

    shotsRoutes(mockApp);

    console.log('📋 REGISTERED ROUTES:', {
      get: mockApp.get.mock.calls.map(call => call[0]),
      post: mockApp.post.mock.calls.map(call => call[0]),
      put: mockApp.put.mock.calls.map(call => call[0]),
      delete: mockApp.delete.mock.calls.map(call => call[0]),
    });

    // Verify expected routes
    const expectedRoutes = ['/shots', '/shots/:id'];
    const registeredRoutes = [
      ...mockApp.get.mock.calls.map(call => call[0]),
      ...mockApp.post.mock.calls.map(call => call[0]),
      ...mockApp.put.mock.calls.map(call => call[0]),
      ...mockApp.delete.mock.calls.map(call => call[0]),
    ];

    expectedRoutes.forEach(route => {
      expect(registeredRoutes).toContain(route);
    });

    console.log('✅ ROUTE REGISTRATION COMPLETE');
  });
});
```

### **Middleware Chain Debugging**

```typescript
describe('debugging middleware chains', () => {
  it('should trace middleware execution order', () => {
    const mockMiddleware = {
      validateCreateShot: [jest.fn(), jest.fn()],
    };

    jest.doMock('../../../src/middleware/validation/shotValidation', () => mockMiddleware);

    console.log('🔧 MIDDLEWARE SETUP:', {
      validateCreateShot: mockMiddleware.validateCreateShot.length,
    });

    shotsRoutes(mockApp);

    const postCall = mockApp.post.mock.calls.find(call => call[0] === '/shots');

    const middlewareStack = postCall[1];

    middlewareStack.forEach((middleware, index) => {
      console.log(`📍 MIDDLEWARE ${index + 1}:`, typeof middleware);
    });

    console.log('✅ MIDDLEWARE CHAIN ANALYZED');
  });
});
```

## 🚨 Common Route Testing Pitfalls

### **Issue: Incomplete Express Mock**

```typescript
// ❌ WRONG - Missing router tracking
const mockApp = {
  get: jest.fn(),
  post: jest.fn(),
  // No _router.stack tracking
};

// ✅ CORRECT - Complete app mock with route tracking
const mockApp = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  _router: { stack: [] }, // Track registered routes
};
```

### **Issue: Wrong Controller Import**

```typescript
// ❌ WRONG - Testing after route registration
import { ShotController } from '../../../src/controllers/shot.controller';
const controller = new ShotController();
shotsRoutes(mockApp);

// ✅ CORRECT - Mock controller before route registration
jest.doMock('../../../src/controllers/shot.controller', () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));
```

### **Issue: Testing Implementation Details**

```typescript
// ❌ WRONG - Testing Express internals
it('should call express.Router', () => {
  const routerSpy = jest.spyOn(express, 'Router');
  shotsRoutes(mockApp);
  expect(routerSpy).toHaveBeenCalled();
});

// ✅ CORRECT - Testing route behavior
it('should register correct HTTP methods', () => {
  shotsRoutes(mockApp);
  expect(mockApp.get).toHaveBeenCalled();
  expect(mockApp.post).toHaveBeenCalled();
  expect(mockApp.put).toHaveBeenCalled();
  expect(mockApp.delete).toHaveBeenCalled();
});
```

## 📋 Route Test Checklist

### **Before Writing Tests:**

- [ ] Identify all HTTP methods in route file
- [ ] Map controller dependencies
- [ ] Plan middleware composition testing
- [ ] Setup comprehensive Express app mock
- [ ] Mock controllers and middleware

### **For Each Test:**

- [ ] Arrange: Set up mocks and dependencies
- [ ] Act: Call route registration function
- [ ] Assert route registration
- [ ] Verify HTTP methods
- [ ] Test middleware composition
- [ ] Check controller binding

### **Test Coverage Requirements:**

- [ ] All HTTP methods (GET, POST, PUT, DELETE)
- [ ] Route path registration
- [ ] Middleware chain composition
- [ ] Controller method binding
- [ ] Parameter handling
- [ ] Error handler inclusion

## 🔧 Route Testing Best Practices

### **Route Structure Testing**

```typescript
describe('Route Structure', () => {
  it('should follow consistent route pattern', () => {
    const routes = [
      { method: 'GET', path: '/shots' },
      { method: 'POST', path: '/shots' },
      { method: 'GET', path: '/shots/:id' },
      { method: 'PUT', path: '/shots/:id' },
      { method: 'DELETE', path: '/shots/:id' },
    ];

    shotsRoutes(mockApp);

    routes.forEach(({ method, path }) => {
      expect(mockApp[method.toLowerCase()]).toHaveBeenCalledWith(
        path,
        expect.any(Array) // Middleware array
      );
    });
  });
});
```

### **Middleware Integration Testing**

```typescript
describe('Middleware Integration', () => {
  it('should apply authentication to protected routes', () => {
    const mockAuth = jest.fn();

    jest.doMock('../../../src/middleware/auth', () => mockAuth);

    shotsRoutes(mockApp);

    // Check that auth middleware is applied to protected routes
    const protectedRoutes = ['POST', 'PUT', 'DELETE'];

    protectedRoutes.forEach(method => {
      const calls = mockApp[method.toLowerCase()].mock.calls;
      calls.forEach(call => {
        const middleware = call[1];
        expect(middleware).toContainEqual(mockAuth);
      });
    });
  });
});
```

### **Error Handler Integration**

```typescript
describe('Error Handler Integration', () => {
  it('should include error handler for all routes', () => {
    const mockErrorHandler = jest.fn();

    jest.doMock('../../../src/middleware/errorHandler', () => mockErrorHandler);

    shotsRoutes(mockApp);

    // Verify error handler is included in all route middleware
    const allMethods = ['get', 'post', 'put', 'delete'];

    allMethods.forEach(method => {
      const calls = mockApp[method].mock.calls;
      calls.forEach(call => {
        const middleware = call[1];
        const lastMiddleware = middleware[middleware.length - 1];
        expect(lastMiddleware).toBe(mockErrorHandler);
      });
    });
  });
});
```
