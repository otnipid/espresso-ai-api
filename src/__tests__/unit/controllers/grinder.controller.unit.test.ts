import { request, Request, Response } from 'express';
import { GrinderService } from '../../../services/GrinderService';
import { GrinderController } from '../../../controllers/grinder.controller';

// Mock service
jest.mock('../../../services/GrinderService');

describe('GrinderController', () => {
  let grinderController: GrinderController;
  let mockGrinderService: jest.Mocked<GrinderService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock service
    mockGrinderService = {
      getAllGrinders: jest.fn(),
      getGrinderById: jest.fn(),
      createGrinder: jest.fn(),
      updateGrinder: jest.fn(),
      deleteGrinder: jest.fn(),
      getGrindersByManufacturer: jest.fn(),
    } as any;

    // Mock the service constructor
    (GrinderService as jest.MockedClass<any>).mockImplementation(() => mockGrinderService);

    // Create controller instance with mocked service
    grinderController = new GrinderController();

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
    it('should return all grinders on success', async () => {
      // Arrange
      const mockGrinders = [
        {
          id: '1',
          model: 'Baratza Sette 270Wi',
          manufacturer: 'Baratza',
          burrType: 'Conical',
          burrInstallDate: new Date('2023-01-15'),
          serialNumber: 'SETTE270-12345',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01'),
          shots: [],
        },
        {
          id: '2',
          model: 'Baratza Vario',
          manufacturer: 'Baratza',
          burrType: 'Flat',
          burrInstallDate: new Date('2023-02-01'),
          serialNumber: 'VARIO-67890',
          created_at: new Date('2023-02-01'),
          updated_at: new Date('2023-02-01'),
          shots: [],
        },
      ];

      mockGrinderService.getAllGrinders.mockResolvedValue(mockGrinders);

      // Act
      await grinderController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockGrinders);
    });

    it('should handle errors when fetching grinders fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockGrinderService.getAllGrinders.mockRejectedValue(error);

      // Act
      await grinderController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching grinders' });
    });
  });

  describe('one', () => {
    it('should return grinder by ID on success', async () => {
      // Arrange
      const mockGrinder = {
        id: '1',
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: new Date('2023-01-15'),
        serialNumber: 'SETTE270-12345',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        shots: [],
      };
      mockRequest.params = { id: '1' };

      mockGrinderService.getGrinderById.mockResolvedValue(mockGrinder);

      // Act
      await grinderController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockGrinder);
    });

    it('should return 404 when grinder not found', async () => {
      // Arrange
      const error = new Error('Grinder not found');
      mockGrinderService.getGrinderById.mockRejectedValue(error);
      mockRequest.params = { id: '999' };

      // Act
      await grinderController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Grinder not found' });
    });

    it('should handle errors when fetching grinder by ID fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockGrinderService.getGrinderById.mockRejectedValue(error);
      mockRequest.params = { id: '1' };

      // Act
      await grinderController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching grinder' });
    });
  });

  describe('save', () => {
    it('should create grinder on success', async () => {
      // Arrange
      const mockGrinder = {
        id: '1',
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: new Date('2023-01-15'),
        serialNumber: 'SETTE270-12345',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        shots: [],
      };
      mockRequest.params = { id: '1' };
      mockRequest.body = {
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: '2023-01-15',
        serialNumber: 'SETTE270-12345',
      };

      mockGrinderService.createGrinder.mockResolvedValue(mockGrinder);

      // Act
      await grinderController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockGrinder);
    });

    it('should return 400 when model is missing', async () => {
      // Arrange
      mockGrinderService.createGrinder.mockRejectedValue(new Error('Grinder model is required'));

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        manufacturer: 'Baratza',
        burrType: 'Conical',
        // model is missing
      };

      // Act
      await grinderController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Grinder model is required',
      });
    });

    it('should return 400 when model is only whitespace', async () => {
      // Arrange
      mockGrinderService.createGrinder.mockRejectedValue(new Error('Grinder model is required'));

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        manufacturer: 'Baratza',
        burrType: 'Conical',
        model: '   ', // only whitespace
      };

      // Act
      await grinderController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Grinder model is required',
      });
    });

    it('should handle errors when creating grinder fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockGrinderService.createGrinder.mockRejectedValue(error);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: '2023-01-15',
        serialNumber: 'SETTE270-12345',
      };

      // Act
      await grinderController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error creating grinder',
      });
    });
  });

  describe('update', () => {
    it('should update grinder on success', async () => {
      // Arrange
      const mockGrinder = {
        id: '1',
        model: 'Baratza Sette 270Wi',
        manufacturer: 'Baratza',
        burrType: 'Conical',
        burrInstallDate: new Date('2023-01-15'),
        serialNumber: 'SETTE270-12345',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        shots: [],
      };

      mockGrinderService.updateGrinder.mockResolvedValue(mockGrinder);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        model: 'Baratza Sette 270Wi Updated',
      };

      // Act
      await grinderController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockGrinder);
    });

    it('should return 404 when grinder not found', async () => {
      // Arrange
      const error = new Error('Grinder not found');
      mockGrinderService.updateGrinder.mockRejectedValue(error);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        model: 'Updated Model',
      };

      // Act
      await grinderController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Grinder not found',
      });
    });

    it('should return 400 when model is empty in update', async () => {
      // Arrange
      mockGrinderService.updateGrinder.mockRejectedValue(
        new Error('Grinder model cannot be empty')
      );

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        model: '',
      };

      // Act
      await grinderController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Grinder model cannot be empty',
      });
    });

    it('should return 400 when model is only whitespace in update', async () => {
      // Arrange
      mockGrinderService.updateGrinder.mockRejectedValue(
        new Error('Grinder model cannot be empty')
      );

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        model: '   ', // only whitespace
      };

      // Act
      await grinderController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Grinder model cannot be empty',
      });
    });

    it('should handle errors when updating grinder fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockGrinderService.updateGrinder.mockRejectedValue(error);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        model: 'Updated Model',
      };

      // Act
      await grinderController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error updating grinder',
      });
    });
  });

  describe('remove', () => {
    it('should delete grinder on success', async () => {
      // Arrange
      mockGrinderService.deleteGrinder.mockResolvedValue(true);

      mockRequest.params = { id: '1' };

      // Act
      await grinderController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 404 when grinder not found', async () => {
      // Arrange
      const error = new Error('Grinder not found');
      mockGrinderService.deleteGrinder.mockRejectedValue(error);

      mockRequest.params = { id: '999' };

      // Act
      await grinderController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Grinder not found',
      });
    });

    it('should handle errors when deleting grinder fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockGrinderService.deleteGrinder.mockRejectedValue(error);

      mockRequest.params = { id: '1' };

      // Act
      await grinderController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error deleting grinder',
      });
    });
  });

  describe('getGrindersByManufacturer', () => {
    it('should return grinders by manufacturer on success', async () => {
      // Arrange
      const mockGrinders = [
        {
          id: '1',
          model: 'Baratza Sette 270Wi',
          manufacturer: 'Baratza',
          burrType: 'Conical',
          burrInstallDate: new Date('2023-01-15'),
          serialNumber: 'SETTE270-12345',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01'),
          shots: [],
        },
        {
          id: '2',
          model: 'Baratza Vario',
          manufacturer: 'Baratza',
          burrType: 'Flat',
          burrInstallDate: new Date('2023-02-01'),
          serialNumber: 'VARIO-67890',
          created_at: new Date('2023-02-01'),
          updated_at: new Date('2023-02-01'),
          shots: [],
        },
      ];

      mockGrinderService.getGrindersByManufacturer.mockResolvedValue(mockGrinders);

      mockRequest.query = { manufacturer: 'Baratza' };

      // Act
      await grinderController.getGrindersByManufacturer(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockGrinders);
    });

    it('should handle errors when fetching grinders by manufacturer fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockGrinderService.getGrindersByManufacturer.mockRejectedValue(error);

      mockRequest.query = { manufacturer: 'Baratza' };

      // Act
      await grinderController.getGrindersByManufacturer(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching grinders by manufacturer',
      });
    });

    it('should handle missing manufacturer parameter', async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await grinderController.getGrindersByManufacturer(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Manufacturer parameter is required',
      });
    });
  });
});
