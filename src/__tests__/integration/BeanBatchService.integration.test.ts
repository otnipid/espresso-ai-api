import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { BeanBatchService } from '../../services/BeanBatchService';
import { BeanBatch } from '../../entities/BeanBatch';
import { Repository } from 'typeorm';

// Mock the data-source module to use our test database
vi.mock('../../data-source');

describe('BeanBatchService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let beanBatchService: BeanBatchService;
  let beanBatchRepository: Repository<BeanBatch>;

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
    beanBatchService = new BeanBatchService(testDb.dataSource);

    // Get repository for test data setup
    beanBatchRepository = testDb.dataSource.getRepository(BeanBatch);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  describe('createBeanBatch', () => {
    it('should create a bean batch with all fields', async () => {
      // Arrange: Create test data
      const beanBatchData = {
        name: 'Ethiopian Yirgacheffe',
        roaster: 'Blue Bottle Coffee',
        country: 'Ethiopia',
        region: 'Yirgacheffe',
        farm: 'Test Farm',
        varietal: 'Heirloom',
        processingMethod: 'Washed',
        altitudeM: 1800,
        densityCategory: 'Medium',
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
      };

      // Act: Call service method
      const result = await beanBatchService.createBeanBatch(beanBatchData);

      // Assert: Verify bean batch was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Ethiopian Yirgacheffe');
      expect(result.roaster).toBe('Blue Bottle Coffee');
      expect(result.country).toBe('Ethiopia');
      expect(result.roastDate).toBeInstanceOf(Date);
      expect(result.bagOpenDate).toBeInstanceOf(Date);
      expect(result.roastLevel).toBe('Medium');
    });

    it('should create a bean batch with minimal required fields', async () => {
      // Arrange: Create test data with only required fields
      const beanBatchData = {
        name: 'Colombian Supremo',
        roastDate: '2024-02-10',
      };

      // Act: Call service method
      const result = await beanBatchService.createBeanBatch(beanBatchData);

      // Assert: Verify bean batch was created with minimal data
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Colombian Supremo');
      expect(result.roaster).toBeNull();
      expect(result.country).toBeNull();
      expect(result.roastDate).toBeInstanceOf(Date);
      expect(result.bagOpenDate).toBeNull();
      expect(result.roastLevel).toBeNull();
    });

    it('should handle null values correctly', async () => {
      // Arrange: Create test data with null values
      const beanBatchData = {
        name: 'Kenyan AA',
        roaster: null,
        country: null,
        roastDate: '2024-03-05',
        bagOpenDate: null,
        roastLevel: null,
      };

      // Act: Call service method
      const result = await beanBatchService.createBeanBatch(beanBatchData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Kenyan AA');
      expect(result.roaster).toBeNull();
      expect(result.country).toBeNull();
      expect(result.roastDate).toBeInstanceOf(Date);
      expect(result.bagOpenDate).toBeNull();
      expect(result.roastLevel).toBeNull();
    });

    it('should handle Date objects correctly', async () => {
      // Arrange: Create test data with Date objects
      const beanBatchData = {
        name: 'Guatemala Antigua',
        roaster: 'Stumptown Coffee',
        country: 'Guatemala',
        roastDate: new Date('2024-04-10'),
        bagOpenDate: new Date('2024-04-15'),
        roastLevel: 'Light',
      };

      // Act: Call service method
      const result = await beanBatchService.createBeanBatch(beanBatchData);

      // Assert: Verify Date objects are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Guatemala Antigua');
      expect(result.roastDate).toBeInstanceOf(Date);
      expect(result.bagOpenDate).toBeInstanceOf(Date);
      expect(result.roastLevel).toBe('Light');
    });

    it('should throw error when name is missing', async () => {
      // Arrange: Create bean batch data with missing name
      const beanBatchData = {
        name: '', // Empty name
        roastDate: '2024-01-15',
      };

      // Act & Assert: Should throw error for missing name
      await expect(beanBatchService.createBeanBatch(beanBatchData)).rejects.toThrow(
        'Bean name is required'
      );
    });

    it('should throw error when roast date is missing', async () => {
      // Arrange: Create bean batch data with missing roast date
      const beanBatchData = {
        name: 'Test Bean',
        roastDate: '', // Empty roast date
      };

      // Act & Assert: Should throw error for missing roast date
      await expect(beanBatchService.createBeanBatch(beanBatchData)).rejects.toThrow(
        'Roast date is required'
      );
    });

    it('should throw error when roast date is invalid', async () => {
      // Arrange: Create test data with invalid date
      const beanBatchData = {
        name: 'Test Bean',
        roastDate: 'invalid-date', // Invalid date format
      };

      // Act & Assert: Should throw error for invalid date
      await expect(beanBatchService.createBeanBatch(beanBatchData)).rejects.toThrow(
        'Invalid roast date format'
      );
    });

    it('should throw error when bag open date is invalid', async () => {
      // Arrange: Create test data with invalid bag open date
      const beanBatchData = {
        name: 'Test Bean',
        roastDate: '2024-01-15',
        bagOpenDate: 'invalid-date', // Invalid date format
      };

      // Act & Assert: Should throw error for invalid date
      await expect(beanBatchService.createBeanBatch(beanBatchData)).rejects.toThrow(
        'Invalid bag open date format'
      );
    });
  });

  describe('getBeanBatchById', () => {
    it('should return bean batch when found', async () => {
      // Arrange: Create test data
      const beanBatchData = {
        name: 'Test Bean Batch',
        roaster: 'Test Roaster',
        country: 'Test Country',
        roastDate: '2024-01-15',
        roastLevel: 'Medium',
      };

      const createdBatch = await beanBatchService.createBeanBatch(beanBatchData);

      // Act: Get bean batch by ID
      const result = await beanBatchService.getBeanBatchById(createdBatch.id);

      // Assert: Verify bean batch is returned
      expect(result).toBeDefined();
      expect(result.id).toBe(createdBatch.id);
      expect(result.name).toBe('Test Bean Batch');
      expect(result.roaster).toBe('Test Roaster');
      expect(result.country).toBe('Test Country');
      expect(result.roastLevel).toBe('Medium');
    });

    it('should throw error when bean batch not found', async () => {
      // Act & Assert: Should throw error for non-existent bean batch
      await expect(
        beanBatchService.getBeanBatchById('550e8400-e29b-41d4-a716-446655440002')
      ).rejects.toThrow('Bean batch with ID 550e8400-e29b-41d4-a716-446655440002 not found');
    });
  });

  describe('getAllBeanBatches', () => {
    it('should return all bean batches', async () => {
      // Arrange: Create test data with multiple bean batches
      const beanBatch1 = await beanBatchService.createBeanBatch({
        name: 'Test Bean 1',
        roaster: 'Test Roaster 1',
        country: 'Country 1',
        roastDate: '2024-01-15',
        roastLevel: 'Medium',
      });

      const beanBatch2 = await beanBatchService.createBeanBatch({
        name: 'Test Bean 2',
        roaster: 'Test Roaster 2',
        country: 'Country 2',
        roastDate: '2024-02-10',
        roastLevel: 'Light',
      });

      // Act: Get all bean batches
      const result = await beanBatchService.getAllBeanBatches();

      // Assert: Verify all bean batches are returned
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(beanBatch1.id);
      expect(result[1].id).toBe(beanBatch2.id);
      expect(result[0].roastLevel).toBe('Medium');
      expect(result[1].roastLevel).toBe('Light');
    });

    it('should return empty array when no bean batches exist', async () => {
      // Act: Get all bean batches
      const result = await beanBatchService.getAllBeanBatches();

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateBeanBatch', () => {
    it('should update existing bean batch', async () => {
      // Arrange: Create test data
      const beanBatchData = {
        name: 'Original Bean',
        roaster: 'Original Roaster',
        country: 'Original Country',
        roastDate: '2024-01-15',
        roastLevel: 'Medium',
      };

      const createdBatch = await beanBatchService.createBeanBatch(beanBatchData);

      const updateData = {
        name: 'Updated Bean',
        roaster: 'Updated Roaster',
        country: 'Updated Country',
        roastLevel: 'Dark',
      };

      // Act: Update bean batch
      const result = await beanBatchService.updateBeanBatch(createdBatch.id, updateData);

      // Assert: Verify bean batch was updated
      expect(result).toBeDefined();
      expect(result.id).toBe(createdBatch.id);
      expect(result.name).toBe('Updated Bean');
      expect(result.roaster).toBe('Updated Roaster');
      expect(result.country).toBe('Updated Country');
      expect(result.roastLevel).toBe('Dark');
      expect(result.roastDate).toBe('2024-01-15'); // Service returns date string
    });

    it('should handle partial updates correctly', async () => {
      // Arrange: Create test data
      const beanBatchData = {
        name: 'Original Bean',
        roaster: 'Original Roaster',
        country: 'Original Country',
        roastDate: '2024-01-15',
        roastLevel: 'Medium',
      };

      const createdBatch = await beanBatchService.createBeanBatch(beanBatchData);

      const updateData = {
        roastLevel: 'Light',
      };

      // Act: Update bean batch partially
      const result = await beanBatchService.updateBeanBatch(createdBatch.id, updateData);

      // Assert: Verify only specified fields were updated
      expect(result).toBeDefined();
      expect(result.id).toBe(createdBatch.id);
      expect(result.name).toBe('Original Bean'); // Should remain unchanged
      expect(result.roaster).toBe('Original Roaster'); // Should remain unchanged
      expect(result.country).toBe('Original Country'); // Should remain unchanged
      expect(result.roastLevel).toBe('Light'); // Should be updated
    });

    it('should throw error when updating non-existent bean batch', async () => {
      // Act & Assert: Should throw error for non-existent bean batch
      const updateData = {
        roastLevel: 'Dark',
      };
      await expect(
        beanBatchService.updateBeanBatch('550e8400-e29b-41d4-a716-446655440003', updateData)
      ).rejects.toThrow('Bean batch with ID 550e8400-e29b-41d4-a716-446655440003 not found');
    });

    it('should handle null values in updates', async () => {
      // Arrange: Create test data
      const beanBatchData = {
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Test Country',
        roastDate: '2024-01-15',
        roastLevel: 'Medium',
      };

      const createdBatch = await beanBatchService.createBeanBatch(beanBatchData);

      const updateData = {
        roaster: null,
        country: null,
        roastLevel: null,
      };

      // Act: Update bean batch with null values
      const result = await beanBatchService.updateBeanBatch(createdBatch.id, updateData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBe(createdBatch.id);
      expect(result.name).toBe('Test Bean'); // Should remain unchanged
      expect(result.roaster).toBeNull();
      expect(result.country).toBeNull();
      expect(result.roastLevel).toBeNull();
      expect(result.roastDate).toBe('2024-01-15'); // Service returns date string
    });

    it('should handle date updates correctly', async () => {
      // Arrange: Create test data
      const beanBatchData = {
        name: 'Test Bean',
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
      };

      const createdBatch = await beanBatchService.createBeanBatch(beanBatchData);

      const updateData = {
        roastDate: '2024-02-15',
        bagOpenDate: '2024-02-20',
      };

      // Act: Update bean batch dates
      const result = await beanBatchService.updateBeanBatch(createdBatch.id, updateData);

      // Assert: Verify dates were updated
      expect(result).toBeDefined();
      expect(result.id).toBe(createdBatch.id);
      expect(result.roastDate).toBeInstanceOf(Date);
      expect(result.bagOpenDate).toBeInstanceOf(Date);
      expect(result.roastDate.getFullYear()).toBe(2024);
      expect(result.roastDate.getMonth()).toBe(1); // February
      expect(result.roastDate.getDate()).toBe(15);
      expect(result.bagOpenDate!.getFullYear()).toBe(2024);
      expect(result.bagOpenDate!.getMonth()).toBe(1); // February
      expect(result.bagOpenDate!.getDate()).toBe(20);
    });
  });

  describe('deleteBeanBatch', () => {
    it('should delete existing bean batch', async () => {
      // Arrange: Create test data
      const beanBatchData = {
        name: 'Bean to Delete',
        roaster: 'Test Roaster',
        country: 'Test Country',
        roastDate: '2024-01-15',
      };

      const createdBatch = await beanBatchService.createBeanBatch(beanBatchData);

      // Verify bean batch exists before deletion
      const beforeDelete = await beanBatchService.getBeanBatchById(createdBatch.id);
      expect(beforeDelete).toBeDefined();

      // Act: Delete bean batch
      const result = await beanBatchService.deleteBeanBatch(createdBatch.id);

      // Assert: Verify deletion was successful
      expect(result).toBe(true);

      // Verify bean batch no longer exists
      await expect(
        beanBatchService.getBeanBatchById(createdBatch.id)
      ).rejects.toThrow('Bean batch with ID');
    });

    it('should throw error when deleting non-existent bean batch', async () => {
      // Act & Assert: Should throw error for non-existent bean batch
      await expect(
        beanBatchService.deleteBeanBatch('550e8400-e29b-41d4-a716-446655440004')
      ).rejects.toThrow('Bean batch with ID 550e8400-e29b-41d4-a716-446655440004 not found');
    });
  });
});
