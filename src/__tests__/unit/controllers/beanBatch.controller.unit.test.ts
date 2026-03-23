import { Request, Response } from 'express';
import { BeanBatchController } from '../../../controllers/beanBatch.controller';
import { BeanBatchService } from '../../../services/BeanBatchService';

// Mock BeanBatchService
jest.mock('../../../services/BeanBatchService');

describe('BeanBatchController', () => {
  let beanBatchController: BeanBatchController;
  let mockBeanBatchService: jest.Mocked<BeanBatchService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockBeanBatchService = {
      getAllBeanBatches: jest.fn(),
      getBeanBatchById: jest.fn(),
      createBeanBatch: jest.fn(),
      updateBeanBatch: jest.fn(),
      deleteBeanBatch: jest.fn(),
    } as any;

    // Mock the constructor to return our mock service
    (BeanBatchService as jest.Mock).mockImplementation(() => mockBeanBatchService);

    // Initialize controller
    beanBatchController = new BeanBatchController();

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
    it('should return all bean batches', async () => {
      // Arrange
      const mockBatches = [
        { id: '1', roastDate: new Date('2023-01-01'), bean: { id: '1' }, shots: [], createdAt: new Date(), updatedAt: new Date() } as any,
        { id: '2', roastDate: new Date('2023-01-02'), bean: { id: '2' }, shots: [], createdAt: new Date(), updatedAt: new Date() } as any,
      ];

      mockBeanBatchService.getAllBeanBatches.mockResolvedValue(mockBatches);

      // Act
      await beanBatchController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanBatchService.getAllBeanBatches).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockBatches);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockBeanBatchService.getAllBeanBatches.mockRejectedValue(error);

      // Act
      await beanBatchController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching bean batches' });
    });
  });

  describe('one', () => {
    it('should return bean batch when found', async () => {
      // Arrange
      const mockBatch = { id: '1', roastDate: new Date('2023-01-01'), bean: { id: '1' }, shots: [], createdAt: new Date(), updatedAt: new Date() } as any;
      mockRequest.params = { id: '1' };
      mockBeanBatchService.getBeanBatchById.mockResolvedValue(mockBatch);

      // Act
      await beanBatchController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanBatchService.getBeanBatchById).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith(mockBatch);
    });

    it('should return 404 when bean batch not found', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockBeanBatchService.getBeanBatchById.mockResolvedValue(null as any);

      // Act
      await beanBatchController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bean batch not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Database error');
      mockBeanBatchService.getBeanBatchById.mockRejectedValue(error);

      // Act
      await beanBatchController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching bean batch' });
    });
  });

  describe('save', () => {
    it('should create bean batch successfully', async () => {
      // Arrange
      const batchData = {
        beanId: '1',
        roastDate: '2023-01-01',
        bagOpenDate: '2023-06-01',
        roastLevel: 'Medium',
        roastDegree: 2,
      };

      mockRequest.body = batchData;
      const createdBatch = { id: '1', bean: { id: '1' }, roastDate: new Date('2023-01-01'), bagOpenDate: new Date('2023-06-01'), shots: [], createdAt: new Date(), updatedAt: new Date() } as any;
      mockBeanBatchService.createBeanBatch.mockResolvedValue(createdBatch);

      // Act
      await beanBatchController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanBatchService.createBeanBatch).toHaveBeenCalledWith(batchData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdBatch);
    });

    it('should handle missing beanId validation', async () => {
      // Arrange
      const invalidData = { roastDate: '2023-01-01' }; // Missing beanId
      mockRequest.body = invalidData;
      const error = new Error('Bean ID and roast date are required');
      mockBeanBatchService.createBeanBatch.mockRejectedValue(error);

      // Act
      await beanBatchController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bean ID and roast date are required' });
    });

    it('should handle missing roastDate validation', async () => {
      // Arrange
      const invalidData = { beanId: '1' }; // Missing roastDate
      mockRequest.body = invalidData;
      const error = new Error('Bean ID and roast date are required');
      mockBeanBatchService.createBeanBatch.mockRejectedValue(error);

      // Act
      await beanBatchController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bean ID and roast date are required' });
    });

    it('should handle service errors', async () => {
      // Arrange
      const batchData = { beanId: '1', roastDate: '2023-01-01' };
      mockRequest.body = batchData;
      const error = new Error('Validation failed');
      mockBeanBatchService.createBeanBatch.mockRejectedValue(error);

      // Act
      await beanBatchController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating bean batch' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const batchData = { beanId: '1', roastDate: '2023-01-01' };
      mockRequest.body = batchData;
      const error = new Error();
      mockBeanBatchService.createBeanBatch.mockRejectedValue(error);

      // Act
      await beanBatchController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating bean batch' });
    });
  });

  describe('update', () => {
    it('should update bean batch successfully', async () => {
      // Arrange
      const updateData = {
        roastDate: '2023-01-02',
        bagOpenDate: '2023-06-02',
        roastLevel: 'Dark',
        roastDegree: 3,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedBatch = { id: '1', ...updateData } as any;
      mockBeanBatchService.updateBeanBatch.mockResolvedValue(updatedBatch);

      // Act
      await beanBatchController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanBatchService.updateBeanBatch).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBatch);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const updateData = {
        roastDate: '2023-01-02', // Only update roastDate
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedBatch = { id: '1', ...updateData } as any;
      mockBeanBatchService.updateBeanBatch.mockResolvedValue(updatedBatch);

      // Act
      await beanBatchController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanBatchService.updateBeanBatch).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBatch);
    });

    it('should handle bean batch not found on update', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockRequest.body = { roastDate: '2023-01-01' };
      mockBeanBatchService.updateBeanBatch.mockResolvedValue(null as any);

      // Act
      await beanBatchController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bean batch not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      const updateData = { roastDate: '2023-01-01' };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error('Update failed');
      mockBeanBatchService.updateBeanBatch.mockRejectedValue(error);

      // Act
      await beanBatchController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating bean batch' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const updateData = { roastDate: '2023-01-01' };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error();
      mockBeanBatchService.updateBeanBatch.mockRejectedValue(error);

      // Act
      await beanBatchController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating bean batch' });
    });
  });

  describe('remove', () => {
    it('should delete bean batch successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockBeanBatchService.deleteBeanBatch.mockResolvedValue(true);

      // Act
      await beanBatchController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanBatchService.deleteBeanBatch).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 404 when bean batch not found', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      mockBeanBatchService.deleteBeanBatch.mockResolvedValue(false);

      // Act
      await beanBatchController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bean batch not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Delete failed');
      mockBeanBatchService.deleteBeanBatch.mockRejectedValue(error);

      // Act
      await beanBatchController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error deleting bean batch' });
    });
  });
});
