import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Custom error classes for different types of errors
 */
export class ValidationError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

export class NotFoundError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class BusinessRuleError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'BusinessRuleError';
    this.statusCode = 422;
    this.details = details;
  }
}

export class DatabaseError extends Error {
  public statusCode: number;
  public originalError: any;

  constructor(message: string, originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.originalError = originalError;
  }
}

/**
 * Global error handling middleware
 * Catches all errors and formats them appropriately
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error for debugging
  console.error('Error occurred:', {
    message: error.message,
    name: error.name,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString(),
  });

  // Handle different types of errors
  if (error instanceof ZodError) {
    return handleZodError(error, res);
  }

  if (error instanceof ValidationError) {
    return handleValidationError(error, res);
  }

  if (error instanceof NotFoundError) {
    return handleNotFoundError(error, res);
  }

  if (error instanceof BusinessRuleError) {
    return handleBusinessRuleError(error, res);
  }

  if (error instanceof DatabaseError) {
    return handleDatabaseError(error, res);
  }

  // Handle TypeORM errors
  if (error.name === 'QueryFailedError') {
    return handleDatabaseError(new DatabaseError('Database query failed', error), res);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid token provided',
      code: 'INVALID_TOKEN',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Token has expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Default error handler
  return handleDefaultError(error, res);
};

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError, res: Response) {
  const validationErrors = error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
    ...(err as any).received && { received: (err as any).received },
  }));

  res.status(400).json({
    error: 'Validation Error',
    message: 'Invalid input data provided',
    code: 'VALIDATION_FAILED',
    details: validationErrors,
  });
}

/**
 * Handle validation errors
 */
function handleValidationError(error: ValidationError, res: Response) {
  res.status(error.statusCode).json({
    error: 'Validation Error',
    message: error.message,
    code: 'VALIDATION_FAILED',
    details: error.details,
  });
}

/**
 * Handle not found errors
 */
function handleNotFoundError(error: NotFoundError, res: Response) {
  res.status(error.statusCode).json({
    error: 'Not Found',
    message: error.message,
    code: 'RESOURCE_NOT_FOUND',
  });
}

/**
 * Handle business rule errors
 */
function handleBusinessRuleError(error: BusinessRuleError, res: Response) {
  res.status(error.statusCode).json({
    error: 'Business Rule Violation',
    message: error.message,
    code: 'BUSINESS_RULE_VIOLATION',
    details: error.details,
  });
}

/**
 * Handle database errors
 */
function handleDatabaseError(error: DatabaseError, res: Response) {
  // Don't expose internal database errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.statusCode).json({
    error: 'Database Error',
    message: isDevelopment ? error.message : 'An internal database error occurred',
    code: 'DATABASE_ERROR',
    ...(isDevelopment && { details: error.originalError?.message }),
  });
}

/**
 * Handle default/unknown errors
 */
function handleDefaultError(error: Error, res: Response) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { 
      stack: error.stack,
      details: error.name 
    }),
  });
}

/**
 * Async error wrapper for routes
 * Wraps async route handlers to catch errors and pass them to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request validation error handler
 * Specifically handles validation middleware errors
 */
export const validationErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ValidationError) {
    return handleValidationError(error, res);
  }
  next(error);
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
};

/**
 * Rate limit error handler
 */
export const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: res.get('Retry-After') || '60',
  });
};

/**
 * CORS error handler
 */
export const corsErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Cross-origin request blocked',
      code: 'CORS_VIOLATION',
    });
  }
  next(err);
};

/**
 * Request timeout handler
 */
export const timeoutHandler = (req: Request, res: Response) => {
  res.status(408).json({
    error: 'Request Timeout',
    message: 'Request took too long to process',
    code: 'REQUEST_TIMEOUT',
  });
};

/**
 * Health check endpoint error handler
 */
export const healthCheckErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (req.url === '/health' || req.url === '/healthz') {
    return res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
  next(error);
};

/**
 * Error logging utility
 */
export const logError = (error: Error, context?: string) => {
  const logData = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
  };

  console.error(JSON.stringify(logData, null, 2));
};

/**
 * Performance monitoring for slow requests
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (duration > 1000) { // Log slow requests (> 1s)
      console.warn('Slow request detected:', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }
  });
  
  next();
};
