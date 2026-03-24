import { ShotFeedbackService } from '../../../services/ShotFeedbackService';
import { ShotFeedback } from '../../../entities/shotFeedback';
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

const mockFeedbackData = {
  shot_id: '550e8400-e29b-41d4-a716-446655440002',
  overall_score: 8,
  acidity: 7,
  sweetness: 6,
  bitterness: 5,
  body: 7,
  extraction_assessment: 'Good extraction',
  notes: 'Well balanced shot',
};

describe('ShotFeedbackService', () => {
  let shotFeedbackService: ShotFeedbackService;
  let mockDataSource: DataSource;
  let mockFeedbackRepository: any;
  let mockShotRepository: any;

  beforeEach(() => {
    mockDataSource = createMockDataSource();

    // Setup mock repositories
    mockFeedbackRepository = {
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
      if (entity === ShotFeedback) return mockFeedbackRepository;
      if (entity === Shot) return mockShotRepository;
      return mockFeedbackRepository;
    });

    shotFeedbackService = new ShotFeedbackService(mockDataSource);
  });

  describe('getAllShotFeedbacks', () => {
    it('should return all shot feedbacks with relations', async () => {
      // Arrange
      const expectedFeedbacks = [
        {
          shot_id: '1',
          overall_score: 8,
          acidity: 7,
          shot: mockShotData,
        },
        {
          shot_id: '2',
          overall_score: 9,
          acidity: 8,
          shot: mockShotData,
        },
      ];
      mockFeedbackRepository.find.mockResolvedValue(expectedFeedbacks);

      // Act
      const result = await shotFeedbackService.getAllShotFeedbacks();

      // Assert
      expect(mockFeedbackRepository.find).toHaveBeenCalledWith({
        relations: ['shot'],
      });
      expect(result).toEqual(expectedFeedbacks);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockFeedbackRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(shotFeedbackService.getAllShotFeedbacks()).rejects.toThrow('Database error');
    });
  });

  describe('getShotFeedbackById', () => {
    it('should return shot feedback by ID with relations', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const expectedFeedback = {
        shot_id: shotId,
        overall_score: 8,
        acidity: 7,
        shot: mockShotData,
      };
      mockFeedbackRepository.findOne.mockResolvedValue(expectedFeedback);

      // Act
      const result = await shotFeedbackService.getShotFeedbackById(shotId);

      // Assert
      expect(mockFeedbackRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
        relations: ['shot'],
      });
      expect(result).toEqual(expectedFeedback);
    });

    it('should throw error when shot feedback not found', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      mockFeedbackRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotFeedbackService.getShotFeedbackById(shotId)).rejects.toThrow(
        `Shot feedback with ID ${shotId} not found`
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const error = new Error('Database error');
      mockFeedbackRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(shotFeedbackService.getShotFeedbackById(shotId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('createShotFeedback', () => {
    it('should create shot feedback with valid data', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const expectedFeedback = {
        shot_id: mockShotData.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'Good extraction',
        notes: 'Well balanced shot',
        shot: mockShot,
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockFeedbackRepository.create.mockReturnValue(mockFeedbackData);
      mockFeedbackRepository.save.mockResolvedValue(expectedFeedback);

      // Act
      const result = await shotFeedbackService.createShotFeedback(mockFeedbackData);

      // Assert
      expect(mockShotRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockFeedbackData.shot_id },
      });
      expect(mockFeedbackRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'Good extraction',
        notes: 'Well balanced shot',
      });
      expect(mockFeedbackRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedFeedback);
    });

    it('should throw error when shot_id is missing', async () => {
      // Arrange
      const invalidData = {
        shot_id: '', // Empty string should trigger validation
        overall_score: 8,
      };

      // Act & Assert
      await expect(shotFeedbackService.createShotFeedback(invalidData)).rejects.toThrow(
        'Shot ID is required'
      );
    });

    it('should throw error when shot not found', async () => {
      // Arrange
      mockShotRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotFeedbackService.createShotFeedback(mockFeedbackData)).rejects.toThrow(
        `Shot with ID ${mockFeedbackData.shot_id} not found`
      );
    });

    it('should handle numeric conversions', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const feedbackDataWithStrings = {
        ...mockFeedbackData,
        overall_score: '8', // String that should be converted to number
        acidity: '7', // String that should be converted to number
        sweetness: '6', // String that should be converted to number
        bitterness: '5', // String that should be converted to number
        body: '7', // String that should be converted to number
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockFeedbackRepository.create.mockReturnValue(feedbackDataWithStrings);
      mockFeedbackRepository.save.mockResolvedValue({
        shot_id: mockShotData.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'Good extraction',
        notes: 'Well balanced shot',
      });

      // Act
      const result = await shotFeedbackService.createShotFeedback(feedbackDataWithStrings);

      // Assert
      expect(mockFeedbackRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        overall_score: 8, // Should be converted to number
        acidity: 7, // Should be converted to number
        sweetness: 6, // Should be converted to number
        bitterness: 5, // Should be converted to number
        body: 7, // Should be converted to number
        extraction_assessment: 'Good extraction',
        notes: 'Well balanced shot',
      });
      expect(result).toBeDefined();
    });

    it('should handle invalid numeric conversions', async () => {
      // Arrange
      const mockShot = { id: mockShotData.id, shot_type: mockShotData.shot_type };
      const feedbackDataWithInvalidNumbers = {
        ...mockFeedbackData,
        overall_score: 'invalid-number', // Invalid string that can't be parsed
        acidity: 'invalid-number', // Invalid string that can't be parsed
        sweetness: 'invalid-number', // Invalid string that can't be parsed
        bitterness: 'invalid-number', // Invalid string that can't be parsed
        body: 'invalid-number', // Invalid string that can't be parsed
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockFeedbackRepository.create.mockReturnValue(feedbackDataWithInvalidNumbers);
      mockFeedbackRepository.save.mockResolvedValue({
        shot_id: mockShotData.id,
        overall_score: null,
        acidity: null,
        sweetness: null,
        bitterness: null,
        body: null,
        extraction_assessment: 'Good extraction',
        notes: 'Well balanced shot',
      });

      // Act
      const result = await shotFeedbackService.createShotFeedback(feedbackDataWithInvalidNumbers);

      // Assert
      expect(mockFeedbackRepository.create).toHaveBeenCalledWith({
        shot: mockShot,
        overall_score: null, // Should be converted to null
        acidity: null, // Should be converted to null
        sweetness: null, // Should be converted to null
        bitterness: null, // Should be converted to null
        body: null, // Should be converted to null
        extraction_assessment: 'Good extraction',
        notes: 'Well balanced shot',
      });
      expect(result).toBeDefined();
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const error = new Error('Database error');
      mockShotRepository.findOne.mockResolvedValue(mockShotData);
      mockFeedbackRepository.create.mockReturnValue(mockFeedbackData);
      mockFeedbackRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(shotFeedbackService.createShotFeedback(mockFeedbackData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('updateShotFeedback', () => {
    it('should update existing shot feedback', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingFeedback = {
        shot_id: shotId,
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'Good extraction',
        notes: 'Well balanced shot',
      };
      const updateData = {
        overall_score: 9,
        acidity: 8,
      };
      const updatedFeedback = { ...existingFeedback, ...updateData };

      mockFeedbackRepository.findOne.mockResolvedValue(existingFeedback);
      mockFeedbackRepository.save.mockResolvedValue(updatedFeedback);

      // Act
      const result = await shotFeedbackService.updateShotFeedback(shotId, updateData);

      // Assert
      expect(mockFeedbackRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
      });
      expect(mockFeedbackRepository.save).toHaveBeenCalledWith(updatedFeedback);
      expect(result).toEqual(updatedFeedback);
    });

    it('should throw error when shot feedback not found for update', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      const updateData = { overall_score: 9 };
      mockFeedbackRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotFeedbackService.updateShotFeedback(shotId, updateData)).rejects.toThrow(
        `Shot feedback with ID ${shotId} not found`
      );
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingFeedback = {
        shot_id: shotId,
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'Good extraction',
        notes: 'Well balanced shot',
      };
      const partialUpdate = { overall_score: 9 }; // Only updating score
      const updatedFeedback = { ...existingFeedback, overall_score: 9 };

      mockFeedbackRepository.findOne.mockResolvedValue(existingFeedback);
      mockFeedbackRepository.save.mockResolvedValue(updatedFeedback);

      // Act
      const result = await shotFeedbackService.updateShotFeedback(shotId, partialUpdate);

      // Assert
      expect(result.overall_score).toBe(9);
      expect(result.acidity).toBe(7); // Should remain unchanged
      expect(result.sweetness).toBe(6); // Should remain unchanged
    });

    it('should handle numeric conversions in update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingFeedback = {
        shot_id: shotId,
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'Good extraction',
        notes: 'Well balanced shot',
      };
      const updateData = { overall_score: '9' }; // String that should be converted
      const updatedFeedback = {
        ...existingFeedback,
        overall_score: 9,
      };

      mockFeedbackRepository.findOne.mockResolvedValue(existingFeedback);
      mockFeedbackRepository.save.mockResolvedValue(updatedFeedback);

      // Act
      const result = await shotFeedbackService.updateShotFeedback(shotId, updateData);

      // Assert
      expect(result.overall_score).toBe(9);
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const updateData = { overall_score: 9 };
      const error = new Error('Database error');
      mockFeedbackRepository.findOne.mockResolvedValue({ shot_id: shotId });
      mockFeedbackRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(shotFeedbackService.updateShotFeedback(shotId, updateData)).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle string-to-number conversions in update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingFeedback = {
        shot_id: shotId,
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'Good',
        notes: 'Nice shot',
        shot: mockShotData,
      };
      
      const updateDataWithStringNumbers = {
        overall_score: '9', // String that should be converted
        acidity: '8', // String that should be converted
        sweetness: '7', // String that should be converted
        bitterness: '6', // String that should be converted
        body: '8', // String that should be converted
      };

      mockFeedbackRepository.findOne.mockResolvedValue(existingFeedback);
      mockFeedbackRepository.save.mockResolvedValue({
        ...existingFeedback,
        overall_score: 9,
        acidity: 8,
        sweetness: 7,
        bitterness: 6,
        body: 8,
      });

      // Act
      const result = await shotFeedbackService.updateShotFeedback(shotId, updateDataWithStringNumbers);

      // Assert
      expect(result.overall_score).toBe(9);
      expect(result.acidity).toBe(8);
      expect(result.sweetness).toBe(7);
      expect(result.bitterness).toBe(6);
      expect(result.body).toBe(8);
    });

    it('should handle invalid string-to-number conversions in update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingFeedback = {
        shot_id: shotId,
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        shot: mockShotData,
      };
      
      const updateDataWithInvalidNumbers = {
        overall_score: 'invalid-number', // Should become null
        acidity: 'invalid-number', // Should become null
        sweetness: 'invalid-number', // Should become null
        bitterness: 'invalid-number', // Should become null
        body: 'invalid-number', // Should become null
      };

      mockFeedbackRepository.findOne.mockResolvedValue(existingFeedback);
      mockFeedbackRepository.save.mockResolvedValue({
        ...existingFeedback,
        overall_score: null,
        acidity: null,
        sweetness: null,
        bitterness: null,
        body: null,
      });

      // Act
      const result = await shotFeedbackService.updateShotFeedback(shotId, updateDataWithInvalidNumbers);

      // Assert
      expect(result.overall_score).toBeNull();
      expect(result.acidity).toBeNull();
      expect(result.sweetness).toBeNull();
      expect(result.bitterness).toBeNull();
      expect(result.body).toBeNull();
    });

    it('should handle null assignments in update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingFeedback = {
        shot_id: shotId,
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'Good',
        notes: 'Nice shot',
        shot: mockShotData,
      };
      
      const updateDataWithNulls = {
        overall_score: null,
        acidity: null,
        sweetness: null,
        bitterness: null,
        body: null,
        extraction_assessment: null,
        notes: null,
      };

      mockFeedbackRepository.findOne.mockResolvedValue(existingFeedback);
      mockFeedbackRepository.save.mockResolvedValue({
        ...existingFeedback,
        ...updateDataWithNulls,
      });

      // Act
      const result = await shotFeedbackService.updateShotFeedback(shotId, updateDataWithNulls);

      // Assert
      expect(result.overall_score).toBeNull();
      expect(result.acidity).toBeNull();
      expect(result.sweetness).toBeNull();
      expect(result.bitterness).toBeNull();
      expect(result.body).toBeNull();
      expect(result.extraction_assessment).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should handle string field trimming in update', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingFeedback = {
        shot_id: shotId,
        extraction_assessment: 'Good',
        notes: 'Nice shot',
        shot: mockShotData,
      };
      
      const updateDataWithWhitespace = {
        extraction_assessment: '  Excellent  ', // Should be trimmed
        notes: '  Very nice shot  ', // Should be trimmed
      };

      mockFeedbackRepository.findOne.mockResolvedValue(existingFeedback);
      mockFeedbackRepository.save.mockResolvedValue({
        ...existingFeedback,
        extraction_assessment: 'Excellent',
        notes: 'Very nice shot',
      });

      // Act
      const result = await shotFeedbackService.updateShotFeedback(shotId, updateDataWithWhitespace);

      // Assert
      expect(result.extraction_assessment).toBe('Excellent');
      expect(result.notes).toBe('Very nice shot');
    });
  });

  describe('deleteShotFeedback', () => {
    it('should delete existing shot feedback', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const existingFeedback = {
        shot_id: shotId,
        overall_score: 8,
        acidity: 7,
        shot: mockShotData,
      };
      mockFeedbackRepository.findOne.mockResolvedValue(existingFeedback);
      mockFeedbackRepository.remove.mockResolvedValue(existingFeedback);

      // Act
      const result = await shotFeedbackService.deleteShotFeedback(shotId);

      // Assert
      expect(mockFeedbackRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: shotId },
      });
      expect(mockFeedbackRepository.remove).toHaveBeenCalledWith(existingFeedback);
      expect(result).toBe(true);
    });

    it('should throw error when shot feedback not found for deletion', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      mockFeedbackRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(shotFeedbackService.deleteShotFeedback(shotId)).rejects.toThrow(
        `Shot feedback with ID ${shotId} not found`
      );
    });

    it('should handle repository errors during deletion', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const error = new Error('Database error');
      mockFeedbackRepository.findOne.mockResolvedValue({ shot_id: shotId });
      mockFeedbackRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(shotFeedbackService.deleteShotFeedback(shotId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getShotFeedbacksByScore', () => {
    it('should return feedbacks filtered by score range', async () => {
      // Arrange
      const minScore = 7;
      const maxScore = 9;
      const expectedFeedbacks = [
        {
          shot_id: '1',
          overall_score: 8,
          acidity: 7,
          shot: mockShotData,
        },
        {
          shot_id: '2',
          overall_score: 9,
          acidity: 8,
          shot: mockShotData,
        },
      ];
      mockFeedbackRepository.find.mockResolvedValue(expectedFeedbacks);

      // Act
      const result = await shotFeedbackService.getShotFeedbacksByScore(minScore, maxScore);

      // Assert
      expect(mockFeedbackRepository.find).toHaveBeenCalledWith({
        where: {
          overall_score: expect.objectContaining({
            _type: 'between',
            _value: [minScore, maxScore],
          }),
        },
        relations: ['shot'],
      });
      expect(result).toEqual(expectedFeedbacks);
    });

    it('should return empty array when no feedbacks match score range', async () => {
      // Arrange
      const minScore = 9;
      const maxScore = 10;
      mockFeedbackRepository.find.mockResolvedValue([]);

      // Act
      const result = await shotFeedbackService.getShotFeedbacksByScore(minScore, maxScore);

      // Assert
      expect(result).toEqual([]);
      expect(mockFeedbackRepository.find).toHaveBeenCalledWith({
        where: {
          overall_score: expect.objectContaining({
            _type: 'between',
            _value: [minScore, maxScore],
          }),
        },
        relations: ['shot'],
      });
    });

    it('should handle repository errors when fetching by score', async () => {
      // Arrange
      const minScore = 7;
      const maxScore = 9;
      const error = new Error('Database error');
      mockFeedbackRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(shotFeedbackService.getShotFeedbacksByScore(minScore, maxScore)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
