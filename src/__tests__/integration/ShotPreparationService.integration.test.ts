import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { ShotPreparationService } from '../../services/ShotPreparationService';
import { Shot } from '../../entities/Shot';
import { ShotPreparation } from '../../entities/ShotPreparation';
import { Repository } from 'typeorm';

// This is crucial: tell Vitest to replace the real '../../data-source' module
// with our mock, so we can control what getDataSource() returns in tests.
vi.mock('../../data-source');

describe('ShotPreparationService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let shotPreparationService: ShotPreparationService;
  let shotRepository: Repository<Shot>;
  let shotPreparationRepository: Repository<ShotPreparation>;

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
    shotPreparationService = new ShotPreparationService(testDb.dataSource);

    // Get repositories for test data setup
    shotRepository = testDb.dataSource.getRepository(Shot);
    shotPreparationRepository = testDb.dataSource.getRepository(ShotPreparation);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  describe('createShotPreparation', () => {
    it('should create a shot preparation with all fields', async () => {
      // Arrange: Create test data using repositories
      const shot = shotRepository.create({
        shot_type: 'normale', // Use valid ShotType
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const preparationData = {
        shot_id: savedShot.id,
        dose_grams: 18.5,
        grind_setting: 15,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'flat',
        tamp_pressure_category: 'medium',
      };

      // Act: Call service method
      const result = await shotPreparationService.createShotPreparation(preparationData);

      // Assert: Verify preparation was created
      expect(result).toBeDefined();
      expect(result.shot_id).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.dose_grams).toBe(18.5);
      expect(result.grind_setting).toBe(15);
      expect(result.basket_type).toBe('bottomless');
      expect(result.basket_size_grams).toBe(18);
      expect(result.distribution_method).toBe('WDT');
      expect(result.tamp_type).toBe('flat');
      expect(result.tamp_pressure_category).toBe('medium');
    });

    it('should handle null values correctly', async () => {
      // Arrange: Create test data with null values
      const shot = shotRepository.create({
        shot_type: 'normale', // Use valid ShotType
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const preparationData = {
        shot_id: savedShot.id,
        dose_grams: null,
        grind_setting: null,
        basket_type: null,
        basket_size_grams: null,
        distribution_method: null,
        tamp_type: null,
        tamp_pressure_category: null,
      };

      // Act: Call service method
      const result = await shotPreparationService.createShotPreparation(preparationData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.shot_id).toBeDefined();
      expect(result.dose_grams).toBeNull();
      expect(result.grind_setting).toBeNull();
      expect(result.basket_type).toBeNull();
      expect(result.basket_size_grams).toBeNull();
      expect(result.distribution_method).toBeNull();
      expect(result.tamp_type).toBeNull();
      expect(result.tamp_pressure_category).toBeNull();
    });

    it('should handle numeric string conversions', async () => {
      // Arrange: Create test data with string numbers
      const shot = shotRepository.create({
        shot_type: 'normale', // Use valid ShotType
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const preparationData = {
        shot_id: savedShot.id,
        dose_grams: "18.5", // String that should be converted to number
        grind_setting: "15.0", // String that should be converted to number
        basket_type: 'bottomless',
        basket_size_grams: "18", // String that should be converted to number
        distribution_method: 'WDT',
        tamp_type: 'flat',
        tamp_pressure_category: 'medium',
      };

      // Act: Call service method
      const result = await shotPreparationService.createShotPreparation(preparationData);

      // Assert: Verify preparation was created with numeric conversions
      expect(result).toBeDefined();
      expect(result.shot_id).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.dose_grams).toBe(18.5); // Service should convert string to number
      expect(result.grind_setting).toBe(15.0); // Service should convert string to number
      expect(result.basket_size_grams).toBe(18); // Service should convert string to number
      expect(result.basket_type).toBe('bottomless');
      expect(result.distribution_method).toBe('WDT');
      expect(result.tamp_type).toBe('flat');
      expect(result.tamp_pressure_category).toBe('medium');
    });

    it('should throw error when shot does not exist', async () => {
      // Arrange: Create preparation data for non-existent shot
      const preparationData = {
        shot_id: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format
        dose_grams: 18.5,
        grind_setting: 15,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'flat',
        tamp_pressure_category: 'medium',
      };

      // Act & Assert: Should throw error for non-existent shot
      await expect(shotPreparationService.createShotPreparation(preparationData)).rejects.toThrow('Shot with ID 550e8400-e29b-41d4-a716-446655440001 not found');
    });
  });

  describe('getShotPreparationById', () => {
    it('should return shot preparation when found', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale', // Use valid ShotType
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const preparation = await shotPreparationService.createShotPreparation({
        shot_id: savedShot.id,
        dose_grams: 18.5,
        grind_setting: 15,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'flat',
        tamp_pressure_category: 'medium',
      });

      // Act: Get preparation by ID
      const result = await shotPreparationService.getShotPreparationById(preparation.shot_id);

      // Assert: Verify preparation is returned
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.dose_grams).toBe('18.50'); // Service returns string, not number
    });

    it('should throw error when preparation not found', async () => {
      // Act & Assert: Should throw error for non-existent preparation
      await expect(shotPreparationService.getShotPreparationById('550e8400-e29b-41d4-a716-446655440002')).rejects.toThrow('Shot preparation with ID 550e8400-e29b-41d4-a716-446655440002 not found');
    });
  });

  describe('getShotPreparationsByShotId', () => {
    it('should return all preparations for a shot', async () => {
      // Arrange: Create test data with multiple preparations
      const shot1 = shotRepository.create({
        shot_type: 'normale', // Use valid ShotType
        pulled_at: new Date(),
      });
      const savedShot1 = await shotRepository.save(shot1);

      const shot2 = shotRepository.create({
        shot_type: 'normale', // Use valid ShotType
        pulled_at: new Date(),
      });
      const savedShot2 = await shotRepository.save(shot2);

      const preparation1 = await shotPreparationService.createShotPreparation({
        shot_id: savedShot1.id,
        dose_grams: 18.5,
        grind_setting: 15,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'flat',
        tamp_pressure_category: 'medium',
      });

      const preparation2 = await shotPreparationService.createShotPreparation({
        shot_id: savedShot2.id,
        dose_grams: 19.0,
        grind_setting: 14,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'flat',
        tamp_pressure_category: 'medium',
      });

      // Act: Get all preparations
      const result = await shotPreparationService.getAllShotPreparations();

      // Assert: Verify all preparations are returned
      expect(result).toHaveLength(2);
      expect(result[0].shot_id).toBe(preparation1.shot_id);
      expect(result[1].shot_id).toBe(preparation2.shot_id);
      expect(result[0].dose_grams).toBe('18.50'); // Service returns string
      expect(result[1].dose_grams).toBe('19.00'); // Service returns string
    });

    it('should return empty array when no preparations exist for shot', async () => {
      // Arrange: Create shot without preparations
      const shot = shotRepository.create({
        shot_type: 'normale', // Use valid ShotType
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      // Act: Get all preparations for shot
      const result = await shotPreparationService.getShotPreparationsByShotId(savedShot.id);

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateShotPreparation', () => {
    it('should update existing preparation', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale', // Use valid ShotType
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const preparation = await shotPreparationService.createShotPreparation({
        shot_id: savedShot.id,
        dose_grams: 18.5,
        grind_setting: 15,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'flat',
        tamp_pressure_category: 'medium',
      });

      const updateData = {
        dose_grams: 19.0,
        grind_setting: 14,
        basket_type: 'portafilter',
      };

      // Act: Update preparation
      const result = await shotPreparationService.updateShotPreparation(preparation.shot_id, updateData);

      // Assert: Verify preparation was updated
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(preparation.shot_id);
      expect(result.dose_grams).toBe(19.0);
      expect(result.grind_setting).toBe(14);
      expect(result.basket_type).toBe('portafilter');
      expect(result.distribution_method).toBe('WDT'); // Should remain unchanged
      expect(result.tamp_type).toBe('flat'); // Should remain unchanged
      expect(result.tamp_pressure_category).toBe('medium'); // Should remain unchanged
    });

    it('should throw error when updating non-existent preparation', async () => {
      // Act & Assert: Should throw error for non-existent preparation
      const updateData = {
        dose_grams: 19.0,
      };
      await expect(shotPreparationService.updateShotPreparation('550e8400-e29b-41d4-a716-446655440003', updateData)).rejects.toThrow('Shot preparation with ID 550e8400-e29b-41d4-a716-446655440003 not found');
    });
  });

  describe('deleteShotPreparation', () => {
    it('should delete existing preparation', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale', // Use valid ShotType
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const preparation = await shotPreparationService.createShotPreparation({
        shot_id: savedShot.id,
        dose_grams: 18.5,
        grind_setting: 15,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'flat',
        tamp_pressure_category: 'medium',
      });

      // Act: Delete preparation
      const result = await shotPreparationService.deleteShotPreparation(preparation.shot_id);

      // Assert: Verify deletion was successful
      expect(result).toBe(true);
    });

    it('should throw error when deleting non-existent preparation', async () => {
      // Act & Assert: Should throw error for non-existent preparation
      await expect(shotPreparationService.deleteShotPreparation('550e8400-e29b-41d4-a716-446655440004')).rejects.toThrow('Shot preparation with ID 550e8400-e29b-41d4-a716-446655440004 not found');
    });
  });
});
