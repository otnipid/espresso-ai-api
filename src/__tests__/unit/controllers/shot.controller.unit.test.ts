import { Request, Response } from 'express';
import { ShotController } from '../../../controllers/shot.controller';
import { ShotService } from '../../../services/ShotService';

// Mock the ShotService
jest.mock('../../../services/ShotService');

describe('ShotController', () => {
  let shotController: ShotController;
  let mockShotService: jest.Mocked<ShotService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockShotService = {
      getShots: jest.fn(),
      getShotById: jest.fn(),
      createShot: jest.fn(),
      updateShot: jest.fn(),
      hardDeleteShot: jest.fn(),
    } as any;

    // Mock the constructor to return our mock service
    (ShotService as jest.Mock).mockImplementation(() => mockShotService);

    // Initialize controller
    shotController = new ShotController();

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
    it('should return shots with filters', async () => {
      // Arrange
      const mockShots = [
        { id: '1', shot_type: 'espresso' },
        { id: '2', shot_type: 'ristretto' },
      ];
      const mockResult = {
        shots: mockShots as any,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRequest.query = {
        machineId: 'machine-1',
        page: '1',
        limit: '10',
      };

      mockShotService.getShots.mockResolvedValue(mockResult);

      // Act
      await shotController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotService.getShots).toHaveBeenCalledWith({
        machineId: 'machine-1',
        beanBatchId: undefined,
        shot_type: undefined,
        success: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
        limit: 10,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.query = {};
      const error = new Error('Database error');
      mockShotService.getShots.mockRejectedValue(error);

      // Act
      await shotController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching shots' });
    });
  });

  describe('one', () => {
    it('should return shot when found', async () => {
      // Arrange
      const mockShot = { id: '1', shot_type: 'espresso' } as any;
      mockRequest.params = { id: '1' };
      mockShotService.getShotById.mockResolvedValue(mockShot);

      // Act
      await shotController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotService.getShotById).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith(mockShot);
    });

    it('should return 404 when shot not found', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      mockShotService.getShotById.mockResolvedValue(null as any);

      // Act
      await shotController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Shot not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Database error');
      mockShotService.getShotById.mockRejectedValue(error);

      // Act
      await shotController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching shot' });
    });
  });

  describe('save', () => {
    it('should create shot successfully', async () => {
      // Arrange
      const shotData = {
        machineId: 'machine-1',
        beanBatchId: 'batch-1',
        shot_type: 'espresso' as const,
        preparation: { dose: 18.5 },
        extraction: { time: 25 },
      };

      mockRequest.body = shotData;
      const createdShot = { id: 'new-shot', ...shotData } as any;
      mockShotService.createShot.mockResolvedValue(createdShot);

      // Act
      await shotController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotService.createShot).toHaveBeenCalledWith(shotData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdShot);
    });

    it('should handle service errors', async () => {
      // Arrange
      const shotData = {
        machineId: 'machine-1',
        beanBatchId: 'batch-1',
        shot_type: 'espresso' as const,
      };

      mockRequest.body = shotData;
      const error = new Error('Validation failed');
      mockShotService.createShot.mockRejectedValue(error);

      // Act
      await shotController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Validation failed' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const shotData = {
        machineId: 'machine-1',
        beanBatchId: 'batch-1',
        shot_type: 'espresso' as const,
      };

      mockRequest.body = shotData;
      const error = new Error();
      mockShotService.createShot.mockRejectedValue(error);

      // Act
      await shotController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating shot' });
    });
  });

  describe('update', () => {
    it('should update shot successfully', async () => {
      // Arrange
      const updateData = {
        shot_type: 'ristretto' as const,
        notes: 'Updated notes',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedShot = { id: '1', ...updateData } as any;
      mockShotService.updateShot.mockResolvedValue(updatedShot);

      // Act
      await shotController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotService.updateShot).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedShot);
    });

    it('should handle service errors', async () => {
      // Arrange
      const updateData = { shot_type: 'ristretto' as const };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error('Update failed');
      mockShotService.updateShot.mockRejectedValue(error);

      // Act
      await shotController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Update failed' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const updateData = { shot_type: 'ristretto' as const };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error();
      mockShotService.updateShot.mockRejectedValue(error);

      // Act
      await shotController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating shot' });
    });
  });

  describe('remove', () => {
    it('should delete shot successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockShotService.hardDeleteShot.mockResolvedValue(true);

      // Act
      await shotController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockShotService.hardDeleteShot).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 404 when shot not found', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      mockShotService.hardDeleteShot.mockResolvedValue(false);

      // Act
      await shotController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Shot not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Delete failed');
      mockShotService.hardDeleteShot.mockRejectedValue(error);

      // Act
      await shotController.remove(mockRequest as Request, mockResponse as Response);

      // Assert

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error deleting shot',
      });
    });
  });
});
