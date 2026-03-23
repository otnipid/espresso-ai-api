import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BeanService, BeanCreateData } from '../../services/BeanService';
import { Bean } from '../../entities/Bean';
import { DataSource, Repository } from 'typeorm';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';

// This is crucial: tell Vitest to replace the real '../../data-source' module
// with our mock, so we can control what getDataSource() returns in tests.
vi.mock('../../data-source');

describe('BeanService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let beanService: BeanService;
  let testDataSource: DataSource;
  let testDb: TestDatabase;
  let beanRepository: Repository<Bean>;

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
    beanService = new BeanService(testDb.dataSource);

    // Get repositories for test data setup
    beanRepository = testDb.dataSource.getRepository(Bean);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  describe('createBean', () => {
    it('should create a bean with all fields', async () => {
      // Arrange: Create test data using repositories
      const beanData = {
        name: 'Test Ethiopian Bean',
        roaster: 'Test Roaster Co',
        country: 'Ethiopia',
        region: 'Yirgacheffe',
        farm: 'Test Farm',
        varietal: 'Heirloom',
        processing_method: 'Washed',
        altitude_m: 1800,
        density_category: 'Medium',
      };

      // Act: Call service method
      const result = await beanService.createBean(beanData);

      // Assert: Verify bean was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Ethiopian Bean');
      expect(result.roaster).toBe('Test Roaster Co');
      expect(result.country).toBe('Ethiopia');
      expect(result.region).toBe('Yirgacheffe');
      expect(result.farm).toBe('Test Farm');
      expect(result.varietal).toBe('Heirloom');
      expect(result.processing_method).toBe('Washed');
      expect(result.altitude_m).toBe(1800);
      expect(result.density_category).toBe('Medium');
    });

    it('should handle altitude_m as string conversion', async () => {
      // Arrange: Create test data with string altitude
      const beanData = {
        name: 'Test Bean',
        roaster: 'Test Roaster',
        altitude_m: '2000', // String that should be converted to number
      };

      // Act: Call service method
      const result = await beanService.createBean(beanData);

      // Assert: Verify altitude was converted to number
      expect(result).toBeDefined();
      expect(result.altitude_m).toBe(2000);
      expect(typeof result.altitude_m).toBe('number');
    });

    it('should handle invalid altitude conversion', async () => {
      // Arrange: Create test data with invalid altitude string
      const invalidData = {
        name: 'Test Bean',
        roaster: 'Test Roaster',
        altitude_m: 'invalid-number', // Invalid string that can't be parsed
      };

      // Act & Assert: Should convert to null
      const result = await beanService.createBean(invalidData);
      expect(result).toBeDefined();
      expect(result.altitude_m).toBeNull();
    });

    it('should create bean with minimal required fields only', async () => {
      // Arrange: Create test data with only required fields
      const minimalData = {
        name: 'Minimal Bean',
        roaster: 'Minimal Roaster',
        // Only required fields
      };

      // Act: Call service method
      const result = await beanService.createBean(minimalData);

      // Assert: Verify bean was created with minimal data
      expect(result).toBeDefined();
      expect(result.name).toBe('Minimal Bean');
      expect(result.roaster).toBe('Minimal Roaster');
      expect(result.country).toBeNull();
      expect(result.region).toBeNull();
      expect(result.farm).toBeNull();
      expect(result.varietal).toBeNull();
      expect(result.processing_method).toBeNull();
      expect(result.altitude_m).toBeNull();
      expect(result.density_category).toBeNull();
    });
  });

  describe('getAllBeans', () => {
    it('should return all beans with relations', async () => {
      // Create some test beans
      const bean1 = await beanRepository.save({
        name: 'Bean 1',
        roaster: 'Roaster 1',
      });
      const bean2 = await beanRepository.save({
        name: 'Bean 2',
        roaster: 'Roaster 2',
      });

      // Act: Call service method
      const result = await beanService.getAllBeans();

      // Assert: Verify all beans are returned with relations
      expect(result).toHaveLength(2);
      expect(result[0].id).toBeDefined();
      expect(result[0].name).toBe('Bean 1');
      expect(result[1].name).toBe('Bean 2');
      // Verify relations are loaded (should be empty arrays since no bean batches exist)
      expect(Array.isArray(result[0].beanBatches)).toBe(true);
    });

    it('should return empty array when no beans exist', async () => {
      // Act: Call service method
      const result = await beanService.getAllBeans();

      // Assert: Verify empty result
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getBeanById', () => {
    it('should return bean by ID with relations', async () => {
      const createdBean = await beanRepository.save({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Colombia',
      });

      // Act: Call service method
      const result = await beanService.getBeanById(createdBean.id);

      // Assert: Verify bean is returned with correct data
      expect(result).toBeDefined();
      expect(result.id).toBe(createdBean.id);
      expect(result.name).toBe('Test Bean');
      expect(result.roaster).toBe('Test Roaster');
      expect(result.country).toBe('Colombia');
      // Verify relations are loaded
      expect(Array.isArray(result.beanBatches)).toBe(true);
    });

    it('should throw error when bean not found', async () => {
      // Arrange: Use non-existent ID
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';

      // Act & Assert: Should throw error
      await expect(beanService.getBeanById(nonExistentId)).rejects.toThrow(
        `Bean with ID ${nonExistentId} not found`
      );
    });
  });

  describe('updateBean', () => {
    it('should update existing bean', async () => {
      const originalBean = await beanRepository.save({
        name: 'Original Bean',
        roaster: 'Original Roaster',
        country: 'Colombia',
        region: 'Huila',
      });

      const updateData = {
        name: 'Updated Bean',
        country: 'Ethiopia', // Update country
        altitude_m: 2000, // Update altitude
      };

      // Act: Call service method
      const result = await beanService.updateBean(originalBean.id, updateData);

      // Assert: Verify bean was updated
      expect(result).toBeDefined();
      expect(result.id).toBe(originalBean.id);
      expect(result.name).toBe('Updated Bean');
      expect(result.roaster).toBe('Original Roaster'); // Should remain unchanged
      expect(result.country).toBe('Ethiopia'); // Should be updated
      expect(result.region).toBe('Huila'); // Should remain unchanged
      expect(result.altitude_m).toBe(2000); // Should be updated
    });

    it('should handle partial updates correctly', async () => {
      const originalBean = await beanRepository.save({
        name: 'Original Bean',
        roaster: 'Original Roaster',
        country: 'Colombia',
        altitude_m: 1500,
      });

      const partialUpdate = {
        name: 'Partially Updated Bean', // Only update name
      };

      // Act: Call service method
      const result = await beanService.updateBean(originalBean.id, partialUpdate);

      // Assert: Verify only name was updated
      expect(result).toBeDefined();
      expect(result.id).toBe(originalBean.id);
      expect(result.name).toBe('Partially Updated Bean');
      expect(result.roaster).toBe('Original Roaster'); // Should remain unchanged
      expect(result.country).toBe('Colombia'); // Should remain unchanged
      expect(result.altitude_m).toBe(1500); // Should remain unchanged
    });

    it('should throw error when updating non-existent bean', async () => {
      // Arrange: Use non-existent ID
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const updateData = { name: 'Updated Bean' };

      // Act & Assert: Should throw error
      await expect(beanService.updateBean(nonExistentId, updateData)).rejects.toThrow(
        `Bean with ID ${nonExistentId} not found`
      );
    });
  });

  describe('deleteBean', () => {
    it('should delete existing bean', async () => {
      const beanToDelete = await beanRepository.save({
        name: 'Bean to Delete',
        roaster: 'Test Roaster',
      });

      // Act: Call service method
      const result = await beanService.deleteBean(beanToDelete.id);

      // Assert: Verify bean was deleted
      expect(result).toBe(true);

      // Verify bean no longer exists
      const deletedBean = await beanRepository.findOne({
        where: { id: beanToDelete.id },
      });
      expect(deletedBean).toBeNull();
    });

    it('should throw error when deleting non-existent bean', async () => {
      // Arrange: Use non-existent ID
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';

      // Act & Assert: Should throw error
      await expect(beanService.deleteBean(nonExistentId)).rejects.toThrow(
        `Bean with ID ${nonExistentId} not found`
      );
    });
  });
});
