import { ShotPreparationService } from '../../../services/ShotPreparationService';
import { ShotPreparation } from '../../../entities/ShotPreparation';
import { Shot } from '../../../entities/Shot';
import { DataSource } from 'typeorm';
import { createMockDataSource } from '../../__mocks__/data-source.mock';

// Mock data
const mockShotData = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  shot_type: 'espresso',
  dose: 18.5,
  extraction_time: 25,
};

const mockPreparationData = {
  shot_id: '550e8400-e29b-41d4-a716-446655440002',
  dose_grams: 18.5,
  burr_setting: 15,
  basket_type: 'Portafilter',
  basket_size_grams: 18,
  distribution_method: 'WDT',
  tamp_type: 'Leveler',
  tamp_pressure_category: 'Medium',
};

describe('ShotPreparationService', () => {
  let shotPreparationService: ShotPreparationService;
  let mockDataSource: DataSource;
  let mockPreparationRepository: any;
  let mockShotRepository: any;

  beforeEach(() => {
    mockDataSource = createMockDataSource();

    // Setup mock repositories
    mockPreparationRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findAndCount: jest.fn(),
    };

    mockShotRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockDataSource.getRepository = jest.fn().mockImplementation(entity => {
      if (entity === ShotPreparation) return mockPreparationRepository;
      if (entity === Shot) return mockShotRepository;
      return mockPreparationRepository;
    });

    shotPreparationService = new ShotPreparationService(mockDataSource);
  });

  describe('getAllShotPreparations', () => {
    it('should return all shot preparations with relations', async () => {
      // Arrange
      const expectedPreparations = [
        {
          shot_id: '1',
          dose_grams: 18.5,
          burr_setting: 15,
          shot: mockShotData,
        },
        {
          shot_id: '2',
          dose_grams: 18.0,
          burr_setting: 14,
          shot: mockShotData,
        },
      ];
      mockPreparationRepository.find.mockResolvedValue(expectedPreparations);

      // Act
      const result = await shotPreparationService.getAllShotPreparations();

      // Assert
      expect(mockPreparationRepository.find).toHaveBeenCalledWith({
        relations: ['shot'],
      });
      expect(result).toEqual(expectedPreparations);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockPreparationRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(shotPreparationService.getAllShotPreparations()).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getShotPreparationById', () => {
    it('should return shot preparation by ID with relations', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const expectedPreparation = {
        shot_id: shotId,
        dose_grams: 18.5,
        burr_setting: 15,
        shot: mockShotData,
      };
      mockPreparationRepository.findOne.mockResolvedValue(expectedPreparation);

      // Act
      const result = await shotPreparationService.getShotPreparationById(shotId);

      // Assert
      expect(mockPreparationRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
        relations: ['shot'],
      });
      expect(result).toEqual(expectedPreparation);
    });

    it('should throw error when shot preparation not found', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      mockPreparationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotPreparationService.getShotPreparationById(shotId)).rejects.toThrow(
        `Shot preparation with ID ${shotId} not found`
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const error = new Error('Database error');
      mockPreparationRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(shotPreparationService.getShotPreparationById(shotId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('createShotPreparation', () => {
    it('should create shot preparation with valid data', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const expectedPreparation = {
        ...mockPreparationData,
        shot: mockShot,
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockPreparationRepository.create.mockReturnValue(mockPreparationData);
      mockPreparationRepository.save.mockResolvedValue(expectedPreparation);

      // Act
      const result = await shotPreparationService.createShotPreparation(mockPreparationData);

      // Assert
      expect(mockShotRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPreparationData.shot_id },
      });
      expect(mockPreparationRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        dose_grams: 18.5,
        burr_setting: 15,
        basket_type: 'Portafilter',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'Leveler',
        tamp_pressure_category: 'Medium',
      });
      expect(mockPreparationRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedPreparation);
    });

    it('should throw error when shot_id is missing', async () => {
      // Arrange
      const invalidData = {
        shot_id: '', // Empty string should trigger validation
        dose_grams: 18.5,
      };

      // Act & Assert
      await expect(shotPreparationService.createShotPreparation(invalidData)).rejects.toThrow(
        'Shot ID is required'
      );
    });

    it('should throw error when shot not found', async () => {
      // Arrange
      mockShotRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        shotPreparationService.createShotPreparation(mockPreparationData)
      ).rejects.toThrow(`Shot with ID ${mockPreparationData.shot_id} not found`);
    });

    it('should handle numeric conversions', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const preparationDataWithStrings = {
        ...mockPreparationData,
        dose_grams: '18.5', // String that should be converted to number
        burr_setting: '15', // String that should be converted to number
        basket_size_grams: '18', // String that should be converted to number
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockPreparationRepository.create.mockReturnValue(preparationDataWithStrings);
      mockPreparationRepository.save.mockResolvedValue({ ...preparationDataWithStrings });

      // Act
      const result = await shotPreparationService.createShotPreparation(preparationDataWithStrings);

      // Assert
      expect(mockPreparationRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        dose_grams: 18.5, // Should be converted to number
        burr_setting: 15, // Should be converted to number
        basket_type: 'Portafilter',
        basket_size_grams: 18, // Should be converted to number
        distribution_method: 'WDT',
        tamp_type: 'Leveler',
        tamp_pressure_category: 'Medium',
      });
      expect(result).toBeDefined();
    });

    it('should handle invalid numeric conversions', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const preparationDataWithInvalidNumbers = {
        ...mockPreparationData,
        dose_grams: 'invalid-number', // Invalid string that can't be parsed
        burr_setting: 'invalid-number', // Invalid string that can't be parsed
        basket_size_grams: 'invalid-number', // Invalid string that can't be parsed
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockPreparationRepository.create.mockReturnValue(preparationDataWithInvalidNumbers);
      mockPreparationRepository.save.mockResolvedValue({ ...preparationDataWithInvalidNumbers });

      // Act
      const result = await shotPreparationService.createShotPreparation(
        preparationDataWithInvalidNumbers
      );

      // Assert
      expect(mockPreparationRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        dose_grams: null, // Should be converted to null
        burr_setting: null, // Should be converted to null
        basket_type: 'Portafilter',
        basket_size_grams: null, // Should be converted to null
        distribution_method: 'WDT',
        tamp_type: 'Leveler',
        tamp_pressure_category: 'Medium',
      });
      expect(result).toBeDefined();
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const error = new Error('Database error');
      mockShotRepository.findOne.mockResolvedValue(mockShotData);
      mockPreparationRepository.create.mockReturnValue(mockPreparationData);
      mockPreparationRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(
        shotPreparationService.createShotPreparation(mockPreparationData)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateShotPreparation', () => {
    it('should update existing shot preparation', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingPreparation = {
        shot_id: shotId,
        dose_grams: 18.5,
        burr_setting: 15,
        basket_type: 'Portafilter',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'Leveler',
        tamp_pressure_category: 'Medium',
      };
      const updateData = {
        dose_grams: 18.0,
        burr_setting: 14,
      };
      const updatedPreparation = { ...existingPreparation, ...updateData };

      mockPreparationRepository.findOne.mockResolvedValue(existingPreparation);
      mockPreparationRepository.save.mockResolvedValue(updatedPreparation);

      // Act
      const result = await shotPreparationService.updateShotPreparation(shotId, updateData);

      // Assert
      expect(mockPreparationRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
      });
      expect(mockPreparationRepository.save).toHaveBeenCalledWith(updatedPreparation);
      expect(result).toEqual(updatedPreparation);
    });

    it('should throw error when shot preparation not found for update', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      const updateData = { dose_grams: 18.0 };
      mockPreparationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        shotPreparationService.updateShotPreparation(shotId, updateData)
      ).rejects.toThrow(`Shot preparation with ID ${shotId} not found`);
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingPreparation = {
        shot_id: shotId,
        dose_grams: 18.5,
        burr_setting: 15,
        basket_type: 'Portafilter',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'Leveler',
        tamp_pressure_category: 'Medium',
      };
      const partialUpdate = { dose_grams: 18.0 }; // Only updating dose
      const updatedPreparation = { ...existingPreparation, dose_grams: 18.0 };

      mockPreparationRepository.findOne.mockResolvedValue(existingPreparation);
      mockPreparationRepository.save.mockResolvedValue(updatedPreparation);

      // Act
      const result = await shotPreparationService.updateShotPreparation(shotId, partialUpdate);

      // Assert
      expect(result.dose_grams).toBe(18.0);
      expect(result.burr_setting).toBe(15); // Should remain unchanged
      expect(result.basket_type).toBe('Portafilter'); // Should remain unchanged
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const updateData = { dose_grams: 18.0 };
      const error = new Error('Database error');
      mockPreparationRepository.findOne.mockResolvedValue({ shot_id: shotId });
      mockPreparationRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(
        shotPreparationService.updateShotPreparation(shotId, updateData)
      ).rejects.toThrow('Database error');
    });

    it('should handle string-to-number conversions in update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingPreparation = {
        shot_id: shotId,
        dose_grams: 18.5,
        burr_setting: 15,
        basket_size_grams: 18,
        basket_type: 'Portafilter',
        distribution_method: 'WDT',
        tamp_type: 'Leveler',
        tamp_pressure_category: 'Medium',
      };

      const updateDataWithStringNumbers = {
        dose_grams: '20.5', // String that should be converted
        burr_setting: '12', // String that should be converted
        basket_size_grams: '20', // String that should be converted
      };

      mockPreparationRepository.findOne.mockResolvedValue(existingPreparation);
      mockPreparationRepository.save.mockResolvedValue({
        ...existingPreparation,
        dose_grams: 20.5,
        burr_setting: 12,
        basket_size_grams: 20,
      });

      // Act
      const result = await shotPreparationService.updateShotPreparation(
        shotId,
        updateDataWithStringNumbers
      );

      // Assert
      expect(result.dose_grams).toBe(20.5);
      expect(result.burr_setting).toBe(12);
      expect(result.basket_size_grams).toBe(20);
    });

    it('should handle invalid string-to-number conversions in update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingPreparation = {
        shot_id: shotId,
        dose_grams: 18.5,
        burr_setting: 15,
        basket_size_grams: 18,
      };

      const updateDataWithInvalidNumbers = {
        dose_grams: 'invalid-number', // Should become null
        burr_setting: 'invalid-number', // Should become null
        basket_size_grams: 'invalid-number', // Should become null
      };

      mockPreparationRepository.findOne.mockResolvedValue(existingPreparation);
      mockPreparationRepository.save.mockResolvedValue({
        ...existingPreparation,
        dose_grams: null,
        burr_setting: null,
        basket_size_grams: null,
      });

      // Act
      const result = await shotPreparationService.updateShotPreparation(
        shotId,
        updateDataWithInvalidNumbers
      );

      // Assert
      expect(result.dose_grams).toBeNull();
      expect(result.burr_setting).toBeNull();
      expect(result.basket_size_grams).toBeNull();
    });

    it('should handle null assignments in update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingPreparation = {
        shot_id: shotId,
        dose_grams: 18.5,
        burr_setting: 15,
        basket_type: 'Portafilter',
        distribution_method: 'WDT',
        tamp_type: 'Leveler',
        tamp_pressure_category: 'Medium',
      };

      const updateDataWithNulls = {
        dose_grams: null,
        burr_setting: null,
        basket_type: null,
        distribution_method: null,
        tamp_type: null,
        tamp_pressure_category: null,
      };

      mockPreparationRepository.findOne.mockResolvedValue(existingPreparation);
      mockPreparationRepository.save.mockResolvedValue({
        ...existingPreparation,
        ...updateDataWithNulls,
      });

      // Act
      const result = await shotPreparationService.updateShotPreparation(
        shotId,
        updateDataWithNulls
      );

      // Assert
      expect(result.dose_grams).toBeNull();
      expect(result.burr_setting).toBeNull();
      expect(result.basket_type).toBeNull();
      expect(result.distribution_method).toBeNull();
      expect(result.tamp_type).toBeNull();
      expect(result.tamp_pressure_category).toBeNull();
    });

    it('should handle string field trimming in update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingPreparation = {
        shot_id: shotId,
        basket_type: 'Portafilter',
        distribution_method: 'WDT',
        tamp_type: 'Leveler',
        tamp_pressure_category: 'Medium',
      };

      const updateDataWithWhitespace = {
        basket_type: '  Portafilter  ', // Should be trimmed
        distribution_method: '  WDT  ', // Should be trimmed
        tamp_type: '  Leveler  ', // Should be trimmed
        tamp_pressure_category: '  Medium  ', // Should be trimmed
      };

      mockPreparationRepository.findOne.mockResolvedValue(existingPreparation);
      mockPreparationRepository.save.mockResolvedValue({
        ...existingPreparation,
        basket_type: 'Portafilter',
        distribution_method: 'WDT',
        tamp_type: 'Leveler',
        tamp_pressure_category: 'Medium',
      });

      // Act
      const result = await shotPreparationService.updateShotPreparation(
        shotId,
        updateDataWithWhitespace
      );

      // Assert
      expect(result.basket_type).toBe('Portafilter');
      expect(result.distribution_method).toBe('WDT');
      expect(result.tamp_type).toBe('Leveler');
      expect(result.tamp_pressure_category).toBe('Medium');
    });
  });

  describe('deleteShotPreparation', () => {
    it('should delete existing shot preparation', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingPreparation = {
        shot_id: shotId,
        dose_grams: 18.5,
        burr_setting: 15,
        shot: mockShotData,
      };
      mockPreparationRepository.findOne.mockResolvedValue(existingPreparation);
      mockPreparationRepository.remove.mockResolvedValue(existingPreparation);

      // Act
      const result = await shotPreparationService.deleteShotPreparation(shotId);

      // Assert
      expect(mockPreparationRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
      });
      expect(mockPreparationRepository.remove).toHaveBeenCalledWith(existingPreparation);
      expect(result).toBe(true);
    });

    it('should throw error when shot preparation not found for deletion', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      mockPreparationRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotPreparationService.deleteShotPreparation(shotId)).rejects.toThrow(
        `Shot preparation with ID ${shotId} not found`
      );
    });

    it('should handle repository errors during deletion', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const error = new Error('Database error');
      mockPreparationRepository.findOne.mockResolvedValue({ shot_id: shotId });
      mockPreparationRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(shotPreparationService.deleteShotPreparation(shotId)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
