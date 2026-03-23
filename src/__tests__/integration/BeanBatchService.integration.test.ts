import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { BeanBatchService } from '../../services/BeanBatchService';
import { BeanBatch } from '../../entities/BeanBatch';
import { Bean } from '../../entities/Bean';
import { Repository } from 'typeorm';

// This is crucial: tell Vitest to replace the real '../../data-source' module
// with our mock, so we can control what getDataSource() returns in tests.
vi.mock('../../data-source');

describe('BeanBatchService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let beanBatchService: BeanBatchService;
  let beanRepository: Repository<Bean>;
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

    // Get repositories for test data setup
    beanRepository = testDb.dataSource.getRepository(Bean);
    beanBatchRepository = testDb.dataSource.getRepository(BeanBatch);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  describe('createBeanBatch', () => {
    it('should create a bean batch with all fields', async () => {
      // Arrange: Create test data using repositories
      const bean = beanRepository.create({
        name: 'Test Ethiopian Bean',
        roaster: 'Test Roaster Co',
        country: 'Ethiopia',
        region: 'Yirgacheffe',
        farm: 'Test Farm',
        varietal: 'Heirloom',
        processing_method: 'Washed',
        altitude_m: 1800,
        density_category: 'Medium',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatchData = {
        beanId: savedBean.id,
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      };

      // Act: Call service method
      const result = await beanBatchService.createBeanBatch(beanBatchData);

      // Assert: Verify bean batch was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.bean.id).toBe(savedBean.id);
      expect(result.roastDate).toBeInstanceOf(Date);
      expect(result.bagOpenDate).toBeInstanceOf(Date);
      expect(result.roastLevel).toBe('Medium');
      expect(result.roastDegree).toBe(85); // Service converts to integer
    });

    it('should handle null values correctly', async () => {
      // Arrange: Create test data with null values
      const bean = beanRepository.create({
        name: 'Test Colombian Bean',
        roaster: 'Test Roaster Co',
        country: 'Colombia',
        region: 'Huila',
        farm: 'Test Farm',
        varietal: 'Caturra',
        processing_method: 'Natural',
        altitude_m: 1600,
        density_category: 'Medium',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatchData = {
        beanId: savedBean.id,
        roastDate: '2024-02-10',
        bagOpenDate: null,
        roastLevel: null,
        roastDegree: null,
      };

      // Act: Call service method
      const result = await beanBatchService.createBeanBatch(beanBatchData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.bean.id).toBe(savedBean.id);
      expect(result.roastDate).toBeInstanceOf(Date);
      expect(result.bagOpenDate).toBeNull();
      expect(result.roastLevel).toBeNull();
      expect(result.roastDegree).toBeNull();
    });

    it('should handle Date objects correctly', async () => {
      // Arrange: Create test data with Date objects
      const bean = beanRepository.create({
        name: 'Test Kenyan Bean',
        roaster: 'Test Roaster Co',
        country: 'Kenya',
        region: 'Nyeri',
        farm: 'Test Farm',
        varietal: 'SL28',
        processing_method: 'Washed',
        altitude_m: 1700,
        density_category: 'High',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatchData = {
        beanId: savedBean.id,
        roastDate: new Date('2024-03-05'),
        bagOpenDate: new Date('2024-03-10'),
        roastLevel: 'Light',
        roastDegree: 78,
      };

      // Act: Call service method
      const result = await beanBatchService.createBeanBatch(beanBatchData);

      // Assert: Verify Date objects are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.bean.id).toBe(savedBean.id);
      expect(result.roastDate).toBeInstanceOf(Date);
      expect(result.bagOpenDate).toBeInstanceOf(Date);
      expect(result.roastLevel).toBe('Light');
      expect(result.roastDegree).toBe(78.0);
    });

    it('should throw error when bean does not exist', async () => {
      // Arrange: Create bean batch data for non-existent bean
      const beanBatchData = {
        beanId: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      };

      // Act & Assert: Should throw error for non-existent bean
      await expect(beanBatchService.createBeanBatch(beanBatchData)).rejects.toThrow(
        'Bean with ID 550e8400-e29b-41d4-a716-446655440001 not found'
      );
    });

    it('should throw error when required fields are missing', async () => {
      // Arrange: Create bean batch data with missing required fields
      const beanBatchData = {
        beanId: '', // Empty bean ID
        roastDate: '', // Empty roast date
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      };

      // Act & Assert: Should throw error for missing required fields
      await expect(beanBatchService.createBeanBatch(beanBatchData)).rejects.toThrow(
        'Bean ID is required'
      );
    });

    it('should throw error when roast date is invalid', async () => {
      // Arrange: Create test data
      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Test Country',
        region: 'Test Region',
        farm: 'Test Farm',
        varietal: 'Test Varietal',
        processing_method: 'Test Method',
        altitude_m: 1500,
        density_category: 'Medium',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatchData = {
        beanId: savedBean.id,
        roastDate: 'invalid-date', // Invalid date format
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      };

      // Act & Assert: Should throw error for invalid date
      await expect(beanBatchService.createBeanBatch(beanBatchData)).rejects.toThrow(
        'Invalid roast date format'
      );
    });
  });

  describe('getBeanBatchById', () => {
    it('should return bean batch when found', async () => {
      // Arrange: Create test data
      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Test Country',
        region: 'Test Region',
        farm: 'Test Farm',
        varietal: 'Test Varietal',
        processing_method: 'Test Method',
        altitude_m: 1500,
        density_category: 'Medium',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatch = await beanBatchService.createBeanBatch({
        beanId: savedBean.id,
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      });

      // Act: Get bean batch by ID
      const result = await beanBatchService.getBeanBatchById(beanBatch.id);

      // Assert: Verify bean batch is returned
      expect(result).toBeDefined();
      expect(result.id).toBe(beanBatch.id);
      expect(result.bean.id).toBe(savedBean.id);
      expect(result.roastLevel).toBe('Medium');
      expect(result.roastDegree).toBe(85); // Service converts to integer
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
      const bean1 = beanRepository.create({
        name: 'Test Bean 1',
        roaster: 'Test Roaster 1',
        country: 'Country 1',
        region: 'Region 1',
        farm: 'Farm 1',
        varietal: 'Varietal 1',
        processing_method: 'Method 1',
        altitude_m: 1500,
        density_category: 'Medium',
      });
      const savedBean1 = await beanRepository.save(bean1);

      const bean2 = beanRepository.create({
        name: 'Test Bean 2',
        roaster: 'Test Roaster 2',
        country: 'Country 2',
        region: 'Region 2',
        farm: 'Farm 2',
        varietal: 'Varietal 2',
        processing_method: 'Method 2',
        altitude_m: 1600,
        density_category: 'High',
      });
      const savedBean2 = await beanRepository.save(bean2);

      const beanBatch1 = await beanBatchService.createBeanBatch({
        beanId: savedBean1.id,
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      });

      const beanBatch2 = await beanBatchService.createBeanBatch({
        beanId: savedBean2.id,
        roastDate: '2024-02-10',
        bagOpenDate: '2024-02-15',
        roastLevel: 'Light',
        roastDegree: 78,
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

  describe('getBeanBatchesByBeanId', () => {
    it('should return all bean batches for a specific bean', async () => {
      // Arrange: Create test data with multiple bean batches for same bean
      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Test Country',
        region: 'Test Region',
        farm: 'Test Farm',
        varietal: 'Test Varietal',
        processing_method: 'Test Method',
        altitude_m: 1500,
        density_category: 'Medium',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatch1 = await beanBatchService.createBeanBatch({
        beanId: savedBean.id,
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      });

      const beanBatch2 = await beanBatchService.createBeanBatch({
        beanId: savedBean.id,
        roastDate: '2024-02-10',
        bagOpenDate: '2024-02-15',
        roastLevel: 'Light',
        roastDegree: 78,
      });

      // Act: Get bean batches for specific bean
      const result = await beanBatchService.getBeanBatchesByBeanId(savedBean.id);

      // Assert: Verify all bean batches for the bean are returned
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(beanBatch1.id);
      expect(result[1].id).toBe(beanBatch2.id);
      expect(result[0].bean.id).toBe(savedBean.id);
      expect(result[1].bean.id).toBe(savedBean.id);
    });

    it('should return empty array when no bean batches exist for bean', async () => {
      // Arrange: Create bean without bean batches
      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Test Country',
        region: 'Test Region',
        farm: 'Test Farm',
        varietal: 'Test Varietal',
        processing_method: 'Test Method',
        altitude_m: 1500,
        density_category: 'Medium',
      });
      const savedBean = await beanRepository.save(bean);

      // Act: Get bean batches for bean
      const result = await beanBatchService.getBeanBatchesByBeanId(savedBean.id);

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateBeanBatch', () => {
    it('should update existing bean batch', async () => {
      // Arrange: Create test data
      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Test Country',
        region: 'Test Region',
        farm: 'Test Farm',
        varietal: 'Test Varietal',
        processing_method: 'Test Method',
        altitude_m: 1500,
        density_category: 'Medium',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatch = await beanBatchService.createBeanBatch({
        beanId: savedBean.id,
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      });

      const updateData = {
        roastDate: '2024-01-16',
        bagOpenDate: '2024-01-21',
        roastLevel: 'Dark',
      };

      // Act: Update bean batch
      const result = await beanBatchService.updateBeanBatch(beanBatch.id, updateData);

      // Assert: Verify bean batch was updated
      expect(result).toBeDefined();
      expect(result.id).toBe(beanBatch.id);
      expect(result.roastDate).toBeInstanceOf(Date);
      expect(result.bagOpenDate).toBeInstanceOf(Date);
      expect(result.roastLevel).toBe('Dark');
      expect(result.roastDegree).toBe(85); // Should remain unchanged
    });

    it('should handle partial updates correctly', async () => {
      // Arrange: Create test data
      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Test Country',
        region: 'Test Region',
        farm: 'Test Farm',
        varietal: 'Test Varietal',
        processing_method: 'Test Method',
        altitude_m: 1500,
        density_category: 'Medium',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatch = await beanBatchService.createBeanBatch({
        beanId: savedBean.id,
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      });

      const updateData = {
        roastLevel: 'Light',
      };

      // Act: Update bean batch partially
      const result = await beanBatchService.updateBeanBatch(beanBatch.id, updateData);

      // Assert: Verify only specified fields were updated
      expect(result).toBeDefined();
      expect(result.id).toBe(beanBatch.id);
      expect(result.roastLevel).toBe('Light');
      expect(result.roastDegree).toBe(85); // Should remain unchanged
      expect(result.bagOpenDate).toBe('2024-01-20'); // Service returns date string
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
      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Test Country',
        region: 'Test Region',
        farm: 'Test Farm',
        varietal: 'Test Varietal',
        processing_method: 'Test Method',
        altitude_m: 1500,
        density_category: 'Medium',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatch = await beanBatchService.createBeanBatch({
        beanId: savedBean.id,
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      });

      const updateData = {
        bagOpenDate: null,
        roastLevel: null,
        roastDegree: null,
      };

      // Act: Update bean batch with null values
      const result = await beanBatchService.updateBeanBatch(beanBatch.id, updateData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBe(beanBatch.id);
      expect(result.bagOpenDate).toBeNull();
      expect(result.roastLevel).toBeNull();
      expect(result.roastDegree).toBeNull();
      expect(result.roastDate).toBe('2024-01-15'); // Service returns date string
    });
  });

  describe('deleteBeanBatch', () => {
    it('should delete existing bean batch', async () => {
      // Arrange: Create test data
      const bean = beanRepository.create({
        name: 'Test Bean',
        roaster: 'Test Roaster',
        country: 'Test Country',
        region: 'Test Region',
        farm: 'Test Farm',
        varietal: 'Test Varietal',
        processing_method: 'Test Method',
        altitude_m: 1500,
        density_category: 'Medium',
      });
      const savedBean = await beanRepository.save(bean);

      const beanBatch = await beanBatchService.createBeanBatch({
        beanId: savedBean.id,
        roastDate: '2024-01-15',
        bagOpenDate: '2024-01-20',
        roastLevel: 'Medium',
        roastDegree: 85,
      });

      // Act: Delete bean batch
      const result = await beanBatchService.deleteBeanBatch(beanBatch.id);

      // Assert: Verify deletion was successful
      expect(result).toBe(true);
    });

    it('should throw error when deleting non-existent bean batch', async () => {
      // Act & Assert: Should throw error for non-existent bean batch
      await expect(
        beanBatchService.deleteBeanBatch('550e8400-e29b-41d4-a716-446655440004')
      ).rejects.toThrow('Bean batch with ID 550e8400-e29b-41d4-a716-446655440004 not found');
    });
  });
});
