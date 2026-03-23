import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { MachineService } from '../../services/MachineService';
import { Machine } from '../../entities/Machine';
import { Repository } from 'typeorm';

// This is crucial: tell Vitest to replace the real '../../data-source' module
// with our mock, so we can control what getDataSource() returns in tests.
vi.mock('../../data-source');

describe('MachineService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let machineService: MachineService;
  let machineRepository: Repository<Machine>;

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
    machineService = new MachineService(testDb.dataSource);

    // Get repository for test data setup
    machineRepository = testDb.dataSource.getRepository(Machine);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  describe('createMachine', () => {
    it('should create a machine with all fields', async () => {
      // Arrange: Create test data
      const machineData = {
        model: 'La Marzocco Linea Micra',
        firmware_version: 'v2.1.0',
      };

      // Act: Call service method
      const result = await machineService.createMachine(machineData);

      // Assert: Verify machine was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.model).toBe('La Marzocco Linea Micra');
      expect(result.firmware_version).toBe('v2.1.0');
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should handle null values correctly', async () => {
      // Arrange: Create test data with null values
      const machineData = {
        model: 'Rancilio Silvia Pro',
        firmware_version: null,
      };

      // Act: Call service method
      const result = await machineService.createMachine(machineData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.model).toBe('Rancilio Silvia Pro');
      expect(result.firmware_version).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should handle undefined firmware version correctly', async () => {
      // Arrange: Create test data without firmware version
      const machineData = {
        model: 'Breville Barista Express',
      };

      // Act: Call service method
      const result = await machineService.createMachine(machineData);

      // Assert: Verify undefined firmware version is handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.model).toBe('Breville Barista Express');
      expect(result.firmware_version).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should trim whitespace from string fields', async () => {
      // Arrange: Create test data with extra whitespace
      const machineData = {
        model: '  Gaggia Classic Pro  ',
        firmware_version: '  v1.5.2  ',
      };

      // Act: Call service method
      const result = await machineService.createMachine(machineData);

      // Assert: Verify whitespace is trimmed
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.model).toBe('Gaggia Classic Pro');
      expect(result.firmware_version).toBe('v1.5.2');
    });

    it('should handle empty firmware version by setting it to null', async () => {
      // Arrange: Create test data with empty firmware version
      const machineData = {
        model: 'Test Machine',
        firmware_version: '', // Empty string
      };

      // Act: Call service method
      const result = await machineService.createMachine(machineData);

      // Assert: Verify empty firmware version is set to null
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.model).toBe('Test Machine');
      expect(result.firmware_version).toBeNull();
    });

    it('should throw error when model is missing', async () => {
      // Arrange: Create machine data with missing model
      const machineData = {
        model: '', // Empty model
        firmware_version: 'v1.0.0',
      };

      // Act & Assert: Should throw error for missing model
      await expect(machineService.createMachine(machineData)).rejects.toThrow(
        'Machine model is required'
      );
    });

    it('should throw error when model is only whitespace', async () => {
      // Arrange: Create machine data with whitespace-only model
      const machineData = {
        model: '   ', // Whitespace only
        firmware_version: 'v1.0.0',
      };

      // Act & Assert: Should throw error for empty model after trimming
      await expect(machineService.createMachine(machineData)).rejects.toThrow(
        'Machine model is required'
      );
    });
  });

  describe('getMachineById', () => {
    it('should return machine when found', async () => {
      // Arrange: Create test data
      const machineData = {
        model: 'Test Machine',
        firmware_version: 'v1.0.0',
      };

      const machine = await machineService.createMachine(machineData);

      // Act: Get machine by ID
      const result = await machineService.getMachineById(machine.id);

      // Assert: Verify machine is returned
      expect(result).toBeDefined();
      expect(result.id).toBe(machine.id);
      expect(result.model).toBe('Test Machine');
      expect(result.firmware_version).toBe('v1.0.0');
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should throw error when machine not found', async () => {
      // Act & Assert: Should throw error for non-existent machine
      await expect(
        machineService.getMachineById('550e8400-e29b-41d4-a716-446655440002')
      ).rejects.toThrow('Machine with ID 550e8400-e29b-41d4-a716-446655440002 not found');
    });
  });

  describe('getAllMachines', () => {
    it('should return all machines', async () => {
      // Arrange: Create test data with multiple machines
      const machine1Data = {
        model: 'La Marzocco Linea Micra',
        firmware_version: 'v2.1.0',
      };

      const machine2Data = {
        model: 'Rancilio Silvia Pro',
        firmware_version: 'v1.8.3',
      };

      const machine1 = await machineService.createMachine(machine1Data);
      const machine2 = await machineService.createMachine(machine2Data);

      // Act: Get all machines
      const result = await machineService.getAllMachines();

      // Assert: Verify all machines are returned
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(machine1.id);
      expect(result[1].id).toBe(machine2.id);
      expect(result[0].model).toBe('La Marzocco Linea Micra');
      expect(result[1].model).toBe('Rancilio Silvia Pro');
    });

    it('should return empty array when no machines exist', async () => {
      // Act: Get all machines
      const result = await machineService.getAllMachines();

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('getMachinesByModel', () => {
    it('should return machines matching model search', async () => {
      // Arrange: Create test data with multiple machines
      const machine1Data = {
        model: 'La Marzocco Linea Micra',
        firmware_version: 'v2.1.0',
      };

      const machine2Data = {
        model: 'La Marzocco Linea Classic',
        firmware_version: 'v1.9.5',
      };

      const machine3Data = {
        model: 'Rancilio Silvia Pro',
        firmware_version: 'v1.8.3',
      };

      const machine1 = await machineService.createMachine(machine1Data);
      const machine2 = await machineService.createMachine(machine2Data);
      await machineService.createMachine(machine3Data);

      // Act: Get machines by model search
      const result = await machineService.getMachinesByModel('La Marzocco');

      // Assert: Verify matching machines are returned
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(machine1.id);
      expect(result[1].id).toBe(machine2.id);
      expect(result[0].model).toBe('La Marzocco Linea Micra');
      expect(result[1].model).toBe('La Marzocco Linea Classic');
    });

    it('should return machines with partial model matches', async () => {
      // Arrange: Create test data
      const machine1Data = {
        model: 'Breville Barista Express',
        firmware_version: 'v1.2.0',
      };

      const machine2Data = {
        model: 'Breville Barista Pro',
        firmware_version: 'v2.0.0',
      };

      const machine1 = await machineService.createMachine(machine1Data);
      const machine2 = await machineService.createMachine(machine2Data);

      // Act: Get machines by partial model search
      const result = await machineService.getMachinesByModel('Barista');

      // Assert: Verify matching machines are returned
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(machine1.id);
      expect(result[1].id).toBe(machine2.id);
      expect(result[0].model).toBe('Breville Barista Express');
      expect(result[1].model).toBe('Breville Barista Pro');
    });

    it('should return empty array when no machines match model', async () => {
      // Arrange: Create machines with different models
      const machineData = {
        model: 'Test Machine',
        firmware_version: 'v1.0.0',
      };

      await machineService.createMachine(machineData);

      // Act: Get machines by non-matching model
      const result = await machineService.getMachinesByModel('NonExistentModel');

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no machines exist', async () => {
      // Act: Get machines by model
      const result = await machineService.getMachinesByModel('AnyModel');

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateMachine', () => {
    it('should update existing machine', async () => {
      // Arrange: Create test data
      const machineData = {
        model: 'Test Machine',
        firmware_version: 'v1.0.0',
      };

      const machine = await machineService.createMachine(machineData);

      const updateData = {
        model: 'Updated Machine',
        firmware_version: 'v2.0.0',
      };

      // Act: Update machine
      const result = await machineService.updateMachine(machine.id, updateData);

      // Assert: Verify machine was updated
      expect(result).toBeDefined();
      expect(result.id).toBe(machine.id);
      expect(result.model).toBe('Updated Machine');
      expect(result.firmware_version).toBe('v2.0.0');
      expect(result.created_at).toBeInstanceOf(Date); // Should remain unchanged
    });

    it('should handle partial updates correctly', async () => {
      // Arrange: Create test data
      const machineData = {
        model: 'Test Machine',
        firmware_version: 'v1.0.0',
      };

      const machine = await machineService.createMachine(machineData);

      const updateData = {
        model: 'Partially Updated Machine',
      };

      // Act: Update machine partially
      const result = await machineService.updateMachine(machine.id, updateData);

      // Assert: Verify only specified fields were updated
      expect(result).toBeDefined();
      expect(result.id).toBe(machine.id);
      expect(result.model).toBe('Partially Updated Machine');
      expect(result.firmware_version).toBe('v1.0.0'); // Should remain unchanged
      expect(result.created_at).toBeInstanceOf(Date); // Should remain unchanged
    });

    it('should handle null values in updates', async () => {
      // Arrange: Create test data
      const machineData = {
        model: 'Test Machine',
        firmware_version: 'v1.0.0',
      };

      const machine = await machineService.createMachine(machineData);

      const updateData = {
        firmware_version: null,
      };

      // Act: Update machine with null values
      const result = await machineService.updateMachine(machine.id, updateData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBe(machine.id);
      expect(result.model).toBe('Test Machine'); // Should remain unchanged
      expect(result.firmware_version).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date); // Should remain unchanged
    });

    it('should trim whitespace in updates', async () => {
      // Arrange: Create test data
      const machineData = {
        model: 'Test Machine',
        firmware_version: 'v1.0.0',
      };

      const machine = await machineService.createMachine(machineData);

      const updateData = {
        model: '  Updated Machine  ',
        firmware_version: '  v2.0.0  ',
      };

      // Act: Update machine with whitespace
      const result = await machineService.updateMachine(machine.id, updateData);

      // Assert: Verify whitespace is trimmed
      expect(result).toBeDefined();
      expect(result.id).toBe(machine.id);
      expect(result.model).toBe('Updated Machine');
      expect(result.firmware_version).toBe('v2.0.0');
    });

    it('should handle empty firmware version in updates by setting it to null', async () => {
      // Arrange: Create test data
      const machineData = {
        model: 'Test Machine',
        firmware_version: 'v1.0.0',
      };

      const machine = await machineService.createMachine(machineData);

      const updateData = {
        firmware_version: '', // Empty string
      };

      // Act: Update machine with empty firmware version
      const result = await machineService.updateMachine(machine.id, updateData);

      // Assert: Verify empty firmware version is set to null
      expect(result).toBeDefined();
      expect(result.id).toBe(machine.id);
      expect(result.model).toBe('Test Machine'); // Should remain unchanged
      expect(result.firmware_version).toBeNull();
    });

    it('should throw error when updating non-existent machine', async () => {
      // Act & Assert: Should throw error for non-existent machine
      const updateData = {
        model: 'Updated Machine',
      };
      await expect(
        machineService.updateMachine('550e8400-e29b-41d4-a716-446655440003', updateData)
      ).rejects.toThrow('Machine with ID 550e8400-e29b-41d4-a716-446655440003 not found');
    });

    it('should throw error when model in update is empty', async () => {
      // Arrange: Create test data
      const machineData = {
        model: 'Test Machine',
        firmware_version: 'v1.0.0',
      };

      const machine = await machineService.createMachine(machineData);

      const updateData = {
        model: '', // Empty model
      };

      // Act & Assert: Should throw error for empty model
      await expect(machineService.updateMachine(machine.id, updateData)).rejects.toThrow(
        'Machine model cannot be empty'
      );
    });

    it('should throw error when model in update is only whitespace', async () => {
      // Arrange: Create test data
      const machineData = {
        model: 'Test Machine',
        firmware_version: 'v1.0.0',
      };

      const machine = await machineService.createMachine(machineData);

      const updateData = {
        model: '   ', // Whitespace only
      };

      // Act & Assert: Should throw error for empty model after trimming
      await expect(machineService.updateMachine(machine.id, updateData)).rejects.toThrow(
        'Machine model cannot be empty'
      );
    });
  });

  describe('deleteMachine', () => {
    it('should delete existing machine', async () => {
      // Arrange: Create test data
      const machineData = {
        model: 'Test Machine',
        firmware_version: 'v1.0.0',
      };

      const machine = await machineService.createMachine(machineData);

      // Act: Delete machine
      const result = await machineService.deleteMachine(machine.id);

      // Assert: Verify deletion was successful
      expect(result).toBe(true);
    });

    it('should throw error when deleting non-existent machine', async () => {
      // Act & Assert: Should throw error for non-existent machine
      await expect(
        machineService.deleteMachine('550e8400-e29b-41d4-a716-446655440004')
      ).rejects.toThrow('Machine with ID 550e8400-e29b-41d4-a716-446655440004 not found');
    });
  });
});
