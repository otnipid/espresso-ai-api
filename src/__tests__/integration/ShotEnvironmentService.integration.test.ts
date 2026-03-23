import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { ShotEnvironmentService } from '../../services/ShotEnvironmentService';
import { ShotEnvironment } from '../../entities/shotEnvironment';
import { Shot } from '../../entities/Shot';
import { Repository } from 'typeorm';

// This is crucial: tell Vitest to replace the real '../../data-source' module
// with our mock, so we can control what getDataSource() returns in tests.
vi.mock('../../data-source');

describe('ShotEnvironmentService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let shotEnvironmentService: ShotEnvironmentService;
  let shotRepository: Repository<Shot>;
  let shotEnvironmentRepository: Repository<ShotEnvironment>;

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
    shotEnvironmentService = new ShotEnvironmentService(testDb.dataSource);

    // Get repositories for test data setup
    shotRepository = testDb.dataSource.getRepository(Shot);
    shotEnvironmentRepository = testDb.dataSource.getRepository(ShotEnvironment);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  describe('createShotEnvironment', () => {
    it('should create a shot environment with all fields', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      // Act: Call service method
      const result = await shotEnvironmentService.createShotEnvironment(environmentData);

      // Assert: Verify environment was created
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.ambient_temp_c).toBe(22.5); // Service returns number for create
      expect(result.humidity_percent).toBe(65.0); // Service returns number for create
      expect(result.water_source).toBe('Filtered Tap Water');
      expect(result.estimated_water_hardness_ppm).toBe(150);
      expect(result.machine_warmup_minutes).toBe(15);
      expect(result.shots_since_clean).toBe(3);
    });

    it('should handle null values correctly', async () => {
      // Arrange: Create test data with null values
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: null,
        humidity_percent: null,
        water_source: null,
        estimated_water_hardness_ppm: null,
        machine_warmup_minutes: null,
        shots_since_clean: null,
      };

      // Act: Call service method
      const result = await shotEnvironmentService.createShotEnvironment(environmentData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.ambient_temp_c).toBeNull();
      expect(result.humidity_percent).toBeNull();
      expect(result.water_source).toBeNull();
      expect(result.estimated_water_hardness_ppm).toBeNull();
      expect(result.machine_warmup_minutes).toBeNull();
      expect(result.shots_since_clean).toBeNull();
    });

    it('should handle string numeric values correctly', async () => {
      // Arrange: Create test data with string numeric values
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: '23.0',
        humidity_percent: '68.5',
        water_source: 'Spring Water',
        estimated_water_hardness_ppm: '120',
        machine_warmup_minutes: '20',
        shots_since_clean: '5',
      };

      // Act: Call service method
      const result = await shotEnvironmentService.createShotEnvironment(environmentData);

      // Assert: Verify string numeric values are converted to numbers
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.ambient_temp_c).toBe(23.0);
      expect(result.humidity_percent).toBe(68.5);
      expect(result.water_source).toBe('Spring Water');
      expect(result.estimated_water_hardness_ppm).toBe(120);
      expect(result.machine_warmup_minutes).toBe(20);
      expect(result.shots_since_clean).toBe(5);
    });

    it('should handle invalid numeric values by setting them to null', async () => {
      // Arrange: Create test data with invalid numeric values
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 'invalid-temp',
        humidity_percent: 'invalid-humidity',
        water_source: 'Test Water',
        estimated_water_hardness_ppm: 'invalid-hardness',
        machine_warmup_minutes: 'invalid-warmup',
        shots_since_clean: 'invalid-shots',
      };

      // Act: Call service method
      const result = await shotEnvironmentService.createShotEnvironment(environmentData);

      // Assert: Verify invalid numeric values are set to null
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.ambient_temp_c).toBeNull();
      expect(result.humidity_percent).toBeNull();
      expect(result.water_source).toBe('Test Water');
      expect(result.estimated_water_hardness_ppm).toBeNull();
      expect(result.machine_warmup_minutes).toBeNull();
      expect(result.shots_since_clean).toBeNull();
    });

    it('should trim whitespace from string fields', async () => {
      // Arrange: Create test data with extra whitespace
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 21.5,
        humidity_percent: 60.0,
        water_source: '  Filtered Water  ',
        estimated_water_hardness_ppm: 180,
        machine_warmup_minutes: 10,
        shots_since_clean: 2,
      };

      // Act: Call service method
      const result = await shotEnvironmentService.createShotEnvironment(environmentData);

      // Assert: Verify whitespace is trimmed
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.water_source).toBe('Filtered Water');
    });

    it('should throw error when shot does not exist', async () => {
      // Arrange: Create environment data for non-existent shot
      const environmentData = {
        shot_id: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      // Act & Assert: Should throw error for non-existent shot
      await expect(shotEnvironmentService.createShotEnvironment(environmentData)).rejects.toThrow('Shot with ID 550e8400-e29b-41d4-a716-446655440001 not found');
    });

    it('should throw error when shot ID is missing', async () => {
      // Arrange: Create environment data with missing shot ID
      const environmentData = {
        shot_id: '', // Empty shot ID
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      // Act & Assert: Should throw error for missing shot ID
      await expect(shotEnvironmentService.createShotEnvironment(environmentData)).rejects.toThrow('Shot ID is required');
    });
  });

  describe('getShotEnvironmentById', () => {
    it('should return shot environment when found', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      const environment = await shotEnvironmentService.createShotEnvironment(environmentData);

      // Act: Get environment by ID
      const result = await shotEnvironmentService.getShotEnvironmentById(environment.shot_id);

      // Assert: Verify environment is returned
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(environment.shot_id);
      expect(result.ambient_temp_c).toBe('22.5'); // Service returns string for read
      expect(result.humidity_percent).toBe('65.0'); // Service returns string for read
      expect(result.water_source).toBe('Filtered Tap Water');
      expect(result.estimated_water_hardness_ppm).toBe(150);
      expect(result.machine_warmup_minutes).toBe(15);
      expect(result.shots_since_clean).toBe(3);
    });

    it('should throw error when environment not found', async () => {
      // Act & Assert: Should throw error for non-existent environment
      await expect(shotEnvironmentService.getShotEnvironmentById('550e8400-e29b-41d4-a716-446655440002')).rejects.toThrow('Shot environment with ID 550e8400-e29b-41d4-a716-446655440002 not found');
    });
  });

  describe('getAllShotEnvironments', () => {
    it('should return all shot environments', async () => {
      // Arrange: Create test data with multiple environments
      const shot1 = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot1 = await shotRepository.save(shot1);

      const shot2 = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot2 = await shotRepository.save(shot2);

      const environment1Data = {
        shot_id: savedShot1.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      const environment2Data = {
        shot_id: savedShot2.id,
        ambient_temp_c: 21.0,
        humidity_percent: 60.0,
        water_source: 'Spring Water',
        estimated_water_hardness_ppm: 120,
        machine_warmup_minutes: 10,
        shots_since_clean: 2,
      };

      const environment1 = await shotEnvironmentService.createShotEnvironment(environment1Data);
      const environment2 = await shotEnvironmentService.createShotEnvironment(environment2Data);

      // Act: Get all environments
      const result = await shotEnvironmentService.getAllShotEnvironments();

      // Assert: Verify all environments are returned
      expect(result).toHaveLength(2);
      expect(result[0].shot_id).toBe(environment1.shot_id);
      expect(result[1].shot_id).toBe(environment2.shot_id);
      expect(result[0].ambient_temp_c).toBe('22.5'); // Service returns string
      expect(result[1].ambient_temp_c).toBe('21.0'); // Service returns string
    });

    it('should return empty array when no environments exist', async () => {
      // Act: Get all environments
      const result = await shotEnvironmentService.getAllShotEnvironments();

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('getShotEnvironmentsByTemperature', () => {
    it('should return environments within temperature range', async () => {
      // Arrange: Create test data with multiple environments
      const shot1 = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot1 = await shotRepository.save(shot1);

      const shot2 = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot2 = await shotRepository.save(shot2);

      const shot3 = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot3 = await shotRepository.save(shot3);

      const environment1Data = {
        shot_id: savedShot1.id,
        ambient_temp_c: 20.0, // Within range
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      const environment2Data = {
        shot_id: savedShot2.id,
        ambient_temp_c: 22.5, // Within range
        humidity_percent: 60.0,
        water_source: 'Spring Water',
        estimated_water_hardness_ppm: 120,
        machine_warmup_minutes: 10,
        shots_since_clean: 2,
      };

      const environment3Data = {
        shot_id: savedShot3.id,
        ambient_temp_c: 25.0, // Outside range
        humidity_percent: 70.0,
        water_source: 'Bottled Water',
        estimated_water_hardness_ppm: 180,
        machine_warmup_minutes: 20,
        shots_since_clean: 5,
      };

      const environment1 = await shotEnvironmentService.createShotEnvironment(environment1Data);
      const environment2 = await shotEnvironmentService.createShotEnvironment(environment2Data);
      await shotEnvironmentService.createShotEnvironment(environment3Data);

      // Act: Get environments by temperature range
      const result = await shotEnvironmentService.getShotEnvironmentsByTemperature(19.0, 23.0);

      // Assert: Verify environments within range are returned
      expect(result).toHaveLength(2);
      expect(result[0].shot_id).toBe(environment1.shot_id);
      expect(result[1].shot_id).toBe(environment2.shot_id);
      expect(result[0].ambient_temp_c).toBe('20.0'); // Service returns string
      expect(result[1].ambient_temp_c).toBe('22.5'); // Service returns string
    });

    it('should return empty array when no environments within temperature range', async () => {
      // Arrange: Create environments with temperatures outside range
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 30.0, // Outside range
        humidity_percent: 70.0,
        water_source: 'Bottled Water',
        estimated_water_hardness_ppm: 180,
        machine_warmup_minutes: 20,
        shots_since_clean: 5,
      };

      await shotEnvironmentService.createShotEnvironment(environmentData);

      // Act: Get environments by temperature range
      const result = await shotEnvironmentService.getShotEnvironmentsByTemperature(20.0, 25.0);

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no environments exist', async () => {
      // Act: Get environments by temperature range
      const result = await shotEnvironmentService.getShotEnvironmentsByTemperature(20.0, 25.0);

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateShotEnvironment', () => {
    it('should update existing environment', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      const environment = await shotEnvironmentService.createShotEnvironment(environmentData);

      const updateData = {
        ambient_temp_c: 23.0,
        humidity_percent: 68.0,
        water_source: 'Spring Water',
      };

      // Act: Update environment
      const result = await shotEnvironmentService.updateShotEnvironment(environment.shot_id, updateData);

      // Assert: Verify environment was updated
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(environment.shot_id);
      expect(result.ambient_temp_c).toBe(23.0);
      expect(result.humidity_percent).toBe(68.0);
      expect(result.water_source).toBe('Spring Water');
      expect(result.estimated_water_hardness_ppm).toBe(150); // Should remain unchanged
      expect(result.machine_warmup_minutes).toBe(15); // Should remain unchanged
      expect(result.shots_since_clean).toBe(3); // Should remain unchanged
    });

    it('should handle partial updates correctly', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      const environment = await shotEnvironmentService.createShotEnvironment(environmentData);

      const updateData = {
        ambient_temp_c: 24.0,
      };

      // Act: Update environment partially
      const result = await shotEnvironmentService.updateShotEnvironment(environment.shot_id, updateData);

      // Assert: Verify only specified fields were updated
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(environment.shot_id);
      expect(result.ambient_temp_c).toBe(24.0);
      expect(result.humidity_percent).toBe('65.0'); // Service returns string for read // Should remain unchanged
      expect(result.water_source).toBe('Filtered Tap Water'); // Should remain unchanged
      expect(result.estimated_water_hardness_ppm).toBe(150); // Should remain unchanged
      expect(result.machine_warmup_minutes).toBe(15); // Should remain unchanged
      expect(result.shots_since_clean).toBe(3); // Should remain unchanged
    });

    it('should handle null values in updates', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      const environment = await shotEnvironmentService.createShotEnvironment(environmentData);

      const updateData = {
        ambient_temp_c: null,
        humidity_percent: null,
        water_source: null,
        estimated_water_hardness_ppm: null,
        machine_warmup_minutes: null,
        shots_since_clean: null,
      };

      // Act: Update environment with null values
      const result = await shotEnvironmentService.updateShotEnvironment(environment.shot_id, updateData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(environment.shot_id);
      expect(result.ambient_temp_c).toBeNull();
      expect(result.humidity_percent).toBeNull();
      expect(result.water_source).toBeNull();
      expect(result.estimated_water_hardness_ppm).toBeNull();
      expect(result.machine_warmup_minutes).toBeNull();
      expect(result.shots_since_clean).toBeNull();
    });

    it('should handle string numeric values in updates', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      const environment = await shotEnvironmentService.createShotEnvironment(environmentData);

      const updateData = {
        ambient_temp_c: '25.5',
        humidity_percent: '70.0',
        estimated_water_hardness_ppm: '200',
        machine_warmup_minutes: '25',
        shots_since_clean: '8',
      };

      // Act: Update environment with string numeric values
      const result = await shotEnvironmentService.updateShotEnvironment(environment.shot_id, updateData);

      // Assert: Verify string numeric values are converted to numbers
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(environment.shot_id);
      expect(result.ambient_temp_c).toBe(25.5);
      expect(result.humidity_percent).toBe(70.0);
      expect(result.water_source).toBe('Filtered Tap Water'); // Should remain unchanged
      expect(result.estimated_water_hardness_ppm).toBe(200);
      expect(result.machine_warmup_minutes).toBe(25);
      expect(result.shots_since_clean).toBe(8);
    });

    it('should handle invalid numeric values in updates by setting them to null', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      const environment = await shotEnvironmentService.createShotEnvironment(environmentData);

      const updateData = {
        ambient_temp_c: 'invalid-temp',
        humidity_percent: 'invalid-humidity',
        estimated_water_hardness_ppm: 'invalid-hardness',
      };

      // Act: Update environment with invalid numeric values
      const result = await shotEnvironmentService.updateShotEnvironment(environment.shot_id, updateData);

      // Assert: Verify invalid numeric values are set to null
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(environment.shot_id);
      expect(result.ambient_temp_c).toBeNull();
      expect(result.humidity_percent).toBeNull();
      expect(result.water_source).toBe('Filtered Tap Water'); // Should remain unchanged
      expect(result.estimated_water_hardness_ppm).toBeNull();
      expect(result.machine_warmup_minutes).toBe(15); // Should remain unchanged
      expect(result.shots_since_clean).toBe(3); // Should remain unchanged
    });

    it('should trim whitespace in updates', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      const environment = await shotEnvironmentService.createShotEnvironment(environmentData);

      const updateData = {
        water_source: '  Spring Water  ',
      };

      // Act: Update environment with whitespace
      const result = await shotEnvironmentService.updateShotEnvironment(environment.shot_id, updateData);

      // Assert: Verify whitespace is trimmed
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(environment.shot_id);
      expect(result.water_source).toBe('Spring Water');
    });

    it('should throw error when updating non-existent environment', async () => {
      // Act & Assert: Should throw error for non-existent environment
      const updateData = {
        ambient_temp_c: 23.0,
      };
      await expect(shotEnvironmentService.updateShotEnvironment('550e8400-e29b-41d4-a716-446655440003', updateData)).rejects.toThrow('Shot environment with ID 550e8400-e29b-41d4-a716-446655440003 not found');
    });
  });

  describe('deleteShotEnvironment', () => {
    it('should delete existing environment', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const environmentData = {
        shot_id: savedShot.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65.0,
        water_source: 'Filtered Tap Water',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15,
        shots_since_clean: 3,
      };

      const environment = await shotEnvironmentService.createShotEnvironment(environmentData);

      // Act: Delete environment
      const result = await shotEnvironmentService.deleteShotEnvironment(environment.shot_id);

      // Assert: Verify deletion was successful
      expect(result).toBe(true);
    });

    it('should throw error when deleting non-existent environment', async () => {
      // Act & Assert: Should throw error for non-existent environment
      await expect(shotEnvironmentService.deleteShotEnvironment('550e8400-e29b-41d4-a716-446655440004')).rejects.toThrow('Shot environment with ID 550e8400-e29b-41d4-a716-446655440004 not found');
    });
  });
});
