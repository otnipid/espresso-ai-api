module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.unit.test.ts',
    '**/__tests__/**/*.integration.test.ts',
    '**/__tests__/**/*.test.ts',
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
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
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
    },
    {
      displayName: 'integration-basic',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/integration/services/ShotService.basic.integration.test.ts'],
      setupFiles: ['<rootDir>/src/__tests__/env-setup.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.integration.basic.ts'],
    },
    {
      displayName: 'integration-main',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/integration/services/ShotService.integration.test.ts'],
      setupFiles: ['<rootDir>/src/__tests__/env-setup.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.integration.main.ts'],
    },
  ],
};
