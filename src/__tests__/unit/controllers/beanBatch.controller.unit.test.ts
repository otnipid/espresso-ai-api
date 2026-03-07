import { Request, Response } from 'express';
import { AppDataSource } from '../../../data-source';

// Mock the data source
jest.mock('../../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('BeanBatchController', () => {
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
    it('should return all bean batches', async () => {
      const mockBatches = [
        { id: '1', roastDate: '2023-01-01' },
        { id: '2', roastDate: '2023-01-02' },
      ];
      
      mockRepository.find.mockResolvedValue(mockBatches);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.all(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['bean'],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockBatches);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockRepository.find.mockRejectedValue(error);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.all(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error fetching bean batches' });
    });
  });

  describe('one', () => {
    it('should return a single bean batch by ID', async () => {
      const mockBatch = { id: '1', roastDate: '2023-01-01' };
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue(mockBatch);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.one(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['bean'],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockBatch);
    });

    it('should handle bean batch not found', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.one(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Bean batch not found' });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockRejectedValue(error);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.one(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error fetching bean batch' });
    });
  });

  describe('save', () => {
    it('should create a new bean batch', async () => {
      const newBatch = { beanId: '1', roastDate: '2023-01-01', weightKg: '5.5' };
      const createdBatch = {
        bean: { id: '1' },
        roastDate: new Date('2023-01-01'),
        bestByDate: null,
        weightKg: 5.5,
        notes: null,
      };
      const savedBatch = { id: '1', ...createdBatch };
      
      mockRequest.body = newBatch;
      mockRepository.create.mockReturnValue(createdBatch);
      mockRepository.save.mockResolvedValue(savedBatch);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        bean: { id: '1' },
        roastDate: new Date('2023-01-01'),
        bestByDate: null,
        weightKg: 5.5,
        notes: null,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdBatch);
      expect((mockResponse.status as jest.Mock).mock.calls[0][0]).toBe(201);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith(savedBatch);
    });

    it('should handle missing beanId validation', async () => {
      mockRequest.body = { roastDate: '2023-01-01' }; // Missing beanId
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Bean ID and roast date are required',
      });
    });

    it('should handle missing roastDate validation', async () => {
      mockRequest.body = { beanId: '1' }; // Missing roastDate
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Bean ID and roast date are required',
      });
    });

    it('should handle bestByDate conversion', async () => {
      const newBatch = { beanId: '1', roastDate: '2023-01-01', bestByDate: '2023-06-01' };
      const createdBatch = {
        bean: { id: '1' },
        roastDate: new Date('2023-01-01'),
        bestByDate: new Date('2023-06-01'),
        weightKg: null,
        notes: null,
      };
      const savedBatch = { id: '1', ...createdBatch };
      
      mockRequest.body = newBatch;
      mockRepository.create.mockReturnValue(createdBatch);
      mockRepository.save.mockResolvedValue(savedBatch);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        bean: { id: '1' },
        roastDate: new Date('2023-01-01'),
        bestByDate: new Date('2023-06-01'),
        weightKg: null,
        notes: null,
      });
    });

    it('should handle database errors during save', async () => {
      const error = new Error('Database save failed');
      mockRequest.body = { beanId: '1', roastDate: '2023-01-01' };
      mockRepository.create.mockReturnValue({ bean: { id: '1' }, roastDate: new Date('2023-01-01') });
      mockRepository.save.mockRejectedValue(error);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error creating bean batch' });
    });
  });

  describe('update', () => {
    it('should update an existing bean batch', async () => {
      const existingBatch = { 
        id: '1', 
        bean: { id: '1' }, 
        roastDate: new Date('2023-01-01'),
        weightKg: 5.0,
      };
      const updatedBatch = { 
        id: '1', 
        bean: { id: '2' }, 
        roastDate: new Date('2023-01-02'),
        weightKg: 6.0,
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { beanId: '2', roastDate: '2023-01-02', weightKg: '6.0' };
      mockRepository.findOne.mockResolvedValue(existingBatch);
      mockRepository.save.mockResolvedValue(updatedBatch);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedBatch);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBatch);
    });

    it('should handle bean batch not found on update', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { beanId: '1', roastDate: '2023-01-01' };
      mockRepository.findOne.mockResolvedValue(null);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Bean batch not found' });
    });

    it('should handle bestByDate null branch', async () => {
      const existingBatch = { 
        id: '1', 
        bean: { id: '1' }, 
        roastDate: new Date('2023-01-01'),
        bestByDate: new Date('2023-06-01'),
        weightKg: 5.0,
      };
      const updatedBatch = { 
        id: '1', 
        bean: { id: '1' }, 
        roastDate: new Date('2023-01-01'),
        bestByDate: null, // Set to null
        weightKg: 5.0,
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { bestByDate: null }; // Explicit null
      mockRepository.findOne.mockResolvedValue(existingBatch);
      mockRepository.save.mockResolvedValue(updatedBatch);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.save).toHaveBeenCalledWith(updatedBatch);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedBatch);
    });

    it('should handle database errors during update', async () => {
      const error = new Error('Database update failed');
      mockRequest.params = { id: '1' };
      mockRequest.body = { beanId: '1', roastDate: '2023-01-01' };
      mockRepository.findOne.mockResolvedValue({ id: '1', bean: { id: '1' }, roastDate: new Date('2023-01-01') });
      mockRepository.save.mockRejectedValue(error);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error updating bean batch' });
    });
  });

  describe('remove', () => {
    it('should delete a bean batch', async () => {
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        bean: { id: '1' },
        roastDate: new Date('2023-01-01'),
      });
      mockRepository.remove.mockResolvedValue({ affected: 1 });
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.remove(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.remove).toHaveBeenCalledWith({
        id: '1',
        bean: { id: '1' },
        roastDate: new Date('2023-01-01'),
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.send).toHaveBeenCalled();
    });

    it('should handle bean batch not found on deletion', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.remove(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Bean batch not found' });
    });

    it('should handle database errors during deletion', async () => {
      const error = new Error('Database delete failed');
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        bean: { id: '1' },
        roastDate: new Date('2023-01-01'),
      });
      mockRepository.remove.mockRejectedValue(error);
      
      const BeanBatchController = (await import('../../../controllers/beanBatch.controller')).BeanBatchController;
      const controller = new BeanBatchController();
      
      await controller.remove(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error deleting bean batch' });
    });
  });
});
