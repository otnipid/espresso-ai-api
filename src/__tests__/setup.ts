import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Shot } from '../entities/Shot';
import { ShotPreparation } from '../entities/ShotPreparation';
import { ShotExtraction } from '../entities/ShotExtraction';
import { ShotEnvironment } from '../entities/shotEnvironment';
import { ShotFeedback } from '../entities/shotFeedback';
import { BeanBatch } from '../entities/BeanBatch';
import { Machine } from '../entities/Machine';
import { Bean } from '../entities/Bean';

// Create test entities with SQLite-compatible column types (excluding BeanBatch for now)
const testEntities = [
  Shot,
  ShotPreparation,
  ShotExtraction,
  ShotEnvironment,
  ShotFeedback,
  Machine,
  Bean,
];

// Test database setup with SQLite compatibility
export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: testEntities,
  synchronize: true,
  logging: false,
});

// Global test setup
let isInitialized = false;

beforeAll(async () => {
  if (!isInitialized) {
    await testDataSource.initialize();
    isInitialized = true;
  }
});

afterAll(async () => {
  if (isInitialized && testDataSource.isInitialized) {
    await testDataSource.destroy();
    isInitialized = false;
  }
});

// Reset database before each test
beforeEach(async () => {
  if (isInitialized && testDataSource.isInitialized) {
    const entities = testDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = testDataSource.getRepository(entity.name);
      await repository.clear();
    }
  }
});

// Helper function to create test data without BeanBatch initially
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
  // Create a bean batch using SQL directly to avoid timestamp issues
  const beanBatchRepository = testDataSource.getRepository(BeanBatch);
  
  // Use QueryRunner to insert directly with SQLite-compatible datetime
  const queryRunner = testDataSource.createQueryRunner();
  await queryRunner.connect();
  
  try {
    const beanBatchId = 'test-batch-' + Date.now();
    await queryRunner.query(`
      INSERT INTO bean_batches (id, beanId, roastDate, bestByDate, weightKg, notes, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      beanBatchId,
      bean.id,
      '2024-01-01',
      '2024-07-01',
      5.0,
      'Test batch'
    ]);
    
    const result = await beanBatchRepository.findOne({ where: { id: beanBatchId } });
    if (!result) {
      throw new Error('Failed to create test bean batch');
    }
    return result;
  } finally {
    await queryRunner.release();
  }
};
