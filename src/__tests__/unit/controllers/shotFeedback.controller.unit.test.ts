import { Request, Response } from 'express';
import { ShotFeedbackController } from '../../../controllers/shotFeedback.controller';
import { ShotFeedbackService } from '../../../services/ShotFeedbackService';

// Mock ShotFeedbackService
jest.mock('../../../services/ShotFeedbackService');

describe('ShotFeedbackController', () => {
  let shotFeedbackController: ShotFeedbackController;
  let mockShotFeedbackService: jest.Mocked<ShotFeedbackService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockShotFeedbackService = {
      getAllShotFeedbacks: jest.fn(),
      getShotFeedbackById: jest.fn(),
      createShotFeedback: jest.fn(),
      updateShotFeedback: jest.fn(),
      deleteShotFeedback: jest.fn(),
    } as any;

    // Mock the constructor to return our mock service
    (ShotFeedbackService as jest.Mock).mockImplementation(() => mockShotFeedbackService);

    // Initialize controller
    shotFeedbackController = new ShotFeedbackController();

    // Setup mock request
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('all', () => {
    it('should return all shot feedbacks', async () => {
      // Arrange
      const mockFeedbacks = [
        { shot_id: '1', overall_score: 8, shot: { id: 'shot-1' } } as any,
        { shot_id: '2', overall_score: 7, shot: { id: 'shot-2' } } as any,
      ];

      mockShotFeedbackService.getAllShotFeedbacks.mockResolvedValue(mockFeedbacks);

      // Act
      await shotFeedbackController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotFeedbackService.getAllShotFeedbacks).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockFeedbacks);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockShotFeedbackService.getAllShotFeedbacks.mockRejectedValue(error);

      // Act
      await shotFeedbackController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching shot feedbacks' });
    });
  });

  describe('one', () => {
    it('should return shot feedback when found', async () => {
      // Arrange
      const mockFeedback = { shot_id: '1', overall_score: 8, shot: { id: 'shot-1' } } as any;
      mockRequest.params = { id: '1' };
      mockShotFeedbackService.getShotFeedbackById.mockResolvedValue(mockFeedback);

      // Act
      await shotFeedbackController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotFeedbackService.getShotFeedbackById).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith(mockFeedback);
    });

    it('should return 404 when shot feedback not found', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockShotFeedbackService.getShotFeedbackById.mockResolvedValue(null as any);

      // Act
      await shotFeedbackController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Shot feedback not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Database error');
      mockShotFeedbackService.getShotFeedbackById.mockRejectedValue(error);

      // Act
      await shotFeedbackController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching shot feedback' });
    });
  });

  describe('save', () => {
    it('should create shot feedback successfully', async () => {
      // Arrange
      const feedbackData = {
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'balanced',
        notes: 'Good shot',
      };

      mockRequest.body = feedbackData;
      const createdFeedback = { id: '1', ...feedbackData } as any;
      mockShotFeedbackService.createShotFeedback.mockResolvedValue(createdFeedback);

      // Act
      await shotFeedbackController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotFeedbackService.createShotFeedback).toHaveBeenCalledWith(feedbackData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdFeedback);
    });

    it('should handle null values correctly', async () => {
      // Arrange
      const feedbackData = { overall_score: null, acidity: null };

      mockRequest.body = feedbackData;
      const createdFeedback = { id: '1', ...feedbackData } as any;
      mockShotFeedbackService.createShotFeedback.mockResolvedValue(createdFeedback);

      // Act
      await shotFeedbackController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotFeedbackService.createShotFeedback).toHaveBeenCalledWith(feedbackData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdFeedback);
    });

    it('should handle numeric conversions', async () => {
      // Arrange
      const feedbackData = {
        overall_score: '9',
        acidity: '8',
        sweetness: '7',
        bitterness: '6',
        body: '8',
      };

      mockRequest.body = feedbackData;
      const createdFeedback = { id: '1', ...feedbackData } as any;
      mockShotFeedbackService.createShotFeedback.mockResolvedValue(createdFeedback);

      // Act
      await shotFeedbackController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotFeedbackService.createShotFeedback).toHaveBeenCalledWith(feedbackData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdFeedback);
    });

    it('should handle service errors', async () => {
      // Arrange
      const feedbackData = { overall_score: 8 };
      mockRequest.body = feedbackData;
      const error = new Error('Validation failed');
      mockShotFeedbackService.createShotFeedback.mockRejectedValue(error);

      // Act
      await shotFeedbackController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating shot feedback' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const feedbackData = { overall_score: 8 };
      mockRequest.body = feedbackData;
      const error = new Error();
      mockShotFeedbackService.createShotFeedback.mockRejectedValue(error);

      // Act
      await shotFeedbackController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating shot feedback' });
    });
  });

  describe('update', () => {
    it('should update shot feedback successfully', async () => {
      // Arrange
      const updateData = {
        overall_score: 9,
        acidity: 8,
        sweetness: 7,
        bitterness: 6,
        body: 8,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedFeedback = { id: '1', ...updateData } as any;
      mockShotFeedbackService.updateShotFeedback.mockResolvedValue(updatedFeedback);

      // Act
      await shotFeedbackController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotFeedbackService.updateShotFeedback).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedFeedback);
    });

    it('should handle service errors', async () => {
      // Arrange
      const updateData = { overall_score: 9 };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error('Update failed');
      mockShotFeedbackService.updateShotFeedback.mockRejectedValue(error);

      // Act
      await shotFeedbackController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating shot feedback' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const updateData = { overall_score: 9 };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error();
      mockShotFeedbackService.updateShotFeedback.mockRejectedValue(error);

      // Act
      await shotFeedbackController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating shot feedback' });
    });
  });

  describe('remove', () => {
    it('should delete shot feedback successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockShotFeedbackService.deleteShotFeedback.mockResolvedValue(true);

      // Act
      await shotFeedbackController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotFeedbackService.deleteShotFeedback).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 404 when shot feedback not found', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      mockShotFeedbackService.deleteShotFeedback.mockResolvedValue(false);

      // Act
      await shotFeedbackController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotFeedbackService.deleteShotFeedback).toHaveBeenCalledWith('non-existent');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Delete failed');
      mockShotFeedbackService.deleteShotFeedback.mockRejectedValue(error);

      // Act
      await shotFeedbackController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error deleting shot feedback' });
    });
  });
});
