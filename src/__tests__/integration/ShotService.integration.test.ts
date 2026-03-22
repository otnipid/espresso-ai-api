import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { ShotService } from '../../services/ShotService';
import { Bean } from '../../entities/Bean';
import { BeanBatch } from '../../entities/BeanBatch';
import { Machine } from '../../entities/Machine';
import { User } from '../../entities/User';
import { Grinder } from '../../entities/Grinder';
import { Repository } from 'typeorm';
import { Shot } from '../../entities/Shot';

// This is crucial: tell Vitest to replace the real '../../data-source' module
// with our mock, so we can control what getDataSource() returns in tests.
vi.mock('../../data-source');

describe('ShotService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let shotService: ShotService;
  let beanRepository: Repository<Bean>;
  let beanBatchRepository: Repository<BeanBatch>;
  let machineRepository: Repository<Machine>;
  let userRepository: Repository<User>;
  let grinderRepository: Repository<Grinder>;

  // Start single container ONCE before all tests in this file
  beforeAll(async () => {
    await containerManager.initialize();
  }, 60000); // Increase timeout for container init

  // Restore snapshot and get a fresh DB connection BEFORE EACH test
  beforeEach(async () => {
    testDb = await containerManager.setupTestDatabase();

    // Point mocked getDataSource function to return our test database DataSource
    vi.mocked(getDataSource).mockReturnValue(testDb.dataSource);

    // Initialize service with mocked DataSource
    shotService = new ShotService(testDb.dataSource);

    // Get repositories for test data setup
    beanRepository = testDb.dataSource.getRepository(Bean);
    beanBatchRepository = testDb.dataSource.getRepository(BeanBatch);
    machineRepository = testDb.dataSource.getRepository(Machine);
    userRepository = testDb.dataSource.getRepository(User);
    grinderRepository = testDb.dataSource.getRepository(Grinder);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  // Stop single container ONCE after all tests in this file are done
  afterAll(async () => {
    await containerManager.teardown();
  }, 60000); // Increase timeout for container teardown

  describe('Shot Creation', () => {
    it('should create a shot with valid data', async () => {
      // Arrange: Create test data
      const user = userRepository.create({
        name: 'Test User',
      });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'Test Machine Model',
        firmware_version: '1.0.0',
      });
      const savedMachine = await machineRepository.save(machine);

      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Colombia',
        region: 'Huila',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatch = beanBatchRepository.create({
        bean: savedBean,
        roastDate: new Date('2024-01-01'),
        bagOpenDate: new Date('2024-07-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({
        model: 'Test Grinder',
      });
      const savedGrinder = await grinderRepository.save(grinder);

      const shotData = {
        userId: savedUser.id,
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
      };

      // Act: Create shot
      const result = await shotService.createShot(shotData);

      // Assert: Verify shot was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.user.id).toBe(savedUser.id);
      expect(result.machine.id).toBe(savedMachine.id);
      expect(result.beanBatch.id).toBe(savedBeanBatch.id);
      expect(result.grinder.id).toBe(savedGrinder.id);
      expect(result.shot_type).toBe(shotData.shot_type);

      // Optional: Verify directly in DB
      const shots = await testDb.dataSource.query('SELECT * FROM shots WHERE id = $1', [result.id]);
      expect(shots.length).toBe(1);
      expect(shots[0].user_id).toBe(savedUser.id);
    });

    it('should throw error for invalid user ID', async () => {
      const shotData = {
        userId: '00000000-0000-0000-0000-000000000000', // Valid UUID format but non-existent
        machineId: '00000000-0000-0000-0000-000000000000',
        beanBatchId: '00000000-0000-0000-0000-000000000000',
        grinderId: '00000000-0000-0000-0000-000000000000',
        shot_type: 'espresso' as Shot['shot_type'],
      };

      await expect(shotService.createShot(shotData)).rejects.toThrow(
        'User with ID 00000000-0000-0000-0000-000000000000 not found'
      );
    });

    it('should throw error for invalid machine ID', async () => {
      // Create valid entities first
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Colombia',
        region: 'Huila',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatch = beanBatchRepository.create({
        bean: savedBean,
        roastDate: new Date('2024-01-01'),
        bagOpenDate: new Date('2024-07-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({ model: 'Test Grinder' });
      const savedGrinder = await grinderRepository.save(grinder);

      const shotData = {
        userId: savedUser.id,
        machineId: '00000000-0000-0000-0000-000000000000', // Valid UUID format but non-existent
        beanBatchId: savedBeanBatch.id,
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
      };

      await expect(shotService.createShot(shotData)).rejects.toThrow(
        'Machine with ID 00000000-0000-0000-0000-000000000000 not found'
      );
    });
  });

  describe('Shot Retrieval', () => {
    it('should retrieve a shot by ID', async () => {
      // Arrange: Create test data and shot
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'Test Machine Model',
        firmware_version: '1.0.0',
      });
      const savedMachine = await machineRepository.save(machine);

      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Colombia',
        region: 'Huila',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatch = beanBatchRepository.create({
        bean: savedBean,
        roastDate: new Date('2024-01-01'),
        bagOpenDate: new Date('2024-07-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({
        model: 'Test Grinder',
      });
      const savedGrinder = await grinderRepository.save(grinder);

      const shotData = {
        userId: savedUser.id,
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
      };

      const createdShot = await shotService.createShot(shotData);

      // Act: Retrieve shot
      const result = await shotService.getShotById(createdShot.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(createdShot.id);
      expect(result.user.id).toBe(savedUser.id);
      expect(result.machine.id).toBe(savedMachine.id);
    });

    it('should return null for non-existent shot ID', async () => {
      await expect(shotService.getShotById('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
        'Shot with ID 00000000-0000-0000-0000-000000000000 not found'
      );
    });
  });

  describe('Shot Statistics', () => {
    it('should get shot statistics for filtering', async () => {
      // Arrange: Create test data
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'Test Machine Model',
        firmware_version: '1.0.0',
      });
      const savedMachine = await machineRepository.save(machine);

      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Colombia',
        region: 'Huila',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatch = beanBatchRepository.create({
        bean: savedBean,
        roastDate: new Date('2024-01-01'),
        bagOpenDate: new Date('2024-07-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({
        model: 'Test Grinder',
      });
      const savedGrinder = await grinderRepository.save(grinder);

      const shotData1 = {
        userId: savedUser.id,
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
        success: true,
      };

      const shotData2 = {
        userId: savedUser.id,
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
        success: false,
      };

      await shotService.createShot(shotData1);
      await shotService.createShot(shotData2);

      // Act: Get statistics
      const stats = await shotService.getShotStatistics({
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
      });

      // Assert: Should have 2 total shots, 1 successful, 1 failed
      expect(stats.total).toBe(2);
      expect(stats.successful).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBe(50);
    });
  });
});
