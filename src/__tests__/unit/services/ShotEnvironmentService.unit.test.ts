import { ShotEnvironmentService } from '../../../services/ShotEnvironmentService';
import { ShotEnvironment } from '../../../entities/shotEnvironment';
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

const mockEnvironmentData = {
  shot_id: '550e8400-e29b-41d4-a716-446655440002',
  ambient_temp_c: 22.5,
  humidity_percent: 65,
  water_source: 'Filtered',
  estimated_water_hardness_ppm: 150,
  machine_warmup_minutes: 10,
  shots_since_clean: 5,
};

describe('ShotEnvironmentService', () => {
  let shotEnvironmentService: ShotEnvironmentService;
  let mockDataSource: DataSource;
  let mockEnvironmentRepository: any;
  let mockShotRepository: any;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    
    // Setup mock repositories
    mockEnvironmentRepository = {
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
    
    mockDataSource.getRepository = jest.fn().mockImplementation((entity) => {
      if (entity === ShotEnvironment) return mockEnvironmentRepository;
      if (entity === Shot) return mockShotRepository;
      return mockEnvironmentRepository;
    });
    
    shotEnvironmentService = new ShotEnvironmentService(mockDataSource);
  });

  describe('getAllShotEnvironments', () => {
    it('should return all shot environments with relations', async () => {
      // Arrange
      const expectedEnvironments = [
        { 
          shot_id: '1',
          ambient_temp_c: 22.5,
          humidity_percent: 65,
          shot: mockShotData,
        },
        { 
          shot_id: '2',
          ambient_temp_c: 23.0,
          humidity_percent: 60,
          shot: mockShotData,
        },
      ];
      mockEnvironmentRepository.find.mockResolvedValue(expectedEnvironments);

      // Act
      const result = await shotEnvironmentService.getAllShotEnvironments();

      // Assert
      expect(mockEnvironmentRepository.find).toHaveBeenCalledWith({
        relations: ['shot'],
      });
      expect(result).toEqual(expectedEnvironments);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockEnvironmentRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(shotEnvironmentService.getAllShotEnvironments()).rejects.toThrow('Database error');
    });
  });

  describe('getShotEnvironmentById', () => {
    it('should return shot environment by ID with relations', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const expectedEnvironment = { 
        shot_id: shotId,
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        shot: mockShotData,
      };
      mockEnvironmentRepository.findOne.mockResolvedValue(expectedEnvironment);

      // Act
      const result = await shotEnvironmentService.getShotEnvironmentById(shotId);

      // Assert
      expect(mockEnvironmentRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
        relations: ['shot'],
      });
      expect(result).toEqual(expectedEnvironment);
    });

    it('should throw error when shot environment not found', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      mockEnvironmentRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotEnvironmentService.getShotEnvironmentById(shotId)).rejects.toThrow(
        `Shot environment with ID ${shotId} not found`
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const error = new Error('Database error');
      mockEnvironmentRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(shotEnvironmentService.getShotEnvironmentById(shotId)).rejects.toThrow('Database error');
    });
  });

  describe('createShotEnvironment', () => {
    it('should create shot environment with valid data', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const expectedEnvironment = { 
        shot_id: mockShotData.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        shot: mockShot
      };
      
      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockEnvironmentRepository.create.mockReturnValue(mockEnvironmentData);
      mockEnvironmentRepository.save.mockResolvedValue(expectedEnvironment);

      // Act
      const result = await shotEnvironmentService.createShotEnvironment(mockEnvironmentData);

      // Assert
      expect(mockShotRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEnvironmentData.shot_id },
      });
      expect(mockEnvironmentRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'Filtered',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      });
      expect(mockEnvironmentRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedEnvironment);
    });

    it('should throw error when shot_id is missing', async () => {
      // Arrange
      const invalidData = {
        shot_id: '', // Empty string should trigger validation
        ambient_temp_c: 22.5,
      };

      // Act & Assert
      await expect(shotEnvironmentService.createShotEnvironment(invalidData)).rejects.toThrow(
        'Shot ID is required'
      );
    });

    it('should throw error when shot not found', async () => {
      // Arrange
      mockShotRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotEnvironmentService.createShotEnvironment(mockEnvironmentData)).rejects.toThrow(
        `Shot with ID ${mockEnvironmentData.shot_id} not found`
      );
    });

    it('should handle numeric conversions', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const environmentDataWithStrings = {
        ...mockEnvironmentData,
        ambient_temp_c: '22.5', // String that should be converted to number
        humidity_percent: '65', // String that should be converted to number
        estimated_water_hardness_ppm: '150', // String that should be converted to number
        machine_warmup_minutes: '10', // String that should be converted to number
        shots_since_clean: '5', // String that should be converted to number
      };
      
      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockEnvironmentRepository.create.mockReturnValue(environmentDataWithStrings);
      mockEnvironmentRepository.save.mockResolvedValue({ 
        shot_id: mockShotData.id,
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'Filtered',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      });

      // Act
      const result = await shotEnvironmentService.createShotEnvironment(environmentDataWithStrings);

      // Assert
      expect(mockEnvironmentRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        ambient_temp_c: 22.5, // Should be converted to number
        humidity_percent: 65, // Should be converted to number
        water_source: 'Filtered',
        estimated_water_hardness_ppm: 150, // Should be converted to number
        machine_warmup_minutes: 10, // Should be converted to number
        shots_since_clean: 5, // Should be converted to number
      });
      expect(result).toBeDefined();
    });

    it('should handle invalid numeric conversions', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const environmentDataWithInvalidNumbers = {
        ...mockEnvironmentData,
        ambient_temp_c: 'invalid-number', // Invalid string that can't be parsed
        humidity_percent: 'invalid-number', // Invalid string that can't be parsed
        estimated_water_hardness_ppm: 'invalid-number', // Invalid string that can't be parsed
        machine_warmup_minutes: 'invalid-number', // Invalid string that can't be parsed
        shots_since_clean: 'invalid-number', // Invalid string that can't be parsed
      };
      
      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockEnvironmentRepository.create.mockReturnValue(environmentDataWithInvalidNumbers);
      mockEnvironmentRepository.save.mockResolvedValue({ 
        shot_id: mockShotData.id,
        ambient_temp_c: null,
        humidity_percent: null,
        water_source: 'Filtered',
        estimated_water_hardness_ppm: null,
        machine_warmup_minutes: null,
        shots_since_clean: null,
      });

      // Act
      const result = await shotEnvironmentService.createShotEnvironment(environmentDataWithInvalidNumbers);

      // Assert
      expect(mockEnvironmentRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        ambient_temp_c: null, // Should be converted to null
        humidity_percent: null, // Should be converted to null
        water_source: 'Filtered',
        estimated_water_hardness_ppm: null, // Should be converted to null
        machine_warmup_minutes: null, // Should be converted to null
        shots_since_clean: null, // Should be converted to null
      });
      expect(result).toBeDefined();
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const error = new Error('Database error');
      mockShotRepository.findOne.mockResolvedValue(mockShotData);
      mockEnvironmentRepository.create.mockReturnValue(mockEnvironmentData);
      mockEnvironmentRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(shotEnvironmentService.createShotEnvironment(mockEnvironmentData)).rejects.toThrow('Database error');
    });
  });

  describe('updateShotEnvironment', () => {
    it('should update existing shot environment', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingEnvironment = {
        shot_id: shotId,
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'Filtered',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      };
      const updateData = {
        ambient_temp_c: 23.0,
        humidity_percent: 70,
      };
      const updatedEnvironment = { ...existingEnvironment, ...updateData };
      
      mockEnvironmentRepository.findOne.mockResolvedValue(existingEnvironment);
      mockEnvironmentRepository.save.mockResolvedValue(updatedEnvironment);

      // Act
      const result = await shotEnvironmentService.updateShotEnvironment(shotId, updateData);

      // Assert
      expect(mockEnvironmentRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
      });
      expect(mockEnvironmentRepository.save).toHaveBeenCalledWith(updatedEnvironment);
      expect(result).toEqual(updatedEnvironment);
    });

    it('should throw error when shot environment not found for update', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      const updateData = { ambient_temp_c: 23.0 };
      mockEnvironmentRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotEnvironmentService.updateShotEnvironment(shotId, updateData)).rejects.toThrow(
        `Shot environment with ID ${shotId} not found`
      );
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingEnvironment = {
        shot_id: shotId,
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'Filtered',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      };
      const partialUpdate = { ambient_temp_c: 23.0 }; // Only updating temperature
      const updatedEnvironment = { ...existingEnvironment, ambient_temp_c: 23.0 };
      
      mockEnvironmentRepository.findOne.mockResolvedValue(existingEnvironment);
      mockEnvironmentRepository.save.mockResolvedValue(updatedEnvironment);

      // Act
      const result = await shotEnvironmentService.updateShotEnvironment(shotId, partialUpdate);

      // Assert
      expect(result.ambient_temp_c).toBe(23.0);
      expect(result.humidity_percent).toBe(65); // Should remain unchanged
      expect(result.water_source).toBe('Filtered'); // Should remain unchanged
    });

    it('should handle numeric conversions in update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingEnvironment = {
        shot_id: shotId,
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'Filtered',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      };
      const updateData = { ambient_temp_c: '23.0' }; // String that should be converted
      const updatedEnvironment = { 
        ...existingEnvironment, 
        ambient_temp_c: 23.0
      };
      
      mockEnvironmentRepository.findOne.mockResolvedValue(existingEnvironment);
      mockEnvironmentRepository.save.mockResolvedValue(updatedEnvironment);

      // Act
      const result = await shotEnvironmentService.updateShotEnvironment(shotId, updateData);

      // Assert
      expect(result.ambient_temp_c).toBe(23.0);
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const updateData = { ambient_temp_c: 23.0 };
      const error = new Error('Database error');
      mockEnvironmentRepository.findOne.mockResolvedValue({ shot_id: shotId });
      mockEnvironmentRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(shotEnvironmentService.updateShotEnvironment(shotId, updateData)).rejects.toThrow('Database error');
    });
  });

  describe('deleteShotEnvironment', () => {
    it('should delete existing shot environment', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingEnvironment = { 
        shot_id: shotId,
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        shot: mockShotData
      };
      mockEnvironmentRepository.findOne.mockResolvedValue(existingEnvironment);
      mockEnvironmentRepository.remove.mockResolvedValue(existingEnvironment);

      // Act
      const result = await shotEnvironmentService.deleteShotEnvironment(shotId);

      // Assert
      expect(mockEnvironmentRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
      });
      expect(mockEnvironmentRepository.remove).toHaveBeenCalledWith(existingEnvironment);
      expect(result).toBe(true);
    });

    it('should throw error when shot environment not found for deletion', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      mockEnvironmentRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotEnvironmentService.deleteShotEnvironment(shotId)).rejects.toThrow(
        `Shot environment with ID ${shotId} not found`
      );
    });

    it('should handle repository errors during deletion', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const error = new Error('Database error');
      mockEnvironmentRepository.findOne.mockResolvedValue({ shot_id: shotId });
      mockEnvironmentRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(shotEnvironmentService.deleteShotEnvironment(shotId)).rejects.toThrow('Database error');
    });
  });

  describe('getShotEnvironmentsByTemperature', () => {
    it('should return environments filtered by temperature range', async () => {
      // Arrange
      const minTemp = 20.0;
      const maxTemp = 25.0;
      const expectedEnvironments = [
        { 
          shot_id: '1', 
          ambient_temp_c: 22.5,
          humidity_percent: 65,
          shot: mockShotData,
        },
        { 
          shot_id: '2', 
          ambient_temp_c: 23.0,
          humidity_percent: 60,
          shot: mockShotData,
        },
      ];
      mockEnvironmentRepository.find.mockResolvedValue(expectedEnvironments);

      // Act
      const result = await shotEnvironmentService.getShotEnvironmentsByTemperature(minTemp, maxTemp);

      // Assert
      expect(mockEnvironmentRepository.find).toHaveBeenCalledWith({
        where: {
          ambient_temp_c: expect.objectContaining({
            _type: 'between',
            _value: [minTemp, maxTemp]
          })
        },
        relations: ['shot'],
      });
      expect(result).toEqual(expectedEnvironments);
    });

    it('should handle repository errors when fetching by temperature', async () => {
      // Arrange
      const minTemp = 20.0;
      const maxTemp = 25.0;
      const error = new Error('Database error');
      mockEnvironmentRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(shotEnvironmentService.getShotEnvironmentsByTemperature(minTemp, maxTemp)).rejects.toThrow('Database error');
    });
  });
});
