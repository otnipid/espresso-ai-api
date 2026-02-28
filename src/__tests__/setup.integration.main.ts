import { DataSource } from 'typeorm';
import { Shot } from '../entities/Shot';
import { ShotPreparation } from '../entities/ShotPreparation';
import { ShotExtraction } from '../entities/ShotExtraction';
import { ShotEnvironment } from '../entities/shotEnvironment';
import { ShotFeedback } from '../entities/shotFeedback';
import { BeanBatch } from '../entities/BeanBatch';
import { Machine } from '../entities/Machine';
import { Bean } from '../entities/Bean';

// Test database setup for main integration tests
let testDataSource: DataSource;
let isInitialized = false;

const createCustomPostgresDataSource = () => new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'postgres_user',
  password: process.env.DB_PASSWORD || 'postgres_password',
  database: process.env.DB_NAME || 'espresso_ml_test_main', // Different database name
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
  synchronize: true, // Enable synchronization for official PostgreSQL image
  logging: false,
  dropSchema: true, // Clean schema for tests
  ssl: false,
});

// Clean test data but preserve schema
const cleanTestData = async () => {
  const tables = [
    'shots', 'shot_preparation', 'shot_extraction', 
    'shot_environment', 'shot_feedback', 
    'bean_batches', 'machines', 'bean'
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
    bestByDate: new Date('2024-07-01'),
    weightKg: 5.00,
    notes: 'Test batch',
  });
  
  // Set the bean relationship separately if provided
  if (bean) {
    beanBatch.bean = bean;
  } else {
    beanBatch.bean = await createTestBean();
  }
  
  return await beanBatchRepository.save(beanBatch);
};
