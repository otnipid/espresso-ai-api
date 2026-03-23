import { Request, Response } from 'express';
import { ShotPreparationController } from '../../../controllers/shotPreparation.controller';
import { ShotPreparationService } from '../../../services/ShotPreparationService';

// Mock ShotPreparationService
jest.mock('../../../services/ShotPreparationService');

describe('ShotPreparationController', () => {
  let shotPreparationController: ShotPreparationController;
  let mockShotPreparationService: jest.Mocked<ShotPreparationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockShotPreparationService = {
      getAllShotPreparations: jest.fn(),
      getShotPreparationById: jest.fn(),
      createShotPreparation: jest.fn(),
      updateShotPreparation: jest.fn(),
      deleteShotPreparation: jest.fn(),
    } as any;

    // Mock constructor to return our mock service
    (ShotPreparationService as jest.Mock).mockImplementation(() => mockShotPreparationService);

    // Initialize controller
    shotPreparationController = new ShotPreparationController();

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
    it('should return all shot preparations', async () => {
      // Arrange
      const mockPreparations = [
        { shot_id: '1', dose_grams: 18.5, shot: { id: '1' } } as any,
        { shot_id: '2', dose_grams: 19.0, shot: { id: '2' } } as any,
      ];

      mockShotPreparationService.getAllShotPreparations.mockResolvedValue(mockPreparations);

      // Act
      await shotPreparationController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotPreparationService.getAllShotPreparations).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockPreparations);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockShotPreparationService.getAllShotPreparations.mockRejectedValue(error);

      // Act
      await shotPreparationController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching shot preparations' });
    });
  });

  describe('one', () => {
    it('should return shot preparation when found', async () => {
      // Arrange
      const mockPreparation = { shot_id: '1', dose_grams: 18.5, shot: { id: '1' } } as any;
      mockRequest.params = { id: '1' };
      mockShotPreparationService.getShotPreparationById.mockResolvedValue(mockPreparation);

      // Act
      await shotPreparationController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotPreparationService.getShotPreparationById).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith(mockPreparation);
    });

    it('should return 404 when shot preparation not found', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockShotPreparationService.getShotPreparationById.mockResolvedValue(null as any);

      // Act
      await shotPreparationController.one(mockRequest as Request, mockResponse as Response);

      // Assert - Controller returns 404 when not found
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Shot preparation not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Database error');
      mockShotPreparationService.getShotPreparationById.mockRejectedValue(error);

      // Act
      await shotPreparationController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching shot preparation' });
    });
  });

  describe('save', () => {
    it('should create shot preparation successfully', async () => {
      // Arrange
      const preparationData = {
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { shot_id: '1', ...preparationData };
      
      const createdPreparation = { shot_id: '1', ...preparationData, shot: { id: '1' } } as any;
      mockShotPreparationService.createShotPreparation.mockResolvedValue(createdPreparation);

      // Act
      await shotPreparationController.save(mockRequest as Request, mockResponse as Response);

      // Assert - Controller passes data as-is from request body
      expect(mockShotPreparationService.createShotPreparation).toHaveBeenCalledWith({ shot_id: '1', ...preparationData });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdPreparation);
    });

    it('should handle null values correctly', async () => {
      // Arrange
      const preparationData = {
        dose_grams: null,
        grind_setting: null,
        basket_type: null,
        basket_size_grams: null,
        distribution_method: null,
        tamp_type: null,
        tamp_pressure_category: null,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { shot_id: '1', ...preparationData };
      
      const createdPreparation = { shot_id: '1', ...preparationData, shot: { id: '1' } } as any;
      mockShotPreparationService.createShotPreparation.mockResolvedValue(createdPreparation);

      // Act
      await shotPreparationController.save(mockRequest as Request, mockResponse as Response);

      // Assert - Controller passes data as-is from request body
      expect(mockShotPreparationService.createShotPreparation).toHaveBeenCalledWith({ shot_id: '1', ...preparationData });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdPreparation);
    });

    it('should handle numeric conversions', async () => {
      // Arrange
      const preparationData = {
        dose_grams: '18.5',
        grind_setting: '15.0',
        basket_size_grams: '18',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { shot_id: '1', ...preparationData };
      
      const createdPreparation = { shot_id: '1', dose_grams: 18.5, grind_setting: 15.0, basket_size_grams: 18, shot: { id: '1' } } as any;
      mockShotPreparationService.createShotPreparation.mockResolvedValue(createdPreparation);

      // Act
      await shotPreparationController.save(mockRequest as Request, mockResponse as Response);

      // Assert - Controller passes data as-is from request body
      expect(mockShotPreparationService.createShotPreparation).toHaveBeenCalledWith({ shot_id: '1', dose_grams: '18.5', grind_setting: '15.0', basket_size_grams: '18' });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdPreparation);
    });

    it('should handle service errors', async () => {
      // Arrange
      const preparationData = { dose_grams: 18.5 };
      mockRequest.body = preparationData;
      const error = new Error('Validation failed');
      mockShotPreparationService.createShotPreparation.mockRejectedValue(error);

      // Act
      await shotPreparationController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating shot preparation' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const preparationData = { dose_grams: 18.5 };
      mockRequest.body = preparationData;
      const error = new Error();
      mockShotPreparationService.createShotPreparation.mockRejectedValue(error);

      // Act
      await shotPreparationController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating shot preparation' });
    });
  });

  describe('update', () => {
    it('should update shot preparation successfully', async () => {
      // Arrange
      const updateData = {
        dose_grams: 19.0,
        grind_setting: 16.0,
        basket_type: 'portafilter',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedPreparation = { shot_id: '1', ...updateData, shot: { id: '1' } } as any;
      mockShotPreparationService.updateShotPreparation.mockResolvedValue(updatedPreparation);

      // Act
      await shotPreparationController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotPreparationService.updateShotPreparation).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const updateData = {
        dose_grams: 19.0, // Only update dose_grams
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedPreparation = { shot_id: '1', ...updateData, shot: { id: '1' } } as any;
      mockShotPreparationService.updateShotPreparation.mockResolvedValue(updatedPreparation);

      // Act
      await shotPreparationController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotPreparationService.updateShotPreparation).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle basket_size_grams parseInt branch', async () => {
      // Arrange
      const updateData = {
        basket_size_grams: '20', // String to parseInt
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedPreparation = { shot_id: '1', basket_size_grams: 20, shot: { id: '1' } } as any;
      mockShotPreparationService.updateShotPreparation.mockResolvedValue(updatedPreparation);

      // Act
      await shotPreparationController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotPreparationService.updateShotPreparation).toHaveBeenCalledWith('1', { basket_size_grams: '20' });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle distribution_method null branch', async () => {
      // Arrange
      const updateData = {
        distribution_method: null, // Explicit null
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedPreparation = { shot_id: '1', ...updateData, shot: { id: '1' } } as any;
      mockShotPreparationService.updateShotPreparation.mockResolvedValue(updatedPreparation);

      // Act
      await shotPreparationController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotPreparationService.updateShotPreparation).toHaveBeenCalledWith('1', { distribution_method: null });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle tamp_type null branch', async () => {
      // Arrange
      const updateData = {
        tamp_type: null, // Explicit null
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedPreparation = { shot_id: '1', ...updateData, shot: { id: '1' } } as any;
      mockShotPreparationService.updateShotPreparation.mockResolvedValue(updatedPreparation);

      // Act
      await shotPreparationController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotPreparationService.updateShotPreparation).toHaveBeenCalledWith('1', { tamp_type: null });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle tamp_pressure_category null branch', async () => {
      // Arrange
      const updateData = {
        tamp_pressure_category: null, // Explicit null
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedPreparation = { shot_id: '1', ...updateData, shot: { id: '1' } } as any;
      mockShotPreparationService.updateShotPreparation.mockResolvedValue(updatedPreparation);

      // Act
      await shotPreparationController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotPreparationService.updateShotPreparation).toHaveBeenCalledWith('1', { tamp_pressure_category: null });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle shot preparation not found on update', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockRequest.body = { dose_grams: 19.0 };
      mockShotPreparationService.updateShotPreparation.mockResolvedValue(null as any);

      // Act
      await shotPreparationController.update(mockRequest as Request, mockResponse as Response);

      // Assert - Controller returns 200 with null when not found
      expect(mockResponse.json).toHaveBeenCalledWith(null);
    });

    it('should handle service errors', async () => {
      // Arrange
      const updateData = { dose_grams: 19.0 };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error('Update failed');
      mockShotPreparationService.updateShotPreparation.mockRejectedValue(error);

      // Act
      await shotPreparationController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating shot preparation' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const updateData = { dose_grams: 19.0 };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error();
      mockShotPreparationService.updateShotPreparation.mockRejectedValue(error);

      // Act
      await shotPreparationController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating shot preparation' });
    });
  });

  describe('remove', () => {
    it('should delete shot preparation successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockShotPreparationService.deleteShotPreparation.mockResolvedValue(true);

      // Act
      await shotPreparationController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotPreparationService.deleteShotPreparation).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 404 when shot preparation not found', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      const error = new Error('Shot preparation not found');
      mockShotPreparationService.deleteShotPreparation.mockRejectedValue(error);

      // Act
      await shotPreparationController.remove(mockRequest as Request, mockResponse as Response);

      // Assert - Controller returns 404 when not found
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Shot preparation not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Delete failed');
      mockShotPreparationService.deleteShotPreparation.mockRejectedValue(error);

      // Act
      await shotPreparationController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error deleting shot preparation' });
    });
  });
});
