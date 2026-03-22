import { DataSource } from 'typeorm';
import { Shot } from '../entities/Shot';
import { ShotPreparation } from '../entities/ShotPreparation';
import { ShotExtraction } from '../entities/ShotExtraction';
import { ShotEnvironment } from '../entities/shotEnvironment';
import { ShotFeedback } from '../entities/shotFeedback';
import { BeanBatch } from '../entities/BeanBatch';
import { Machine } from '../entities/Machine';
import { Bean } from '../entities/Bean';
import { User } from '../entities/User';
import { Grinder } from '../entities/Grinder';

// Test database setup for basic integration tests
let testDataSource: DataSource;
let isInitialized = false;

const createCustomPostgresDataSource = () =>
  new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'espresso_ml',
    entities: [
      Shot,
      ShotPreparation,
      ShotExtraction,
      ShotEnvironment,
      ShotFeedback,
      Machine,
      Bean,
      BeanBatch,
      User,
      Grinder,
    ],
    synchronize: false, // Don't synchronize - we have pre-loaded schema
    logging: false,
    dropSchema: false, // Don't drop schema - use data cleanup instead
    ssl: false,
  });

// Clean test data but preserve schema
const cleanTestData = async () => {
  const tables = [
    'shots',
    'shot_preparation',
    'shot_extraction',
    'shot_environment',
    'shot_feedback',
    'shot_history',
    'shot_drafts',
    'bean_batches',
    'beans',
    'machines',
    'grinders',
    'users',
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

// Initialize test database with proper error handling
export const initializeTestDataSource = async (): Promise<DataSource> => {
  try {
    // If already initialized, just clean the data
    if (testDataSource && testDataSource.isInitialized) {
      console.log('🔄 Database already initialized, cleaning data...');
      await cleanTestData();
      return testDataSource;
    }

    console.log('🔌 Initializing test database connection...');

    testDataSource = createCustomPostgresDataSource();
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

// Reset database after each test
afterEach(async () => {
  if (isInitialized && testDataSource && testDataSource.isInitialized) {
    try {
      // Clean test data instead of full sync
      await cleanTestData();
    } catch (cleanupError) {
      console.warn('⚠️  Database cleanup failed:', cleanupError);
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
    country: 'Test Country',
    region: 'Test Region',
    farm: 'Test Farm',
    varietal: 'Test Varietal',
    processing_method: 'Test Processing',
    altitude_m: 1500,
    density_category: 'medium',
  });
  return await beanRepository.save(bean);
};

export const createTestBeanBatch = async (bean?: Bean) => {
  const beanBatchRepository = testDataSource.getRepository(BeanBatch);
  const beanBatch = beanBatchRepository.create({
    roastDate: new Date('2024-01-01'),
    bagOpenDate: new Date('2024-07-01'),
    roastLevel: 'medium',
  });

  // Set the bean relationship separately if provided
  if (bean) {
    beanBatch.bean = bean;
  } else {
    beanBatch.bean = await createTestBean();
  }

  return await beanBatchRepository.save(beanBatch);
};

export const createTestUser = async () => {
  const userRepository = testDataSource.getRepository(User);
  const user = userRepository.create({
    name: 'Test User',
    email: 'test@example.com',
  });
  return await userRepository.save(user);
};

export const createTestGrinder = async () => {
  const grinderRepository = testDataSource.getRepository(Grinder);
  const grinder = grinderRepository.create({
    model: 'Test Grinder',
    manufacturer: 'Test Manufacturer',
    burrType: 'flat',
    serialNumber: 'TEST-123',
  });
  return await grinderRepository.save(grinder);
};
