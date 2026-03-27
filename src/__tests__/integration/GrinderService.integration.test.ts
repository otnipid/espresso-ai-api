import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { GrinderService } from '../../services/GrinderService';
import { Grinder } from '../../entities/Grinder';
import { Repository } from 'typeorm';

// This is crucial: tell Vitest to replace the real '../../data-source' module
// with our mock, so we can control what getDataSource() returns in tests.
vi.mock('../../data-source');

describe('GrinderService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let grinderService: GrinderService;
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
    grinderService = new GrinderService(testDb.dataSource);

    // Get repository for test data setup
    grinderRepository = testDb.dataSource.getRepository(Grinder);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  describe('createGrinder', () => {
    it('should create a grinder with all fields', async () => {
      // Arrange: Create test data
      const grinderData = {
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: '2024-01-15',
        serialNumber: 'SN123456789',
      };

      // Act: Call service method
      const result = await grinderService.createGrinder(grinderData);

      // Assert: Verify grinder was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.model).toBe('Baratza Sette 270Wi');
      expect(result.manufacturer).toBe('Baratza');
      expect(result.burrType).toBe('Conical');
      expect(result.burrInstallDate).toBeInstanceOf(Date);
      expect(result.serialNumber).toBe('SN123456789');
    });

    it('should handle null values correctly', async () => {
      // Arrange: Create test data with null values
      const grinderData = {
        model: 'Fellow Ode Gen 2',
        manufacturer: null,
        burrType: null,
        burrInstallDate: null,
        serialNumber: null,
      };

      // Act: Call service method
      const result = await grinderService.createGrinder(grinderData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.model).toBe('Fellow Ode Gen 2');
      expect(result.manufacturer).toBeNull();
      expect(result.burrType).toBeNull();
      expect(result.burrInstallDate).toBeNull();
      expect(result.serialNumber).toBeNull();
    });

    it('should handle Date objects correctly', async () => {
      // Arrange: Create test data with Date objects
      const grinderData = {
        model: 'Comandante C40',
        manufacturer: 'Comandante',
        burrType: 'Flat',
        burrInstallDate: new Date('2024-03-05'),
        serialNumber: 'CMD40-2024',
      };

      // Act: Call service method
      const result = await grinderService.createGrinder(grinderData);

      // Assert: Verify Date objects are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.model).toBe('Comandante C40');
      expect(result.manufacturer).toBe('Comandante');
      expect(result.burrType).toBe('Flat');
      expect(result.burrInstallDate).toBeInstanceOf(Date);
      expect(result.serialNumber).toBe('CMD40-2024');
    });

    it('should handle invalid dates by setting them to null', async () => {
      // Arrange: Create test data with invalid date
      const grinderData = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: 'invalid-date', // Invalid date format
        serialNumber: 'TEST123',
      };

      // Act: Call service method
      const result = await grinderService.createGrinder(grinderData);

      // Assert: Verify invalid date is set to null
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.model).toBe('Test Grinder');
      expect(result.burrInstallDate).toBeNull();
    });

    it('should trim whitespace from string fields', async () => {
      // Arrange: Create test data with extra whitespace
      const grinderData = {
        model: '  Niche Zero  ',
        manufacturer: '  Niche Coffee  ',
        burrType: '  Conical  ',
        burrInstallDate: '2024-02-10',
        serialNumber: '  NZ001  ',
      };

      // Act: Call service method
      const result = await grinderService.createGrinder(grinderData);

      // Assert: Verify whitespace is trimmed
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.model).toBe('Niche Zero');
      expect(result.manufacturer).toBe('Niche Coffee');
      expect(result.burrType).toBe('Conical');
      expect(result.serialNumber).toBe('NZ001');
    });

    it('should throw error when model is missing', async () => {
      // Arrange: Create grinder data with missing model
      const grinderData = {
        model: '', // Empty model
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      // Act & Assert: Should throw error for missing model
      await expect(grinderService.createGrinder(grinderData)).rejects.toThrow(
        'Grinder model is required'
      );
    });

    it('should throw error when model is only whitespace', async () => {
      // Arrange: Create grinder data with whitespace-only model
      const grinderData = {
        model: '   ', // Whitespace only
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      // Act & Assert: Should throw error for empty model after trimming
      await expect(grinderService.createGrinder(grinderData)).rejects.toThrow(
        'Grinder model is required'
      );
    });
  });

  describe('getGrinderById', () => {
    it('should return grinder when found', async () => {
      // Arrange: Create test data
      const grinderData = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      const grinder = await grinderService.createGrinder(grinderData);

      // Act: Get grinder by ID
      const result = await grinderService.getGrinderById(grinder.id);

      // Assert: Verify grinder is returned
      expect(result).toBeDefined();
      expect(result.id).toBe(grinder.id);
      expect(result.model).toBe('Test Grinder');
      expect(result.manufacturer).toBe('Test Manufacturer');
      expect(result.burrType).toBe('Test Burr');
      expect(result.serialNumber).toBe('TEST123');
    });

    it('should throw error when grinder not found', async () => {
      // Act & Assert: Should throw error for non-existent grinder
      await expect(
        grinderService.getGrinderById('550e8400-e29b-41d4-a716-446655440002')
      ).rejects.toThrow('Grinder with ID 550e8400-e29b-41d4-a716-446655440002 not found');
    });
  });

  describe('getAllGrinders', () => {
    it('should return all grinders', async () => {
      // Arrange: Create test data with multiple grinders
      const grinder1Data = {
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: '2024-01-15',
        serialNumber: 'SN123456789',
      };

      const grinder2Data = {
        model: 'Fellow Ode Gen 2',
        manufacturer: 'Fellow',
        burrType: 'Flat',
        burrInstallDate: '2024-02-10',
        serialNumber: 'ODE001',
      };

      const grinder1 = await grinderService.createGrinder(grinder1Data);
      const grinder2 = await grinderService.createGrinder(grinder2Data);

      // Act: Get all grinders
      const result = await grinderService.getAllGrinders();

      // Assert: Verify all grinders are returned
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(grinder1.id);
      expect(result[1].id).toBe(grinder2.id);
      expect(result[0].model).toBe('Baratza Sette 270Wi');
      expect(result[1].model).toBe('Fellow Ode Gen 2');
    });

    it('should return empty array when no grinders exist', async () => {
      // Act: Get all grinders
      const result = await grinderService.getAllGrinders();

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('getGrindersByManufacturer', () => {
    it('should return all grinders for a specific manufacturer', async () => {
      // Arrange: Create test data with multiple grinders for same manufacturer
      const grinder1Data = {
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: '2024-01-15',
        serialNumber: 'SN123456789',
      };

      const grinder2Data = {
        model: 'Baratza Encore',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: '2024-02-10',
        serialNumber: 'SN987654321',
      };

      const grinder3Data = {
        model: 'Fellow Ode Gen 2',
        manufacturer: 'Fellow',
        burrType: 'Flat',
        burrInstallDate: '2024-03-05',
        serialNumber: 'ODE001',
      };

      const grinder1 = await grinderService.createGrinder(grinder1Data);
      const grinder2 = await grinderService.createGrinder(grinder2Data);
      await grinderService.createGrinder(grinder3Data);

      // Act: Get grinders for specific manufacturer
      const result = await grinderService.getGrindersByManufacturer('Baratza');

      // Assert: Verify all grinders for the manufacturer are returned
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(grinder1.id);
      expect(result[1].id).toBe(grinder2.id);
      expect(result[0].manufacturer).toBe('Baratza');
      expect(result[1].manufacturer).toBe('Baratza');
    });

    it('should return empty array when no grinders exist for manufacturer', async () => {
      // Arrange: Create grinders with different manufacturers
      const grinderData = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      await grinderService.createGrinder(grinderData);

      // Act: Get grinders for different manufacturer
      const result = await grinderService.getGrindersByManufacturer('NonExistentManufacturer');

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no grinders exist', async () => {
      // Act: Get grinders for manufacturer
      const result = await grinderService.getGrindersByManufacturer('AnyManufacturer');

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateGrinder', () => {
    it('should update existing grinder', async () => {
      // Arrange: Create test data
      const grinderData = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      const grinder = await grinderService.createGrinder(grinderData);

      const updateData = {
        model: 'Updated Grinder',
        manufacturer: 'Updated Manufacturer',
        burrType: 'Updated Burr',
      };

      // Act: Update grinder
      const result = await grinderService.updateGrinder(grinder.id, updateData);

      // Assert: Verify grinder was updated
      expect(result).toBeDefined();
      expect(result.id).toBe(grinder.id);
      expect(result.model).toBe('Updated Grinder');
      expect(result.manufacturer).toBe('Updated Manufacturer');
      expect(result.burrType).toBe('Updated Burr');
      expect(result.burrInstallDate).toBe('2024-01-15'); // Service returns date string
      expect(result.serialNumber).toBe('TEST123'); // Should remain unchanged
    });

    it('should handle partial updates correctly', async () => {
      // Arrange: Create test data
      const grinderData = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      const grinder = await grinderService.createGrinder(grinderData);

      const updateData = {
        model: 'Partially Updated Grinder',
      };

      // Act: Update grinder partially
      const result = await grinderService.updateGrinder(grinder.id, updateData);

      // Assert: Verify only specified fields were updated
      expect(result).toBeDefined();
      expect(result.id).toBe(grinder.id);
      expect(result.model).toBe('Partially Updated Grinder');
      expect(result.manufacturer).toBe('Test Manufacturer'); // Should remain unchanged
      expect(result.burrType).toBe('Test Burr'); // Should remain unchanged
      expect(result.burrInstallDate).toBe('2024-01-15'); // Service returns date string
      expect(result.serialNumber).toBe('TEST123'); // Should remain unchanged
    });

    it('should handle null values in updates', async () => {
      // Arrange: Create test data
      const grinderData = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      const grinder = await grinderService.createGrinder(grinderData);

      const updateData = {
        manufacturer: null,
        burrType: null,
        burrInstallDate: null,
        serialNumber: null,
      };

      // Act: Update grinder with null values
      const result = await grinderService.updateGrinder(grinder.id, updateData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBe(grinder.id);
      expect(result.model).toBe('Test Grinder'); // Should remain unchanged
      expect(result.manufacturer).toBeNull();
      expect(result.burrType).toBeNull();
      expect(result.burrInstallDate).toBeNull();
      expect(result.serialNumber).toBeNull();
    });

    it('should handle invalid dates in updates by setting them to null', async () => {
      // Arrange: Create test data
      const grinderData = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      const grinder = await grinderService.createGrinder(grinderData);

      const updateData = {
        burrInstallDate: 'invalid-date', // Invalid date format
      };

      // Act: Update grinder with invalid date
      const result = await grinderService.updateGrinder(grinder.id, updateData);

      // Assert: Verify invalid date is set to null
      expect(result).toBeDefined();
      expect(result.id).toBe(grinder.id);
      expect(result.burrInstallDate).toBeNull();
    });

    it('should trim whitespace in updates', async () => {
      // Arrange: Create test data
      const grinderData = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      const grinder = await grinderService.createGrinder(grinderData);

      const updateData = {
        model: '  Updated Grinder  ',
        manufacturer: '  Updated Manufacturer  ',
        burrType: '  Updated Burr  ',
        serialNumber: '  UPDATED123  ',
      };

      // Act: Update grinder with whitespace
      const result = await grinderService.updateGrinder(grinder.id, updateData);

      // Assert: Verify whitespace is trimmed
      expect(result).toBeDefined();
      expect(result.id).toBe(grinder.id);
      expect(result.model).toBe('Updated Grinder');
      expect(result.manufacturer).toBe('Updated Manufacturer');
      expect(result.burrType).toBe('Updated Burr');
      expect(result.serialNumber).toBe('UPDATED123');
    });

    it('should throw error when updating non-existent grinder', async () => {
      // Act & Assert: Should throw error for non-existent grinder
      const updateData = {
        model: 'Updated Grinder',
      };
      await expect(
        grinderService.updateGrinder('550e8400-e29b-41d4-a716-446655440003', updateData)
      ).rejects.toThrow('Grinder with ID 550e8400-e29b-41d4-a716-446655440003 not found');
    });

    it('should throw error when model in update is empty', async () => {
      // Arrange: Create test data
      const grinderData = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      const grinder = await grinderService.createGrinder(grinderData);

      const updateData = {
        model: '', // Empty model
      };

      // Act & Assert: Should throw error for empty model
      await expect(grinderService.updateGrinder(grinder.id, updateData)).rejects.toThrow(
        'Grinder model cannot be empty'
      );
    });
  });

  describe('deleteGrinder', () => {
    it('should delete existing grinder', async () => {
      // Arrange: Create test data
      const grinderData = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Burr',
        burrInstallDate: '2024-01-15',
        serialNumber: 'TEST123',
      };

      const grinder = await grinderService.createGrinder(grinderData);

      // Act: Delete grinder
      const result = await grinderService.deleteGrinder(grinder.id);

      // Assert: Verify deletion was successful
      expect(result).toBe(true);
    });

    it('should throw error when deleting non-existent grinder', async () => {
      // Act & Assert: Should throw error for non-existent grinder
      await expect(
        grinderService.deleteGrinder('550e8400-e29b-41d4-a716-446655440004')
      ).rejects.toThrow('Grinder with ID 550e8400-e29b-41d4-a716-446655440004 not found');
    });
  });
});
