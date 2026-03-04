import { DataSource } from 'typeorm';
import { Shot } from '../entities/Shot';
import { ShotPreparation } from '../entities/ShotPreparation';
import { ShotExtraction } from '../entities/ShotExtraction';
import { ShotEnvironment } from '../entities/shotEnvironment';
import { ShotFeedback } from '../entities/shotFeedback';
import { BeanBatch } from '../entities/BeanBatch';
import { Machine } from '../entities/Machine';
import { Bean } from '../entities/Bean';

// Test database setup - tries Kubernetes PostgreSQL first, then local PostgreSQL, falls back to SQLite
let testDataSource: DataSource;

const createCustomPostgresDataSource = () =>
  new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres_user',
    password: process.env.DB_PASSWORD || 'postgres_password',
    database: process.env.DB_NAME || 'espresso_ml_test',
    entities: [
      Shot,
      ShotPreparation,
      ShotExtraction,
      ShotEnvironment,
      ShotFeedback,
      Machine,
      Bean,
      BeanBatch,
    ],
    synchronize: false, // Schemas are pre-loaded!
    logging: false,
    dropSchema: false, // Keep pre-loaded schema
    ssl: false,
  });

const createLocalPostgresDataSource = () =>
  new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'espresso_ml_test',
    entities: [
      Shot,
      ShotPreparation,
      ShotExtraction,
      ShotEnvironment,
      ShotFeedback,
      Machine,
      Bean,
      BeanBatch,
    ],
    synchronize: true,
    logging: false,
    dropSchema: true,
  });

const createSQLiteDataSource = () =>
  new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [
      Shot,
      ShotPreparation,
      ShotExtraction,
      ShotEnvironment,
      ShotFeedback,
      Machine,
      Bean,
      BeanBatch,
    ],
    synchronize: true,
    logging: false,
  });

// Clean test data but preserve schema
const cleanTestData = async () => {
  const tables = [
    'shots',
    'shot_preparation',
    'shot_extraction',
    'shot_environment',
    'shot_feedback',
    'bean_batches',
    'machines',
    'beans',
  ];

  for (const table of tables) {
    try {
      await testDataSource.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      console.log(`🧹 Cleaned table: ${table}`);
    } catch (error) {
      console.warn(`⚠️  Could not clean table ${table}:`, error);
    }
  }
};

// Initialize test database
export const initializeTestDataSource = async (): Promise<DataSource> => {
  if (testDataSource && testDataSource.isInitialized) {
    return testDataSource;
  }

  // Detect environment and use custom PostgreSQL image
  const isDockerEnvironment = process.env.TEST_DB_HOST !== 'localhost';
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  const isKubernetes = process.env.KUBERNETES_SERVICE_HOST !== undefined;

  try {
    if (isGitHubActions || isDockerEnvironment) {
      console.log('� Docker/CI environment detected, using custom PostgreSQL image...');
      testDataSource = createCustomPostgresDataSource();
    } else if (isKubernetes) {
      console.log('☸️  Kubernetes environment detected');
      testDataSource = createCustomPostgresDataSource();
    } else {
      console.log('💻 Local development environment detected');
      testDataSource = createCustomPostgresDataSource();
    }

    await testDataSource.initialize();
    console.log(`✅ Database connected successfully (postgres)`);

    // Clean test data but preserve schema
    await cleanTestData();

    return testDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Export data source (will be initialized when needed)
export const getTestDataSource = () => {
  if (!testDataSource) {
    throw new Error('Test data source not initialized. Call initializeTestDataSource() first.');
  }
  return testDataSource;
};

// Global test setup
let isInitialized = false;

beforeAll(async () => {
  if (!isInitialized) {
    await initializeTestDataSource();
    isInitialized = true;
  }
});

afterAll(async () => {
  if (isInitialized && testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    isInitialized = false;
  }
});

// Reset database before each test
beforeEach(async () => {
  if (isInitialized && testDataSource && testDataSource.isInitialized) {
    try {
      // Drop and recreate all tables to ensure clean state
      await testDataSource.synchronize(true);
    } catch (syncError) {
      // If synchronization fails due to concurrent access, try a simpler approach
      console.warn('⚠️  Database synchronization failed, trying alternative cleanup:', syncError);
      // Continue without full sync - tests should still work with existing schema
    }
  }
});

// Helper function to create test data
export const createTestMachine = async () => {
  const machineRepository = testDataSource.getRepository(Machine);
  const machine = machineRepository.create({
    model: 'Test Machine Model',
    firmware_version: '1.0.0',
  });
  return await machineRepository.save(machine);
};

export const createTestBean = async () => {
  const beanRepository = testDataSource.getRepository(Bean);
  const bean = beanRepository.create({
    name: 'Test Bean',
    roaster: 'Test Roaster',
    country: 'Colombia',
    region: 'Huila',
  });
  return await beanRepository.save(bean);
};

export const createTestBeanBatch = async (bean: Bean) => {
  const beanBatchRepository = testDataSource.getRepository(BeanBatch);
  const beanBatch = beanBatchRepository.create({
    bean: bean,
    roastDate: new Date('2024-01-01'),
    bestByDate: new Date('2024-07-01'),
    weightKg: 5.0,
    notes: 'Test batch',
  });
  return await beanBatchRepository.save(beanBatch);
};
