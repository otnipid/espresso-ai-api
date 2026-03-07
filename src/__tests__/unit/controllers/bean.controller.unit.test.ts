import { Request, Response } from 'express';
import { AppDataSource } from '../../../data-source';

// Mock the data source
jest.mock('../../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('BeanController', () => {
  let mockRepository: any;
  let mockRequest: Partial<Request>;
  let mockResponse: any;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
    
    mockRequest = {} as Request;
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockImplementation(() => ({
        send: jest.fn(),
        json: jest.fn(),
      })),
    };
  });

  describe('all', () => {
    it('should return all beans', async () => {
      const mockBeans = [
        { id: '1', name: 'Bean1' },
        { id: '2', name: 'Bean2' },
      ];
      
      mockRepository.find.mockResolvedValue(mockBeans);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.all(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['beanBatches'],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockBeans);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockRepository.find.mockRejectedValue(error);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.all(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error fetching beans' });
    });
  });

  describe('one', () => {
    it('should return a single bean by ID', async () => {
      const mockBean = { id: '1', name: 'Test Bean' };
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue(mockBean);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.one(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['beanBatches'],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockBean);
    });

    it('should handle bean not found', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.one(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Bean not found' });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockRejectedValue(error);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.one(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error fetching bean' });
    });
  });

  describe('save', () => {
    it('should create a new bean', async () => {
      const newBean = { name: 'New Bean', country: 'Colombia' };
      const createdBean = { name: 'New Bean', country: 'Colombia' };
      const savedBean = { id: '1', ...createdBean };
      
      mockRequest.body = newBean;
      mockRepository.create.mockReturnValue(createdBean);
      mockRepository.save.mockResolvedValue(savedBean);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'New Bean',
        country: 'Colombia',
        roaster: undefined,
        region: undefined,
        farm: undefined,
        varietal: undefined,
        processing_method: undefined,
        altitude_m: null,
        density_category: undefined,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdBean);
      expect((mockResponse.status as jest.Mock).mock.calls[0][0]).toBe(201);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith(savedBean);
    });

    it('should handle missing name validation', async () => {
      mockRequest.body = { country: 'Colombia' }; // Missing name
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Name is required' });
    });

    it('should handle altitude_m conversion', async () => {
      const newBean = { name: 'New Bean', altitude_m: '1500' };
      const createdBean = { name: 'New Bean', altitude_m: 1500 };
      const savedBean = { id: '1', ...createdBean };
      
      mockRequest.body = newBean;
      mockRepository.create.mockReturnValue(createdBean);
      mockRepository.save.mockResolvedValue(savedBean);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'New Bean',
        altitude_m: 1500,
        roaster: undefined,
        country: undefined,
        region: undefined,
        farm: undefined,
        varietal: undefined,
        processing_method: undefined,
        density_category: undefined,
      });
    });

    it('should handle database errors during save', async () => {
      const error = new Error('Database save failed');
      mockRequest.body = { name: 'New Bean', country: 'Colombia' };
      mockRepository.create.mockReturnValue({ name: 'New Bean', country: 'Colombia' });
      mockRepository.save.mockRejectedValue(error);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error creating bean' });
    });
  });

  describe('update', () => {
    it('should update an existing bean', async () => {
      const existingBean = { id: '1', name: 'Old Name', country: 'Brazil' };
      const updatedBean = { id: '1', name: 'New Name', country: 'Colombia' };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'New Name', country: 'Colombia' };
      mockRepository.findOne.mockResolvedValue(existingBean);
      mockRepository.save.mockResolvedValue(updatedBean);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedBean);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBean);
    });

    it('should handle bean not found on update', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Updated Bean' };
      mockRepository.findOne.mockResolvedValue(null);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Bean not found' });
    });

    it('should handle database errors during update', async () => {
      const error = new Error('Database update failed');
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Bean' };
      mockRepository.findOne.mockResolvedValue({ id: '1', name: 'Old Bean' });
      mockRepository.save.mockRejectedValue(error);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error updating bean' });
    });

    it('should handle partial field updates', async () => {
      const existingBean = { 
        id: '1', 
        name: 'Old Name', 
        country: 'Brazil',
        roaster: 'Old Roaster',
        region: 'Old Region',
        farm: 'Old Farm',
        varietal: 'Old Varietal',
        processing_method: 'Old Method',
        altitude_m: 1000,
        density_category: 'Old Category'
      };
      const updatedBean = { 
        id: '1', 
        name: 'New Name',  // Only update name
        country: 'Brazil', // Keep existing
        roaster: 'Old Roaster', // Keep existing
        region: 'Old Region', // Keep existing
        farm: 'Old Farm', // Keep existing
        varietal: 'Old Varietal', // Keep existing
        processing_method: 'Old Method', // Keep existing
        altitude_m: 1000, // Keep existing
        density_category: 'Old Category' // Keep existing
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'New Name' }; // Only name provided
      mockRepository.findOne.mockResolvedValue(existingBean);
      mockRepository.save.mockResolvedValue(updatedBean);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedBean);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBean);
    });

    it('should handle multiple field updates', async () => {
      const existingBean = { 
        id: '1', 
        name: 'Old Name', 
        country: 'Brazil',
        roaster: undefined,
        region: undefined,
        farm: undefined,
        varietal: undefined,
        processing_method: undefined,
        altitude_m: null,
        density_category: undefined
      };
      const updatedBean = { 
        id: '1', 
        name: 'New Name',
        country: 'Colombia',
        roaster: 'New Roaster',
        region: 'New Region',
        farm: 'New Farm',
        varietal: 'New Varietal',
        processing_method: 'New Method',
        altitude_m: 1500,
        density_category: 'New Category'
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { 
        name: 'New Name',
        country: 'Colombia',
        roaster: 'New Roaster',
        region: 'New Region',
        farm: 'New Farm',
        varietal: 'New Varietal',
        processing_method: 'New Method',
        altitude_m: '1500',
        density_category: 'New Category'
      };
      mockRepository.findOne.mockResolvedValue(existingBean);
      mockRepository.save.mockResolvedValue(updatedBean);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedBean);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBean);
    });

    it('should handle name field update specifically', async () => {
      const existingBean = { 
        id: '1', 
        name: 'Old Name', 
        country: 'Brazil',
        roaster: undefined,
        region: undefined,
        farm: undefined,
        varietal: undefined,
        processing_method: undefined,
        altitude_m: null,
        density_category: undefined
      };
      const updatedBean = { 
        id: '1', 
        name: 'Specific New Name',
        country: 'Brazil',
        roaster: undefined,
        region: undefined,
        farm: undefined,
        varietal: undefined,
        processing_method: undefined,
        altitude_m: null,
        density_category: undefined
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Specific New Name' };
      mockRepository.findOne.mockResolvedValue(existingBean);
      mockRepository.save.mockResolvedValue(updatedBean);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.save).toHaveBeenCalledWith(updatedBean);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBean);
    });

    it('should handle altitude_m field update with null value', async () => {
      const existingBean = { 
        id: '1', 
        name: 'Test Bean', 
        country: 'Brazil',
        roaster: undefined,
        region: undefined,
        farm: undefined,
        varietal: undefined,
        processing_method: undefined,
        altitude_m: 1000,
        density_category: undefined
      };
      const updatedBean = { 
        id: '1', 
        name: 'Test Bean',
        country: 'Brazil',
        roaster: undefined,
        region: undefined,
        farm: undefined,
        varietal: undefined,
        processing_method: undefined,
        altitude_m: null, // Set to null explicitly
        density_category: undefined
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { altitude_m: null }; // Explicit null
      mockRepository.findOne.mockResolvedValue(existingBean);
      mockRepository.save.mockResolvedValue(updatedBean);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.save).toHaveBeenCalledWith(updatedBean);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBean);
    });
  });

  describe('remove', () => {
    it('should delete a bean', async () => {
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        name: 'Test Bean',
        country: 'Colombia',
      });
      mockRepository.remove.mockResolvedValue({ affected: 1 });
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.remove(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.remove).toHaveBeenCalledWith({
        id: '1',
        name: 'Test Bean',
        country: 'Colombia',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.send).toHaveBeenCalled();
    });

    it('should handle bean not found on deletion', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.remove(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Bean not found' });
    });

    it('should handle database errors during deletion', async () => {
      const error = new Error('Database delete failed');
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        name: 'Test Bean',
        country: 'Colombia',
      });
      mockRepository.remove.mockRejectedValue(error);
      
      const BeanController = (await import('../../../controllers/bean.controller')).BeanController;
      const controller = new BeanController();
      
      await controller.remove(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error deleting bean' });
    });
  });
});
