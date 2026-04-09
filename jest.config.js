module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.unit.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/scripts/**',
    '!src/__tests__/**',
    '!src/routes/shot.routes.ts',
    '!src/entities/index.ts',
    '!src/entities/*.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coveragePathIgnorePatterns: [
    'node_modules',
    '<rootDir>/src/__tests__/',
    '<rootDir>/src/scripts/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  maxWorkers: 2,
  workerIdleMemoryLimit: 512 * 1024 * 1024, // 512MB
  // Load test environment variables
  setupFiles: ['<rootDir>/src/__tests__/env-setup.ts'],
  // Separate coverage for unit vs integration tests
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.unit.ts'],
      testTimeout: 45000, // 45 seconds for unit tests
      maxWorkers: 1, // Force single worker to prevent crashes
      workerIdleMemoryLimit: 1024 * 1024 * 1024, // 1GB for unit tests
    },
  ],
};
