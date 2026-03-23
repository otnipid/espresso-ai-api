import { Request, Response } from 'express';
import { BeanController } from '../../../controllers/bean.controller';
import { BeanService } from '../../../services/BeanService';

// Mock BeanService
jest.mock('../../../services/BeanService');

describe('BeanController', () => {
  let beanController: BeanController;
  let mockBeanService: jest.Mocked<BeanService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create a fresh mock for each test
    mockBeanService = {
      getAllBeans: jest.fn(),
      getBeanById: jest.fn(),
      createBean: jest.fn(),
      updateBean: jest.fn(),
      deleteBean: jest.fn(),
    } as any;

    // Mock the constructor to return our mock service
    (BeanService as jest.Mock).mockImplementation(() => mockBeanService);

    // Initialize controller
    beanController = new BeanController();

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
    it('should return all beans', async () => {
      // Arrange
      const mockBeans = [
        { id: '1', name: 'Colombia Bean', country: 'Colombia', roaster: undefined, region: undefined, farm: undefined, varietal: undefined, processing_method: undefined, altitude_m: null, density_category: undefined, created_at: new Date(), beanBatches: [] } as any,
        { id: '2', name: 'Brazil Bean', country: 'Brazil', roaster: undefined, region: undefined, farm: undefined, varietal: undefined, processing_method: undefined, altitude_m: null, density_category: undefined, created_at: new Date(), beanBatches: [] } as any,
      ];

      mockBeanService.getAllBeans.mockResolvedValue(mockBeans);

      // Act
      await beanController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanService.getAllBeans).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockBeans);
    });

    it('should handle service errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockBeanService.getAllBeans.mockRejectedValue(error);

      // Act
      await beanController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching beans' });
    });
  });

  describe('one', () => {
    it('should return bean when found', async () => {
      // Arrange
      const mockBean = { id: '1', name: 'Test Bean', country: 'Colombia', roaster: undefined, region: undefined, farm: undefined, varietal: undefined, processing_method: undefined, altitude_m: null, density_category: undefined, created_at: new Date(), beanBatches: [] } as any;
      mockRequest.params = { id: '1' };
      mockBeanService.getBeanById.mockResolvedValue(mockBean);

      // Act
      await beanController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanService.getBeanById).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith(mockBean);
    });

    it('should return 404 when bean not found', async () => {
      // Arrange
      mockRequest.params = { id: '999' };
      mockBeanService.getBeanById.mockResolvedValue(null as any);

      // Act
      await beanController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bean not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Database error');
      mockBeanService.getBeanById.mockRejectedValue(error);

      // Act
      await beanController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching bean' });
    });
  });

  describe('save', () => {
    it('should create bean successfully', async () => {
      // Arrange
      const beanData = {
        name: 'New Bean',
        country: 'Colombia',
        roaster: 'Test Roaster',
        region: 'Test Region',
        farm: 'Test Farm',
        varietal: 'Test Varietal',
        processing_method: 'Washed',
        altitude_m: 1500,
        density_category: 'Medium',
      };

      mockRequest.body = beanData;
      const createdBean = { id: '1', ...beanData } as any;
      mockBeanService.createBean.mockResolvedValue(createdBean);

      // Act
      await beanController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanService.createBean).toHaveBeenCalledWith(beanData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdBean);
    });

    it('should handle missing name validation', async () => {
      // Arrange
      const invalidData = { country: 'Colombia' }; // Missing name
      mockRequest.body = invalidData;
      const error = new Error('Bean name is required');
      mockBeanService.createBean.mockRejectedValue(error);

      // Act
      await beanController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bean name is required' });
    });

    it('should handle altitude_m conversion', async () => {
      // Arrange
      const beanData = {
        name: 'New Bean',
        altitude_m: '1500', // String that should be converted
      };

      mockRequest.body = beanData;
      const createdBean = { id: '1', ...beanData } as any;
      mockBeanService.createBean.mockResolvedValue(createdBean);

      // Act
      await beanController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanService.createBean).toHaveBeenCalledWith(beanData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdBean);
    });

    it('should handle service errors', async () => {
      // Arrange
      const beanData = { name: 'New Bean', country: 'Colombia' };
      mockRequest.body = beanData;
      const error = new Error('Validation failed');
      mockBeanService.createBean.mockRejectedValue(error);

      // Act
      await beanController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating bean' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const beanData = { name: 'New Bean' };
      mockRequest.body = beanData;
      const error = new Error();
      mockBeanService.createBean.mockRejectedValue(error);

      // Act
      await beanController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error creating bean' });
    });
  });

  describe('update', () => {
    it('should update bean successfully', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Bean',
        country: 'Brazil',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedBean = { id: '1', ...updateData } as any;
      mockBeanService.updateBean.mockResolvedValue(updatedBean);

      // Act
      await beanController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanService.updateBean).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBean);
    });

    it('should handle partial updates', async () => {
      // Arrange
      const updateData = {
        name: 'New Name Only', // Only update name
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const updatedBean = { id: '1', ...updateData } as any;
      mockBeanService.updateBean.mockResolvedValue(updatedBean);

      // Act
      await beanController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanService.updateBean).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBean);
    });

    it('should handle service errors', async () => {
      // Arrange
      const updateData = { name: 'Updated Bean' };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error('Update failed');
      mockBeanService.updateBean.mockRejectedValue(error);

      // Act
      await beanController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating bean' });
    });

    it('should handle errors without message', async () => {
      // Arrange
      const updateData = { name: 'Updated Bean' };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error();
      mockBeanService.updateBean.mockRejectedValue(error);

      // Act
      await beanController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error updating bean' });
    });
  });

  describe('remove', () => {
    it('should delete bean successfully', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      mockBeanService.deleteBean.mockResolvedValue(true);

      // Act
      await beanController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockBeanService.deleteBean).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 404 when bean not found', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      mockBeanService.deleteBean.mockResolvedValue(false);

      // Act
      await beanController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Bean not found' });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockRequest.params = { id: '1' };
      const error = new Error('Delete failed');
      mockBeanService.deleteBean.mockRejectedValue(error);

      // Act
      await beanController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error deleting bean' });
    });
  });
});
