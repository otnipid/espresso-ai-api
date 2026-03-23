import { ShotExtractionService } from '../../../services/ShotExtractionService';
import { ShotExtraction } from '../../../entities/ShotExtraction';
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

const mockExtractionData = {
  shot_id: '550e8400-e29b-41d4-a716-446655440002',
  yield_grams: 36.0,
  shot_time_seconds: 25,
  avg_pressure_bar: 9.0,
  water_temp_c: 93.0,
  preinfusion_seconds: 3,
  peak_pressure_bar: 9.5,
};

describe('ShotExtractionService', () => {
  let shotExtractionService: ShotExtractionService;
  let mockDataSource: DataSource;
  let mockExtractionRepository: any;
  let mockShotRepository: any;

  beforeEach(() => {
    mockDataSource = createMockDataSource();

    // Setup mock repositories
    mockExtractionRepository = {
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
      if (entity === ShotExtraction) return mockExtractionRepository;
      if (entity === Shot) return mockShotRepository;
      return mockExtractionRepository;
    });

    shotExtractionService = new ShotExtractionService(mockDataSource);
  });

  describe('getAllShotExtractions', () => {
    it('should return all shot extractions with relations', async () => {
      // Arrange
      const expectedExtractions = [
        {
          shot_id: '1',
          yield_grams: 36.0,
          shot_time_seconds: 25,
          avg_pressure_bar: 9.0,
          shot: mockShotData,
        },
        {
          shot_id: '2',
          yield_grams: 35.5,
          shot_time_seconds: 24,
          avg_pressure_bar: 8.8,
          shot: mockShotData,
        },
      ];
      mockExtractionRepository.find.mockResolvedValue(expectedExtractions);

      // Act
      const result = await shotExtractionService.getAllShotExtractions();

      // Assert
      expect(mockExtractionRepository.find).toHaveBeenCalledWith({
        relations: ['shot'],
      });
      expect(result).toEqual(expectedExtractions);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockExtractionRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(shotExtractionService.getAllShotExtractions()).rejects.toThrow('Database error');
    });
  });

  describe('getShotExtractionById', () => {
    it('should return shot extraction by ID with relations', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const expectedExtraction = {
        shot_id: shotId,
        yield_grams: 36.0,
        shot_time_seconds: 25,
        avg_pressure_bar: 9.0,
        shot: mockShotData,
      };
      mockExtractionRepository.findOne.mockResolvedValue(expectedExtraction);

      // Act
      const result = await shotExtractionService.getShotExtractionById(shotId);

      // Assert
      expect(mockExtractionRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
        relations: ['shot'],
      });
      expect(result).toEqual(expectedExtraction);
    });

    it('should throw error when shot extraction not found', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      mockExtractionRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotExtractionService.getShotExtractionById(shotId)).rejects.toThrow(
        `Shot extraction with ID ${shotId} not found`
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const error = new Error('Database error');
      mockExtractionRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(shotExtractionService.getShotExtractionById(shotId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('createShotExtraction', () => {
    it('should create shot extraction with valid data', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const expectedExtraction = {
        ...mockExtractionData,
        shot: mockShot,
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockExtractionRepository.create.mockReturnValue(mockExtractionData);
      mockExtractionRepository.save.mockResolvedValue(expectedExtraction);

      // Act
      const result = await shotExtractionService.createShotExtraction(mockExtractionData);

      // Assert
      expect(mockShotRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockExtractionData.shot_id },
      });
      expect(mockExtractionRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        yield_grams: 36.0,
        shot_time_seconds: 25,
        avg_pressure_bar: 9.0,
        water_temp_c: 93.0,
        preinfusion_seconds: 3,
        peak_pressure_bar: 9.5,
      });
      expect(mockExtractionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedExtraction);
    });

    it('should throw error when shot_id is missing', async () => {
      // Arrange
      const invalidData = {
        shot_id: '', // Empty string should trigger validation
        yield_grams: 36.0,
      };

      // Act & Assert
      await expect(shotExtractionService.createShotExtraction(invalidData)).rejects.toThrow(
        'Shot ID is required'
      );
    });

    it('should throw error when shot not found', async () => {
      // Arrange
      mockShotRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotExtractionService.createShotExtraction(mockExtractionData)).rejects.toThrow(
        `Shot with ID ${mockExtractionData.shot_id} not found`
      );
    });

    it('should handle numeric conversions', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const extractionDataWithStrings = {
        ...mockExtractionData,
        yield_grams: '36.0', // String that should be converted to number
        shot_time_seconds: '25', // String that should be converted to number
        avg_pressure_bar: '9.0', // String that should be converted to number
        water_temp_c: '93.0', // String that should be converted to number
        preinfusion_seconds: '3', // String that should be converted to number
        peak_pressure_bar: '9.5', // String that should be converted to number
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockExtractionRepository.create.mockReturnValue(extractionDataWithStrings);
      mockExtractionRepository.save.mockResolvedValue({ ...extractionDataWithStrings });

      // Act
      const result = await shotExtractionService.createShotExtraction(extractionDataWithStrings);

      // Assert
      expect(mockExtractionRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        yield_grams: 36.0, // Should be converted to number
        shot_time_seconds: 25, // Should be converted to number
        avg_pressure_bar: 9.0, // Should be converted to number
        water_temp_c: 93.0, // Should be converted to number
        preinfusion_seconds: 3, // Should be converted to number
        peak_pressure_bar: 9.5, // Should be converted to number
      });
      expect(result).toBeDefined();
    });

    it('should handle invalid numeric conversions', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const extractionDataWithInvalidNumbers = {
        ...mockExtractionData,
        yield_grams: 'invalid-number', // Invalid string that can't be parsed
        shot_time_seconds: 'invalid-number', // Invalid string that can't be parsed
        avg_pressure_bar: 'invalid-number', // Invalid string that can't be parsed
        water_temp_c: 'invalid-number', // Invalid string that can't be parsed
        preinfusion_seconds: 'invalid-number', // Invalid string that can't be parsed
        peak_pressure_bar: 'invalid-number', // Invalid string that can't be parsed
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockExtractionRepository.create.mockReturnValue(extractionDataWithInvalidNumbers);
      mockExtractionRepository.save.mockResolvedValue({ ...extractionDataWithInvalidNumbers });

      // Act
      const result = await shotExtractionService.createShotExtraction(
        extractionDataWithInvalidNumbers
      );

      // Assert
      expect(mockExtractionRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        yield_grams: null, // Should be converted to null
        shot_time_seconds: null, // Should be converted to null
        avg_pressure_bar: null, // Should be converted to null
        water_temp_c: null, // Should be converted to null
        preinfusion_seconds: null, // Should be converted to null
        peak_pressure_bar: null, // Should be converted to null
      });
      expect(result).toBeDefined();
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const error = new Error('Database error');
      mockShotRepository.findOne.mockResolvedValue(mockShotData);
      mockExtractionRepository.create.mockReturnValue(mockExtractionData);
      mockExtractionRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(shotExtractionService.createShotExtraction(mockExtractionData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('updateShotExtraction', () => {
    it('should update existing shot extraction', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingExtraction = {
        shot_id: shotId,
        yield_grams: 36.0,
        shot_time_seconds: 25,
        avg_pressure_bar: 9.0,
        water_temp_c: 93.0,
        preinfusion_seconds: 3,
        peak_pressure_bar: 9.5,
      };
      const updateData = {
        yield_grams: 35.5,
        shot_time_seconds: 24,
      };
      const updatedExtraction = { ...existingExtraction, ...updateData };

      mockExtractionRepository.findOne.mockResolvedValue(existingExtraction);
      mockExtractionRepository.save.mockResolvedValue(updatedExtraction);

      // Act
      const result = await shotExtractionService.updateShotExtraction(shotId, updateData);

      // Assert
      expect(mockExtractionRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
      });
      expect(mockExtractionRepository.save).toHaveBeenCalledWith(updatedExtraction);
      expect(result).toEqual(updatedExtraction);
    });

    it('should throw error when shot extraction not found for update', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      const updateData = { yield_grams: 35.5 };
      mockExtractionRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotExtractionService.updateShotExtraction(shotId, updateData)).rejects.toThrow(
        `Shot extraction with ID ${shotId} not found`
      );
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingExtraction = {
        shot_id: shotId,
        yield_grams: 36.0,
        shot_time_seconds: 25,
        avg_pressure_bar: 9.0,
        water_temp_c: 93.0,
        preinfusion_seconds: 3,
        peak_pressure_bar: 9.5,
      };
      const partialUpdate = { yield_grams: 35.5 }; // Only updating yield
      const updatedExtraction = { ...existingExtraction, yield_grams: 35.5 };

      mockExtractionRepository.findOne.mockResolvedValue(existingExtraction);
      mockExtractionRepository.save.mockResolvedValue(updatedExtraction);

      // Act
      const result = await shotExtractionService.updateShotExtraction(shotId, partialUpdate);

      // Assert
      expect(result.yield_grams).toBe(35.5);
      expect(result.shot_time_seconds).toBe(25); // Should remain unchanged
      expect(result.avg_pressure_bar).toBe(9.0); // Should remain unchanged
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const updateData = { yield_grams: 35.5 };
      const error = new Error('Database error');
      mockExtractionRepository.findOne.mockResolvedValue({ shot_id: shotId });
      mockExtractionRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(shotExtractionService.updateShotExtraction(shotId, updateData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('deleteShotExtraction', () => {
    it('should delete existing shot extraction', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingExtraction = {
        shot_id: shotId,
        yield_grams: 36.0,
        shot_time_seconds: 25,
        shot: mockShotData,
      };
      mockExtractionRepository.findOne.mockResolvedValue(existingExtraction);
      mockExtractionRepository.remove.mockResolvedValue(existingExtraction);

      // Act
      const result = await shotExtractionService.deleteShotExtraction(shotId);

      // Assert
      expect(mockExtractionRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
      });
      expect(mockExtractionRepository.remove).toHaveBeenCalledWith(existingExtraction);
      expect(result).toBe(true);
    });

    it('should throw error when shot extraction not found for deletion', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      mockExtractionRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotExtractionService.deleteShotExtraction(shotId)).rejects.toThrow(
        `Shot extraction with ID ${shotId} not found`
      );
    });

    it('should handle repository errors during deletion', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const error = new Error('Database error');
      mockExtractionRepository.findOne.mockResolvedValue({ shot_id: shotId });
      mockExtractionRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(shotExtractionService.deleteShotExtraction(shotId)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
