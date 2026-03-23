import { GrinderService } from '../../../services/GrinderService';
import { Grinder } from '../../../entities/Grinder';
import { DataSource } from 'typeorm';
import { createMockDataSource } from '../../__mocks__/data-source.mock';

// Mock data
const mockGrinderData = {
  model: 'Baratza Sette 270Wi',
  manufacturer: 'Baratza',
  burrType: 'Conical',
  burrInstallDate: '2023-01-15',
  serialNumber: 'SETTE270-12345',
};

describe('GrinderService', () => {
  let grinderService: GrinderService;
  let mockDataSource: DataSource;
  let mockGrinderRepository: any;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    mockGrinderRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findAndCount: jest.fn(),
    };
    
    mockDataSource.getRepository = jest.fn().mockReturnValue(mockGrinderRepository);
    grinderService = new GrinderService(mockDataSource);
  });

  describe('getAllGrinders', () => {
    it('should return all grinders with relations', async () => {
      // Arrange
      const expectedGrinders = [
        { 
          id: '1', 
          model: 'Grinder 1',
          manufacturer: 'Manufacturer 1',
          created_at: new Date(),
          updated_at: new Date(),
          shots: []
        },
        { 
          id: '2', 
          model: 'Grinder 2',
          manufacturer: 'Manufacturer 2',
          created_at: new Date(),
          updated_at: new Date(),
          shots: []
        },
      ];
      mockGrinderRepository.find.mockResolvedValue(expectedGrinders);

      // Act
      const result = await grinderService.getAllGrinders();

      // Assert
      expect(mockGrinderRepository.find).toHaveBeenCalledWith({
        relations: ['shots'],
      });
      expect(result).toEqual(expectedGrinders);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockGrinderRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(grinderService.getAllGrinders()).rejects.toThrow('Database error');
    });
  });

  describe('getGrinderById', () => {
    it('should return grinder by ID with relations', async () => {
      // Arrange
      const grinderId = 'test-id';
      const expectedGrinder = { 
        id: grinderId, 
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        created_at: new Date(),
        updated_at: new Date(),
        shots: []
      };
      mockGrinderRepository.findOne.mockResolvedValue(expectedGrinder);

      // Act
      const result = await grinderService.getGrinderById(grinderId);

      // Assert
      expect(mockGrinderRepository.findOne).toHaveBeenCalledWith({
        where: { id: grinderId },
        relations: ['shots'],
      });
      expect(result).toEqual(expectedGrinder);
    });

    it('should throw error when grinder not found', async () => {
      // Arrange
      const grinderId = 'non-existent-id';
      mockGrinderRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(grinderService.getGrinderById(grinderId)).rejects.toThrow(
        `Grinder with ID ${grinderId} not found`
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const grinderId = 'test-id';
      const error = new Error('Database error');
      mockGrinderRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(grinderService.getGrinderById(grinderId)).rejects.toThrow('Database error');
    });
  });

  describe('createGrinder', () => {
    it('should create grinder with valid data', async () => {
      // Arrange
      const expectedGrinder = { 
        id: 'new-id', 
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: new Date('2023-01-15'),
        serialNumber: 'SETTE270-12345',
        created_at: new Date(),
        updated_at: new Date(),
        shots: []
      };
      mockGrinderRepository.create.mockReturnValue({
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: new Date('2023-01-15'),
        serialNumber: 'SETTE270-12345',
      });
      mockGrinderRepository.save.mockResolvedValue(expectedGrinder);

      // Act
      const result = await grinderService.createGrinder(mockGrinderData);

      // Assert
      expect(mockGrinderRepository.create).toHaveBeenCalledWith({
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: new Date('2023-01-15'),
        serialNumber: 'SETTE270-12345',
      });
      expect(mockGrinderRepository.save).toHaveBeenCalledWith({
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: new Date('2023-01-15'),
        serialNumber: 'SETTE270-12345',
      });
      expect(result).toEqual(expectedGrinder);
    });

    it('should throw error when model is missing', async () => {
      // Arrange
      const invalidData = {
        model: '', // Empty string should trigger validation
        manufacturer: 'Baratza',
      };

      // Act & Assert
      await expect(grinderService.createGrinder(invalidData)).rejects.toThrow(
        'Grinder model is required'
      );
    });

    it('should throw error when model is empty string', async () => {
      // Arrange
      const invalidData = {
        model: '',
        manufacturer: 'Baratza',
      };

      // Act & Assert
      await expect(grinderService.createGrinder(invalidData)).rejects.toThrow(
        'Grinder model is required'
      );
    });

    it('should handle date conversion for burrInstallDate', async () => {
      // Arrange
      const grinderDataWithStringDate = {
        ...mockGrinderData,
        burrInstallDate: '2023-01-15T00:00:00.000Z', // ISO string
      };
      const expectedGrinder = { 
        id: 'new-id', 
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: new Date('2023-01-15T00:00:00.000Z'),
        serialNumber: 'SETTE270-12345',
        created_at: new Date(),
        updated_at: new Date(),
        shots: []
      };
      mockGrinderRepository.create.mockReturnValue(grinderDataWithStringDate);
      mockGrinderRepository.save.mockResolvedValue(expectedGrinder);

      // Act
      const result = await grinderService.createGrinder(grinderDataWithStringDate);

      // Assert
      expect(mockGrinderRepository.create).toHaveBeenCalledWith({
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: new Date('2023-01-15T00:00:00.000Z'),
        serialNumber: 'SETTE270-12345',
      });
      expect(result).toEqual(expectedGrinder);
    });

    it('should handle undefined burrInstallDate', async () => {
      // Arrange
      const grinderDataWithoutDate = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        // burrInstallDate is undefined
      };
      const expectedGrinder = { 
        id: 'new-id', 
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrInstallDate: null,
        created_at: new Date(),
        updated_at: new Date(),
        shots: []
      };
      mockGrinderRepository.create.mockReturnValue({
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrInstallDate: null,
      });
      mockGrinderRepository.save.mockResolvedValue(expectedGrinder);

      // Act
      const result = await grinderService.createGrinder(grinderDataWithoutDate);

      // Assert
      expect(mockGrinderRepository.create).toHaveBeenCalledWith({
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: null,
        burrInstallDate: null,
        serialNumber: null,
      });
      expect(result).toEqual(expectedGrinder);
    });

    it('should handle null burrInstallDate', async () => {
      // Arrange
      const grinderDataWithNullDate = {
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrInstallDate: null,
      };
      const expectedGrinder = { 
        id: 'new-id', 
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrInstallDate: null,
        created_at: new Date(),
        updated_at: new Date(),
        shots: []
      };
      mockGrinderRepository.create.mockReturnValue(grinderDataWithNullDate);
      mockGrinderRepository.save.mockResolvedValue(expectedGrinder);

      // Act
      const result = await grinderService.createGrinder(grinderDataWithNullDate);

      // Assert
      expect(mockGrinderRepository.create).toHaveBeenCalledWith({
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        burrType: null,
        burrInstallDate: null,
        serialNumber: null,
      });
      expect(result).toEqual(expectedGrinder);
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const error = new Error('Database error');
      mockGrinderRepository.create.mockReturnValue(mockGrinderData);
      mockGrinderRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(grinderService.createGrinder(mockGrinderData)).rejects.toThrow('Database error');
    });
  });

  describe('updateGrinder', () => {
    it('should update existing grinder', async () => {
      // Arrange
      const grinderId = 'test-id';
      const existingGrinder = {
        id: grinderId,
        model: 'Old Model',
        manufacturer: 'Old Manufacturer',
        burrType: 'Old Type',
        burrInstallDate: new Date('2022-01-01'),
        serialNumber: 'OLD-123',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const updateData = {
        model: 'New Model',
        manufacturer: 'New Manufacturer',
        burrInstallDate: '2023-01-15',
      };
      const updatedGrinder = { 
        ...existingGrinder, 
        ...updateData,
        burrInstallDate: new Date('2023-01-15')
      };
      
      mockGrinderRepository.findOne.mockResolvedValue(existingGrinder);
      mockGrinderRepository.save.mockResolvedValue(updatedGrinder);

      // Act
      const result = await grinderService.updateGrinder(grinderId, updateData);

      // Assert
      expect(mockGrinderRepository.findOne).toHaveBeenCalledWith({
        where: { id: grinderId },
      });
      expect(mockGrinderRepository.save).toHaveBeenCalledWith(updatedGrinder);
      expect(result).toEqual(updatedGrinder);
    });

    it('should throw error when grinder not found for update', async () => {
      // Arrange
      const grinderId = 'non-existent-id';
      const updateData = { model: 'New Model' };
      mockGrinderRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(grinderService.updateGrinder(grinderId, updateData)).rejects.toThrow(
        `Grinder with ID ${grinderId} not found`
      );
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const grinderId = 'test-id';
      const existingGrinder = {
        id: grinderId,
        model: 'Original Model',
        manufacturer: 'Original Manufacturer',
        burrType: 'Original Type',
        burrInstallDate: new Date('2022-01-01'),
        serialNumber: 'ORIGINAL-123',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const partialUpdate = { model: 'Updated Model' }; // Only updating model
      const updatedGrinder = { ...existingGrinder, model: 'Updated Model' };
      
      mockGrinderRepository.findOne.mockResolvedValue(existingGrinder);
      mockGrinderRepository.save.mockResolvedValue(updatedGrinder);

      // Act
      const result = await grinderService.updateGrinder(grinderId, partialUpdate);

      // Assert
      expect(result.model).toBe('Updated Model');
      expect(result.manufacturer).toBe('Original Manufacturer'); // Should remain unchanged
      expect(result.burrType).toBe('Original Type'); // Should remain unchanged
    });

    it('should handle date conversion in update', async () => {
      // Arrange
      const grinderId = 'test-id';
      const existingGrinder = {
        id: grinderId,
        model: 'Test Model',
        manufacturer: 'Test Manufacturer',
        burrType: 'Test Type',
        burrInstallDate: new Date('2022-01-01'),
        serialNumber: 'TEST-123',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const updateData = { burrInstallDate: '2023-01-15' };
      const updatedGrinder = { 
        ...existingGrinder, 
        burrInstallDate: new Date('2023-01-15')
      };
      
      mockGrinderRepository.findOne.mockResolvedValue(existingGrinder);
      mockGrinderRepository.save.mockResolvedValue(updatedGrinder);

      // Act
      const result = await grinderService.updateGrinder(grinderId, updateData);

      // Assert
      expect(result.burrInstallDate).toEqual(new Date('2023-01-15'));
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const grinderId = 'test-id';
      const updateData = { model: 'New Model' };
      const error = new Error('Database error');
      mockGrinderRepository.findOne.mockResolvedValue({ id: grinderId });
      mockGrinderRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(grinderService.updateGrinder(grinderId, updateData)).rejects.toThrow('Database error');
    });
  });

  describe('deleteGrinder', () => {
    it('should delete existing grinder', async () => {
      // Arrange
      const grinderId = 'test-id';
      const existingGrinder = { 
        id: grinderId, 
        model: 'Test Grinder',
        manufacturer: 'Test Manufacturer',
        created_at: new Date(),
        updated_at: new Date(),
        shots: []
      };
      mockGrinderRepository.findOne.mockResolvedValue(existingGrinder);
      mockGrinderRepository.remove.mockResolvedValue(existingGrinder);

      // Act
      const result = await grinderService.deleteGrinder(grinderId);

      // Assert
      expect(mockGrinderRepository.findOne).toHaveBeenCalledWith({
        where: { id: grinderId },
      });
      expect(mockGrinderRepository.remove).toHaveBeenCalledWith(existingGrinder);
      expect(result).toBe(true);
    });

    it('should throw error when grinder not found for deletion', async () => {
      // Arrange
      const grinderId = 'non-existent-id';
      mockGrinderRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(grinderService.deleteGrinder(grinderId)).rejects.toThrow(
        `Grinder with ID ${grinderId} not found`
      );
    });

    it('should handle repository errors during deletion', async () => {
      // Arrange
      const grinderId = 'test-id';
      const error = new Error('Database error');
      mockGrinderRepository.findOne.mockResolvedValue({ id: grinderId });
      mockGrinderRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(grinderService.deleteGrinder(grinderId)).rejects.toThrow('Database error');
    });
  });

  describe('getGrindersByManufacturer', () => {
    it('should return grinders filtered by manufacturer', async () => {
      // Arrange
      const manufacturerName = 'Baratza';
      const expectedGrinders = [
        { 
          id: '1', 
          model: 'Baratza Sette 270Wi',
          manufacturer: 'Baratza',
          created_at: new Date(),
          updated_at: new Date(),
          shots: []
        },
        { 
          id: '2', 
          model: 'Baratza Vario',
          manufacturer: 'Baratza',
          created_at: new Date(),
          updated_at: new Date(),
          shots: []
        },
      ];
      mockGrinderRepository.find.mockResolvedValue(expectedGrinders);

      // Act
      const result = await grinderService.getGrindersByManufacturer(manufacturerName);

      // Assert
      expect(mockGrinderRepository.find).toHaveBeenCalledWith({
        where: { manufacturer: manufacturerName },
        relations: ['shots'],
      });
      expect(result).toEqual(expectedGrinders);
    });

    it('should return empty array when no grinders match manufacturer', async () => {
      // Arrange
      const manufacturerName = 'NonExistent Manufacturer';
      mockGrinderRepository.find.mockResolvedValue([]);

      // Act
      const result = await grinderService.getGrindersByManufacturer(manufacturerName);

      // Assert
      expect(result).toEqual([]);
      expect(mockGrinderRepository.find).toHaveBeenCalledWith({
        where: { manufacturer: manufacturerName },
        relations: ['shots'],
      });
    });

    it('should handle repository errors when fetching by manufacturer', async () => {
      // Arrange
      const manufacturerName = 'Test Manufacturer';
      const error = new Error('Database error');
      mockGrinderRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(grinderService.getGrindersByManufacturer(manufacturerName)).rejects.toThrow('Database error');
    });
  });
});
