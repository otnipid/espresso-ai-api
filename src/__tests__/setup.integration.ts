import { DataSource } from 'typeorm';
import { Shot } from '../entities/Shot';
import { ShotPreparation } from '../entities/ShotPreparation';
import { ShotExtraction } from '../entities/ShotExtraction';
import { ShotEnvironment } from '../entities/shotEnvironment';
import { ShotFeedback } from '../entities/shotFeedback';
import { BeanBatch } from '../entities/BeanBatch';
import { Machine } from '../entities/Machine';
import { Bean } from '../entities/Bean';

// Test database setup - uses the official Espresso ML PostgreSQL image with pre-loaded schemas
let testDataSource: DataSource;

const createEspressoMLPostgresDataSource = () =>
  new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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
    synchronize: false, // Schemas are pre-loaded in the Docker image!
    logging: false,
    dropSchema: false, // Keep pre-loaded schema from Docker image
    ssl: false,
    // Use the same connection settings as documented in api-integration.md
    extra: {
      connectionTimeoutMillis: 30000,
      statement_timeout: 60000,
    },
  });

const createLocalPostgresDataSource = () =>
  new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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

// Clean test data but preserve schema (following the documented schema order)
const cleanTestData = async () => {
  const tables = [
    'shot_feedback',
    'shot_environment',
    'shot_extraction',
    'shot_preparation',
    'shots',
    'bean_batches',
    'beans',
    'machines',
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

  // Detect environment and use appropriate database configuration
  const isDockerEnvironment =
    process.env.NODE_ENV === 'test' && process.env.DB_HOST !== 'localhost';
  const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
  const isKubernetes = process.env.KUBERNETES_SERVICE_HOST !== undefined;
  const hasCustomDbConfig = process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD;

  try {
    if (isGitHubActions || isDockerEnvironment || hasCustomDbConfig) {
      console.log('🐳 Using Espresso ML PostgreSQL Docker image with pre-loaded schemas...');
      testDataSource = createEspressoMLPostgresDataSource();
    } else if (isKubernetes) {
      console.log('☸️  Kubernetes environment detected, using Espresso ML PostgreSQL...');
      testDataSource = createEspressoMLPostgresDataSource();
    } else {
      console.log('💻 Local development environment detected, using Espresso ML PostgreSQL...');
      testDataSource = createEspressoMLPostgresDataSource();
    }

    await testDataSource.initialize();
    console.log(`✅ Database connected successfully (${testDataSource.options.type})`);

    // Verify schema exists by checking key tables
    const schemaCheck = await testDataSource.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'beans', 'shots')
      ORDER BY table_name
    `);

    if (schemaCheck.length >= 3) {
      console.log(
        '✅ Pre-loaded schema verified:',
        schemaCheck.map((r: any) => r.table_name).join(', ')
      );
    } else {
      console.warn('⚠️  Expected schema tables not found, falling back to synchronization...');
      await testDataSource.synchronize(true);
    }

    // Clean test data but preserve schema
    await cleanTestData();

    return testDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);

    // Fallback to SQLite if PostgreSQL is not available
    if (testDataSource?.options.type === 'postgres') {
      console.log('🔄 Falling back to SQLite for testing...');
      testDataSource = createSQLiteDataSource();
      await testDataSource.initialize();
      console.log('✅ SQLite fallback initialized');
      return testDataSource;
    }

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
      // Clean test data between tests
      await cleanTestData();
    } catch (cleanupError) {
      console.warn('⚠️  Test data cleanup failed:', cleanupError);
      // Continue without cleanup - tests should still work
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
