import { MachineService } from '../../../services/MachineService';
import { Machine } from '../../../entities/Machine';
import { DataSource } from 'typeorm';
import { createMockDataSource } from '../../__mocks__/data-source.mock';

// Mock data
const mockMachineData = {
  model: 'La Marzocco Linea Mini',
  firmware_version: '1.2.3',
};

describe('MachineService', () => {
  let machineService: MachineService;
  let mockDataSource: DataSource;
  let mockMachineRepository: any;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    mockMachineRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findAndCount: jest.fn(),
    };

    mockDataSource.getRepository = jest.fn().mockReturnValue(mockMachineRepository);
    machineService = new MachineService(mockDataSource);
  });

  describe('getAllMachines', () => {
    it('should return all machines with relations', async () => {
      // Arrange
      const expectedMachines = [
        {
          id: '1',
          model: 'Machine 1',
          firmware_version: '1.0.0',
          created_at: new Date(),
          shots: [],
        },
        {
          id: '2',
          model: 'Machine 2',
          firmware_version: '1.1.0',
          created_at: new Date(),
          shots: [],
        },
      ];
      mockMachineRepository.find.mockResolvedValue(expectedMachines);

      // Act
      const result = await machineService.getAllMachines();

      // Assert
      expect(mockMachineRepository.find).toHaveBeenCalledWith({
        relations: ['shots'],
      });
      expect(result).toEqual(expectedMachines);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockMachineRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(machineService.getAllMachines()).rejects.toThrow('Database error');
    });
  });

  describe('getMachineById', () => {
    it('should return machine by ID with relations', async () => {
      // Arrange
      const machineId = 'test-id';
      const expectedMachine = {
        id: machineId,
        model: 'Test Machine',
        firmware_version: '1.0.0',
        created_at: new Date(),
        shots: [],
      };
      mockMachineRepository.findOne.mockResolvedValue(expectedMachine);

      // Act
      const result = await machineService.getMachineById(machineId);

      // Assert
      expect(mockMachineRepository.findOne).toHaveBeenCalledWith({
        where: { id: machineId },
        relations: ['shots'],
      });
      expect(result).toEqual(expectedMachine);
    });

    it('should throw error when machine not found', async () => {
      // Arrange
      const machineId = 'non-existent-id';
      mockMachineRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(machineService.getMachineById(machineId)).rejects.toThrow(
        `Machine with ID ${machineId} not found`
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const machineId = 'test-id';
      const error = new Error('Database error');
      mockMachineRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(machineService.getMachineById(machineId)).rejects.toThrow('Database error');
    });
  });

  describe('createMachine', () => {
    it('should create machine with valid data', async () => {
      // Arrange
      const expectedMachine = {
        id: 'new-id',
        ...mockMachineData,
        created_at: new Date(),
        shots: [],
      };
      mockMachineRepository.create.mockReturnValue(mockMachineData);
      mockMachineRepository.save.mockResolvedValue(expectedMachine);

      // Act
      const result = await machineService.createMachine(mockMachineData);

      // Assert
      expect(mockMachineRepository.create).toHaveBeenCalledWith(mockMachineData);
      expect(mockMachineRepository.save).toHaveBeenCalledWith(mockMachineData);
      expect(result).toEqual(expectedMachine);
    });

    it('should throw error when model is missing', async () => {
      // Arrange
      const invalidData = {
        model: '', // Empty string should trigger validation
        firmware_version: '1.2.3',
      };

      // Act & Assert
      await expect(machineService.createMachine(invalidData)).rejects.toThrow(
        'Machine model is required'
      );
    });

    it('should throw error when model is empty string', async () => {
      // Arrange
      const invalidData = {
        model: '',
        firmware_version: '1.2.3',
      };

      // Act & Assert
      await expect(machineService.createMachine(invalidData)).rejects.toThrow(
        'Machine model is required'
      );
    });

    it('should handle undefined firmware_version', async () => {
      // Arrange
      const machineDataWithoutFirmware = {
        model: 'Test Machine',
        // firmware_version is undefined
      };
      const expectedMachine = {
        id: 'new-id',
        model: 'Test Machine',
        firmware_version: null,
        created_at: new Date(),
        shots: [],
      };
      mockMachineRepository.create.mockReturnValue({
        model: 'Test Machine',
        firmware_version: null,
      });
      mockMachineRepository.save.mockResolvedValue(expectedMachine);

      // Act
      const result = await machineService.createMachine(machineDataWithoutFirmware);

      // Assert
      expect(mockMachineRepository.create).toHaveBeenCalledWith({
        model: 'Test Machine',
        firmware_version: null,
      });
      expect(result).toEqual(expectedMachine);
    });

    it('should handle null firmware_version', async () => {
      // Arrange
      const machineDataWithNullFirmware = {
        model: 'Test Machine',
        firmware_version: null,
      };
      const expectedMachine = {
        id: 'new-id',
        model: 'Test Machine',
        firmware_version: null,
        created_at: new Date(),
        shots: [],
      };
      mockMachineRepository.create.mockReturnValue(machineDataWithNullFirmware);
      mockMachineRepository.save.mockResolvedValue(expectedMachine);

      // Act
      const result = await machineService.createMachine(machineDataWithNullFirmware);

      // Assert
      expect(mockMachineRepository.create).toHaveBeenCalledWith(machineDataWithNullFirmware);
      expect(result).toEqual(expectedMachine);
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const error = new Error('Database error');
      mockMachineRepository.create.mockReturnValue(mockMachineData);
      mockMachineRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(machineService.createMachine(mockMachineData)).rejects.toThrow('Database error');
    });
  });

  describe('updateMachine', () => {
    it('should update existing machine', async () => {
      // Arrange
      const machineId = 'test-id';
      const existingMachine = {
        id: machineId,
        model: 'Old Model',
        firmware_version: '1.0.0',
        created_at: new Date(),
      };
      const updateData = {
        model: 'New Model',
        firmware_version: '2.0.0',
      };
      const updatedMachine = { ...existingMachine, ...updateData };

      mockMachineRepository.findOne.mockResolvedValue(existingMachine);
      mockMachineRepository.save.mockResolvedValue(updatedMachine);

      // Act
      const result = await machineService.updateMachine(machineId, updateData);

      // Assert
      expect(mockMachineRepository.findOne).toHaveBeenCalledWith({
        where: { id: machineId },
      });
      expect(mockMachineRepository.save).toHaveBeenCalledWith(updatedMachine);
      expect(result).toEqual(updatedMachine);
    });

    it('should throw error when machine not found for update', async () => {
      // Arrange
      const machineId = 'non-existent-id';
      const updateData = { model: 'New Model' };
      mockMachineRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(machineService.updateMachine(machineId, updateData)).rejects.toThrow(
        `Machine with ID ${machineId} not found`
      );
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const machineId = 'test-id';
      const existingMachine = {
        id: machineId,
        model: 'Original Model',
        firmware_version: '1.0.0',
        created_at: new Date(),
      };
      const partialUpdate = { model: 'Updated Model' }; // Only updating model
      const updatedMachine = { ...existingMachine, model: 'Updated Model' };

      mockMachineRepository.findOne.mockResolvedValue(existingMachine);
      mockMachineRepository.save.mockResolvedValue(updatedMachine);

      // Act
      const result = await machineService.updateMachine(machineId, partialUpdate);

      // Assert
      expect(result.model).toBe('Updated Model');
      expect(result.firmware_version).toBe('1.0.0'); // Should remain unchanged
    });

    it('should handle firmware_version set to null', async () => {
      // Arrange
      const machineId = 'test-id';
      const existingMachine = {
        id: machineId,
        model: 'Test Model',
        firmware_version: '1.0.0',
        created_at: new Date(),
      };
      const updateData = { firmware_version: null };
      const updatedMachine = { ...existingMachine, firmware_version: null };

      mockMachineRepository.findOne.mockResolvedValue(existingMachine);
      mockMachineRepository.save.mockResolvedValue(updatedMachine);

      // Act
      const result = await machineService.updateMachine(machineId, updateData);

      // Assert
      expect(result.firmware_version).toBeNull();
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const machineId = 'test-id';
      const updateData = { model: 'New Model' };
      const error = new Error('Database error');
      mockMachineRepository.findOne.mockResolvedValue({ id: machineId });
      mockMachineRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(machineService.updateMachine(machineId, updateData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('deleteMachine', () => {
    it('should delete existing machine', async () => {
      // Arrange
      const machineId = 'test-id';
      const existingMachine = {
        id: machineId,
        model: 'Test Machine',
        firmware_version: '1.0.0',
        created_at: new Date(),
      };
      mockMachineRepository.findOne.mockResolvedValue(existingMachine);
      mockMachineRepository.remove.mockResolvedValue(existingMachine);

      // Act
      const result = await machineService.deleteMachine(machineId);

      // Assert
      expect(mockMachineRepository.findOne).toHaveBeenCalledWith({
        where: { id: machineId },
      });
      expect(mockMachineRepository.remove).toHaveBeenCalledWith(existingMachine);
      expect(result).toBe(true);
    });

    it('should throw error when machine not found for deletion', async () => {
      // Arrange
      const machineId = 'non-existent-id';
      mockMachineRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(machineService.deleteMachine(machineId)).rejects.toThrow(
        `Machine with ID ${machineId} not found`
      );
    });

    it('should handle repository errors during deletion', async () => {
      // Arrange
      const machineId = 'test-id';
      const error = new Error('Database error');
      mockMachineRepository.findOne.mockResolvedValue({ id: machineId });
      mockMachineRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(machineService.deleteMachine(machineId)).rejects.toThrow('Database error');
    });
  });

  describe('getMachinesByModel', () => {
    it('should return machines filtered by model', async () => {
      // Arrange
      const modelName = 'La Marzocco';
      const expectedMachines = [
        {
          id: '1',
          model: 'La Marzocco Linea Mini',
          firmware_version: '1.0.0',
          created_at: new Date(),
          shots: [],
        },
        {
          id: '2',
          model: 'La Marzocco GB5',
          firmware_version: '1.1.0',
          created_at: new Date(),
          shots: [],
        },
      ];
      mockMachineRepository.find.mockResolvedValue(expectedMachines);

      // Act
      const result = await machineService.getMachinesByModel(modelName);

      // Assert
      expect(mockMachineRepository.find).toHaveBeenCalledWith({
        where: { model: expect.objectContaining({ _type: 'like', _value: `%${modelName}%` }) },
        relations: ['shots'],
      });
      expect(result).toEqual(expectedMachines);
    });

    it('should return empty array when no machines match model', async () => {
      // Arrange
      const modelName = 'NonExistent Model';
      mockMachineRepository.find.mockResolvedValue([]);

      // Act
      const result = await machineService.getMachinesByModel(modelName);

      // Assert
      expect(result).toEqual([]);
      expect(mockMachineRepository.find).toHaveBeenCalledWith({
        where: { model: expect.objectContaining({ _type: 'like', _value: `%${modelName}%` }) },
        relations: ['shots'],
      });
    });

    it('should handle repository errors when fetching by model', async () => {
      // Arrange
      const modelName = 'Test Model';
      const error = new Error('Database error');
      mockMachineRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(machineService.getMachinesByModel(modelName)).rejects.toThrow('Database error');
    });
  });
});
