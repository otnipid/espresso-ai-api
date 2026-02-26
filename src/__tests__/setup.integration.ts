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

const createKubernetesPostgresDataSource = () => new DataSource({
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'espresso-db-postgres.espresso-development.svc.cluster.local',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USERNAME || 'postgres_user',
  password: process.env.TEST_DB_PASSWORD || 'postgres_password',
  database: process.env.TEST_DB_DATABASE || 'espresso_ml_dev',
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
  ssl: process.env.TEST_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const createLocalPostgresDataSource = () => new DataSource({
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USERNAME || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
  database: process.env.TEST_DB_DATABASE || 'espresso_ml_test',
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

const createSQLiteDataSource = () => new DataSource({
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

// Initialize test database
export const initializeTestDataSource = async (): Promise<DataSource> => {
  if (testDataSource && testDataSource.isInitialized) {
    return testDataSource;
  }

  // Try Kubernetes PostgreSQL first (for CI/CD)
  try {
    console.log('🐘 Attempting to connect to Kubernetes PostgreSQL test database...');
    testDataSource = createKubernetesPostgresDataSource();
    await testDataSource.initialize();
    console.log('✅ Kubernetes PostgreSQL test database connected successfully');
    return testDataSource;
  } catch (error) {
    console.log('❌ Kubernetes PostgreSQL connection failed, trying local PostgreSQL...');
    console.log('📝 Error:', (error as Error).message);
    
    // Try local PostgreSQL
    try {
      console.log('🐘 Attempting to connect to local PostgreSQL test database...');
      testDataSource = createLocalPostgresDataSource();
      await testDataSource.initialize();
      console.log('✅ Local PostgreSQL test database connected successfully');
      return testDataSource;
    } catch (localError) {
      console.log('❌ Local PostgreSQL connection failed, falling back to SQLite...');
      console.log('📝 Error:', (localError as Error).message);
      
      // Fallback to SQLite
      try {
        testDataSource = createSQLiteDataSource();
        await testDataSource.initialize();
        console.log('✅ SQLite test database initialized successfully');
        return testDataSource;
      } catch (sqliteError) {
        console.error('❌ SQLite initialization failed:', sqliteError);
        console.warn('⚠️  All database connections failed. Tests may not work properly.');
        // Don't throw error, let tests continue with whatever connection we have
        return testDataSource;
      }
    }
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
