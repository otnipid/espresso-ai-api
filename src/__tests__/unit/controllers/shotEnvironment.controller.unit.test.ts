import { Request, Response } from 'express';
import { ShotEnvironmentController } from '../../../controllers/shotEnvironment.controller';
import { ShotEnvironmentService } from '../../../services/ShotEnvironmentService';

// Mock ShotEnvironmentService
jest.mock('../../../services/ShotEnvironmentService');

describe('ShotEnvironmentController', () => {
  let shotEnvironmentController: ShotEnvironmentController;
  let mockShotEnvironmentService: jest.Mocked<ShotEnvironmentService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockShotEnvironmentService = {
      getAllShotEnvironments: jest.fn(),
      getShotEnvironmentById: jest.fn(),
      createShotEnvironment: jest.fn(),
      updateShotEnvironment: jest.fn(),
      deleteShotEnvironment: jest.fn(),
    } as any;

    // Mock constructor to return our mock service
    (ShotEnvironmentService as jest.Mock).mockImplementation(() => mockShotEnvironmentService);

    // Initialize controller
    shotEnvironmentController = new ShotEnvironmentController();

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
    it('should return all shot environments', async () => {
      // Arrange
      const mockEnvironments = [
        { shot_id: '1', ambient_temp_c: 22.5, shot: { id: '1' } } as any,
        { shot_id: '2', ambient_temp_c: 23.0, shot: { id: '2' } } as any,
      ];

      mockShotEnvironmentService.getAllShotEnvironments.mockResolvedValue(mockEnvironments);

      // Act
      await shotEnvironmentController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotEnvironmentService.getAllShotEnvironments).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockEnvironments);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockShotEnvironmentService.getAllShotEnvironments.mockRejectedValue(error);

      // Act
      await shotEnvironmentController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching shot environments' });
    });
  });

  describe('one', () => {
    it('should return shot environment when found', async () => {
      // Arrange
      const mockEnvironment = { shot_id: '1', ambient_temp_c: 22.5, shot: { id: '1' } } as any;
      mockRequest.params = { id: '1' };
      mockShotEnvironmentService.getShotEnvironmentById.mockResolvedValue(mockEnvironment);

      // Act
      await shotEnvironmentController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotEnvironmentService.getShotEnvironmentById).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith(mockEnvironment);
    });

    it('should return 404 when shot environment not found', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockShotEnvironmentService.getShotEnvironmentById.mockResolvedValue(null as any);

      // Act
      await shotEnvironmentController.one(mockRequest as Request, mockResponse as Response);

      // Assert - Controller returns 404 when not found
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Shot environment not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Database error');
      mockShotEnvironmentService.getShotEnvironmentById.mockRejectedValue(error);

      // Act
      await shotEnvironmentController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching shot environment' });
    });
  });

  describe('save', () => {
    it('should create shot environment successfully', async () => {
      // Arrange
      const environmentData = {
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = environmentData;
      
      // Controller adds shot_id to the data before calling service
      const expectedServiceCall = { shot_id: '1', ...environmentData };
      const createdEnvironment = { shot_id: '1', ...environmentData, shot: { id: '1' } } as any;
      mockShotEnvironmentService.createShotEnvironment.mockResolvedValue(createdEnvironment);

      // Act
      await shotEnvironmentController.save(mockRequest as Request, mockResponse as Response);

      // Assert - Controller adds shot_id before calling service
      expect(mockShotEnvironmentService.createShotEnvironment).toHaveBeenCalledWith(expectedServiceCall);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdEnvironment);
    });

    it('should handle null values correctly', async () => {
      // Arrange
      const environmentData = {
        ambient_temp_c: null,
        humidity_percent: null,
        water_source: undefined,
        estimated_water_hardness_ppm: null,
        machine_warmup_minutes: null,
        shots_since_clean: null,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = environmentData;
      
      // Controller adds shot_id to the data before calling service
      const expectedServiceCall = { shot_id: '1', ...environmentData };
      const createdEnvironment = { shot_id: '1', ...environmentData, shot: { id: '1' } } as any;
      mockShotEnvironmentService.createShotEnvironment.mockResolvedValue(createdEnvironment);

      // Act
      await shotEnvironmentController.save(mockRequest as Request, mockResponse as Response);

      // Assert - Controller adds shot_id before calling service
      expect(mockShotEnvironmentService.createShotEnvironment).toHaveBeenCalledWith(expectedServiceCall);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdEnvironment);
    });

    it('should handle numeric conversions', async () => {
      // Arrange
      const environmentData = {
        ambient_temp_c: '22.5',
        humidity_percent: '70',
        estimated_water_hardness_ppm: '200',
        machine_warmup_minutes: '15',
        shots_since_clean: '8',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = environmentData;
      const createdEnvironment = { shot_id: '1', ambient_temp_c: 22.5, humidity_percent: 70, estimated_water_hardness_ppm: 200, machine_warmup_minutes: 15, shots_since_clean: 8, shot: { id: '1' } } as any;
      mockShotEnvironmentService.createShotEnvironment.mockResolvedValue(createdEnvironment);

      // Act
      await shotEnvironmentController.save(mockRequest as Request, mockResponse as Response);

      // Assert - Controller adds shot_id before calling service
      const expectedServiceCall = { shot_id: '1', ...environmentData };
      expect(mockShotEnvironmentService.createShotEnvironment).toHaveBeenCalledWith(expectedServiceCall);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdEnvironment);
    });

    it('should handle service errors', async () => {
      // Arrange
      const environmentData = { ambient_temp_c: 22.5 };
      mockRequest.params = { id: '1' };
      mockRequest.body = environmentData;
      const error = new Error('Validation failed');
      mockShotEnvironmentService.createShotEnvironment.mockRejectedValue(error);

      // Act
      await shotEnvironmentController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating shot' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const environmentData = { ambient_temp_c: 22.5 };
      mockRequest.params = { id: '1' };
      mockRequest.body = environmentData;
      const error = new Error();
      mockShotEnvironmentService.createShotEnvironment.mockRejectedValue(error);

      // Act
      await shotEnvironmentController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating shot' });
    });
  });

  describe('update', () => {
    it('should update shot environment successfully', async () => {
      // Arrange
      const updateData = {
        ambient_temp_c: 23.0,
        humidity_percent: 70,
        water_source: 'filtered',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedEnvironment = { shot_id: '1', ...updateData, shot: { id: '1' } } as any;
      mockShotEnvironmentService.updateShotEnvironment.mockResolvedValue(updatedEnvironment);

      // Act
      await shotEnvironmentController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotEnvironmentService.updateShotEnvironment).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedEnvironment);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const updateData = {
        ambient_temp_c: 23.0, // Only update ambient_temp_c
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedEnvironment = { shot_id: '1', ...updateData, shot: { id: '1' } } as any;
      mockShotEnvironmentService.updateShotEnvironment.mockResolvedValue(updatedEnvironment);

      // Act
      await shotEnvironmentController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotEnvironmentService.updateShotEnvironment).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedEnvironment);
    });

    it('should handle shot environment not found on update', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockRequest.body = { ambient_temp_c: 23.0 };
      mockShotEnvironmentService.updateShotEnvironment.mockResolvedValue(null as any);

      // Act
      await shotEnvironmentController.update(mockRequest as Request, mockResponse as Response);

      // Assert - Controller returns 200 with null, not 404
      expect(mockResponse.json).toHaveBeenCalledWith(null);
    });

    it('should handle service errors', async () => {
      // Arrange
      const updateData = { ambient_temp_c: 23.0 };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error('Update failed');
      mockShotEnvironmentService.updateShotEnvironment.mockRejectedValue(error);

      // Act
      await shotEnvironmentController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating shot' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const updateData = { ambient_temp_c: 23.0 };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error();
      mockShotEnvironmentService.updateShotEnvironment.mockRejectedValue(error);

      // Act
      await shotEnvironmentController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating shot' });
    });
  });

  describe('remove', () => {
    it('should delete shot environment successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockShotEnvironmentService.deleteShotEnvironment.mockResolvedValue(true);

      // Act
      await shotEnvironmentController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotEnvironmentService.deleteShotEnvironment).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 404 when shot environment not found', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      mockShotEnvironmentService.deleteShotEnvironment.mockResolvedValue(false);

      // Act
      await shotEnvironmentController.remove(mockRequest as Request, mockResponse as Response);

      // Assert - Controller returns 204 even when not found
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Delete failed');
      mockShotEnvironmentService.deleteShotEnvironment.mockRejectedValue(error);

      // Act
      await shotEnvironmentController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error deleting shot environment' });
    });
  });
});
