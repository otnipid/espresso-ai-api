import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { ShotService } from '../../services/ShotService';
import { BeanBatch } from '../../entities/BeanBatch';
import { Machine } from '../../entities/Machine';
import { User } from '../../entities/User';
import { Grinder } from '../../entities/Grinder';
import { Shot } from '../../entities/Shot';
import { Repository } from 'typeorm';

// Mock the data-source module to use our test database
vi.mock('../../data-source');

describe('ShotService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let shotService: ShotService;
  let beanBatchRepository: Repository<BeanBatch>;
  let machineRepository: Repository<Machine>;
  let userRepository: Repository<User>;
  let grinderRepository: Repository<Grinder>;

  // Start single container ONCE before all tests in this file
  beforeAll(async () => {
    await containerManager.initialize();
  }, 60000); // Increase timeout for container init

  // Stop single container ONCE after all tests in this file are done
  afterAll(async () => {
    await containerManager.teardown();
  }, 60000); // Increase timeout for container teardown

  // Restore snapshot and get a fresh DB connection BEFORE EACH test
  beforeEach(async () => {
    testDb = await containerManager.setupTestDatabase();

    // Point mocked getDataSource function to return our test database DataSource
    vi.mocked(getDataSource).mockReturnValue(testDb.dataSource);

    // Initialize service with mocked DataSource
    shotService = new ShotService(testDb.dataSource);

    // Get repositories for test data setup
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

  describe('createShot', () => {
    it('should create shot with all related entities', async () => {
      // Arrange: Create test data
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });
      const savedMachine = await machineRepository.save(machine);

      const beanBatch = beanBatchRepository.create({
        name: 'Ethiopian Yirgacheffe',
        roaster: 'Blue Bottle Coffee',
        country: 'Ethiopia',
        roastDate: new Date('2024-01-01'),
        bagOpenDate: new Date('2024-07-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({
        model: 'Baratza Vario',
        manufacturer: 'Baratza',
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

    it('should throw error when user does not exist', async () => {
      // Arrange: Create test data with non-existent user
      const machine = machineRepository.create({
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });
      const savedMachine = await machineRepository.save(machine);

      const beanBatch = beanBatchRepository.create({
        name: 'Test Bean Batch',
        roastDate: new Date('2024-01-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({
        model: 'Baratza Vario',
        manufacturer: 'Baratza',
      });
      const savedGrinder = await grinderRepository.save(grinder);

      const shotData = {
        userId: '00000000-0000-0000-0000-000000000000', // Valid UUID format but non-existent
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
      };

      // Act & Assert: Should throw error for non-existent user
      await expect(shotService.createShot(shotData)).rejects.toThrow(
        'User with ID 00000000-0000-0000-0000-000000000000 not found'
      );
    });

    it('should throw error when bean batch does not exist', async () => {
      // Arrange: Create test data with non-existent bean batch
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });
      const savedMachine = await machineRepository.save(machine);

      const grinder = grinderRepository.create({
        model: 'Baratza Vario',
        manufacturer: 'Baratza',
      });
      const savedGrinder = await grinderRepository.save(grinder);

      const shotData = {
        userId: savedUser.id,
        machineId: savedMachine.id,
        beanBatchId: '00000000-0000-0000-0000-000000000000', // Valid UUID format but non-existent
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
      };

      // Act & Assert: Should throw error for non-existent bean batch
      await expect(shotService.createShot(shotData)).rejects.toThrow(
        'BeanBatch with ID 00000000-0000-0000-0000-000000000000 not found'
      );
    });

    it('should throw error when machine does not exist', async () => {
      // Arrange: Create test data with non-existent machine
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const beanBatch = beanBatchRepository.create({
        name: 'Test Bean Batch',
        roastDate: new Date('2024-01-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({
        model: 'Baratza Vario',
        manufacturer: 'Baratza',
      });
      const savedGrinder = await grinderRepository.save(grinder);

      const shotData = {
        userId: savedUser.id,
        machineId: '00000000-0000-0000-0000-000000000000', // Valid UUID format but non-existent
        beanBatchId: savedBeanBatch.id,
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
      };

      // Act & Assert: Should throw error for non-existent machine
      await expect(shotService.createShot(shotData)).rejects.toThrow(
        'Machine with ID 00000000-0000-0000-0000-000000000000 not found'
      );
    });

    it('should throw error when grinder does not exist', async () => {
      // Arrange: Create test data with non-existent grinder
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });
      const savedMachine = await machineRepository.save(machine);

      const beanBatch = beanBatchRepository.create({
        name: 'Test Bean Batch',
        roastDate: new Date('2024-01-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const shotData = {
        userId: savedUser.id,
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
        grinderId: '00000000-0000-0000-0000-000000000000', // Valid UUID format but non-existent
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
      };

      // Act & Assert: Should throw error for non-existent grinder
      await expect(shotService.createShot(shotData)).rejects.toThrow(
        'Grinder with ID 00000000-0000-0000-0000-000000000000 not found'
      );
    });
  });

  describe('getShotById', () => {
    it('should return shot when found', async () => {
      // Arrange: Create test data
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });
      const savedMachine = await machineRepository.save(machine);

      const beanBatch = beanBatchRepository.create({
        name: 'Test Bean Batch',
        roaster: 'Test Roaster',
        country: 'Colombia',
        roastDate: new Date('2024-01-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({
        model: 'Baratza Vario',
        manufacturer: 'Baratza',
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

      // Act: Get shot by ID
      const result = await shotService.getShotById(createdShot.id);

      // Assert: Verify shot is returned
      expect(result).toBeDefined();
      expect(result.id).toBe(createdShot.id);
      expect(result.user.id).toBe(savedUser.id);
      expect(result.machine.id).toBe(savedMachine.id);
      expect(result.beanBatch.id).toBe(savedBeanBatch.id);
      expect(result.beanBatch.name).toBe('Test Bean Batch');
      expect(result.beanBatch.roaster).toBe('Test Roaster');
      expect(result.beanBatch.country).toBe('Colombia');
      expect(result.grinder.id).toBe(savedGrinder.id);
    });

    it('should throw error when shot not found', async () => {
      // Act & Assert: Should throw error for non-existent shot
      await expect(shotService.getShotById('550e8400-e29b-41d4-a716-446655440002')).rejects.toThrow(
        'Shot with ID 550e8400-e29b-41d4-a716-446655440002 not found'
      );
    });
  });

  describe('getShots', () => {
    it('should return all shots', async () => {
      // Arrange: Create test data with multiple shots
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });
      const savedMachine = await machineRepository.save(machine);

      const beanBatch1 = beanBatchRepository.create({
        name: 'Ethiopian Bean',
        roaster: 'Blue Bottle',
        country: 'Ethiopia',
        roastDate: new Date('2024-01-01'),
      });
      const savedBeanBatch1 = await beanBatchRepository.save(beanBatch1);

      const beanBatch2 = beanBatchRepository.create({
        name: 'Colombian Bean',
        roaster: 'Intelligentsia',
        country: 'Colombia',
        roastDate: new Date('2024-02-01'),
      });
      const savedBeanBatch2 = await beanBatchRepository.save(beanBatch2);

      const grinder = grinderRepository.create({
        model: 'Baratza Vario',
        manufacturer: 'Baratza',
      });
      const savedGrinder = await grinderRepository.save(grinder);

      const shotData1 = {
        userId: savedUser.id,
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch1.id,
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
      };

      const shotData2 = {
        userId: savedUser.id,
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch2.id,
        grinderId: savedGrinder.id,
        shot_type: 'ristretto' as Shot['shot_type'],
        pulled_at: new Date(),
      };

      await shotService.createShot(shotData1);
      await shotService.createShot(shotData2);

      // Act: Get all shots
      const result = await shotService.getShots();

      // Assert: Verify all shots are returned
      expect(result.shots).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.shots[0].shot_type).toBe('espresso');
      expect(result.shots[1].shot_type).toBe('ristretto');
      expect(result.shots[0].beanBatch.name).toBe('Ethiopian Bean');
      expect(result.shots[1].beanBatch.name).toBe('Colombian Bean');
    });

    it('should return empty array when no shots exist', async () => {
      // Act: Get all shots
      const result = await shotService.getShots();

      // Assert: Should return empty array
      expect(result.shots).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateShot', () => {
    it('should update existing shot', async () => {
      // Arrange: Create test data
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });
      const savedMachine = await machineRepository.save(machine);

      const beanBatch = beanBatchRepository.create({
        name: 'Test Bean Batch',
        roastDate: new Date('2024-01-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({
        model: 'Baratza Vario',
        manufacturer: 'Baratza',
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

      const updateData = {
        shot_type: 'lungo' as Shot['shot_type'],
        success: true,
      };

      // Act: Update shot
      const result = await shotService.updateShot(createdShot.id, updateData);

      // Assert: Verify shot was updated
      expect(result).toBeDefined();
      expect(result.id).toBe(createdShot.id);
      expect(result.shot_type).toBe('lungo');
      expect(result.success).toBe(true);
    });

    it('should throw error when updating non-existent shot', async () => {
      // Act & Assert: Should throw error for non-existent shot
      const updateData = {
        shot_type: 'lungo' as Shot['shot_type'],
      };
      await expect(
        shotService.updateShot('550e8400-e29b-41d4-a716-446655440003', updateData)
      ).rejects.toThrow('Shot with ID 550e8400-e29b-41d4-a716-446655440003 not found');
    });
  });

  describe('deleteShot', () => {
    it('should delete existing shot', async () => {
      // Arrange: Create test data
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });
      const savedMachine = await machineRepository.save(machine);

      const beanBatch = beanBatchRepository.create({
        name: 'Test Bean Batch',
        roastDate: new Date('2024-01-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({
        model: 'Baratza Vario',
        manufacturer: 'Baratza',
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

      // Act: Delete shot
      const result = await shotService.softDeleteShot(createdShot.id);

      // Assert: Verify deletion was successful
      expect(result).toBe(true);

      // Verify shot is soft deleted (getShotById filters out soft-deleted shots)
      await expect(shotService.getShotById(createdShot.id)).rejects.toThrow('Shot with ID');
    });

    it('should throw error when deleting non-existent shot', async () => {
      // Act & Assert: Should return false for non-existent shot
      const result = await shotService.softDeleteShot('550e8400-e29b-41d4-a716-446655440004');
      expect(result).toBe(false);
    });
  });

  describe('getShotStatistics', () => {
    it('should return statistics for machine and bean batch', async () => {
      // Arrange: Create test data
      const user = userRepository.create({ name: 'Test User' });
      const savedUser = await userRepository.save(user);

      const machine = machineRepository.create({
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });
      const savedMachine = await machineRepository.save(machine);

      const beanBatch = beanBatchRepository.create({
        name: 'Test Bean Batch',
        roastDate: new Date('2024-01-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      const grinder = grinderRepository.create({
        model: 'Baratza Vario',
        manufacturer: 'Baratza',
      });
      const savedGrinder = await grinderRepository.save(grinder);

      const shotData1 = {
        userId: savedUser.id,
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
      };

      const shotData2 = {
        userId: savedUser.id,
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
        grinderId: savedGrinder.id,
        shot_type: 'espresso' as Shot['shot_type'],
        pulled_at: new Date(),
      };

      await shotService.createShot(shotData1);
      await shotService.createShot(shotData2);

      // Act: Get statistics
      const stats = await shotService.getShotStatistics({
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
      });

      // Assert: Should have 2 total shots
      expect(stats.total).toBe(2);
      expect(stats.successful).toBe(0); // No shots marked as successful
      expect(stats.failed).toBe(2);
    });

    it('should return empty statistics when no shots exist', async () => {
      // Arrange: Create test data
      const machine = machineRepository.create({
        model: 'La Marzocco Linea Mini',
        manufacturer: 'La Marzocco',
      });
      const savedMachine = await machineRepository.save(machine);

      const beanBatch = beanBatchRepository.create({
        name: 'Test Bean Batch',
        roastDate: new Date('2024-01-01'),
      });
      const savedBeanBatch = await beanBatchRepository.save(beanBatch);

      // Act: Get statistics
      const stats = await shotService.getShotStatistics({
        machineId: savedMachine.id,
        beanBatchId: savedBeanBatch.id,
      });

      // Assert: Should have 0 total shots
      expect(stats.total).toBe(0);
      expect(stats.successful).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });
});
