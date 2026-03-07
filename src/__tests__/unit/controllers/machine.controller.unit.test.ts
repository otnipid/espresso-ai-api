import { Request, Response } from 'express';
import { AppDataSource } from '../../../data-source';

// Mock the data source
jest.mock('../../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('MachineController', () => {
  let mockRepository: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

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
    it('should return all machines', async () => {
      const mockMachines = [
        { id: '1', model: 'Model1' },
        { id: '2', model: 'Model2' },
      ];

      mockRepository.find.mockResolvedValue(mockMachines);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.find).toHaveBeenCalledWith();
      expect(mockResponse.json).toHaveBeenCalledWith(mockMachines);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockRepository.find.mockRejectedValue(error);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error fetching machines',
      });
    });
  });

  describe('one', () => {
    it('should return a single machine by ID', async () => {
      const mockMachine = { id: '1', model: 'Model1' };
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue(mockMachine);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockMachine);
    });

    it('should handle machine not found', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Machine not found',
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockRejectedValue(error);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error fetching machine',
      });
    });
  });

  describe('save', () => {
    it('should create a new machine', async () => {
      const newMachine = { model: 'New Model' };
      const createdMachine = { model: 'New Model' };
      const savedMachine = { id: '1', ...createdMachine };

      mockRequest.body = newMachine;
      mockRepository.create.mockReturnValue(createdMachine);
      mockRepository.save.mockResolvedValue(savedMachine);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalledWith({
        model: 'New Model',
        firmware_version: undefined,
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        model: 'New Model',
        firmware_version: undefined,
      });
      expect((mockResponse.status as jest.Mock).mock.calls[0][0]).toBe(201);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith(
        savedMachine
      );
    });

    it('should handle missing model validation', async () => {
      mockRequest.body = { firmware_version: '1.0.0' }; // Missing model

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Model is required',
      });
    });

    it('should handle database errors during save', async () => {
      const error = new Error('Database save failed');
      mockRequest.body = { model: 'New Model' };
      mockRepository.create.mockReturnValue({ model: 'New Model' });
      mockRepository.save.mockRejectedValue(error);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error creating machine',
      });
    });
  });

  describe('update', () => {
    it('should update an existing machine', async () => {
      const updatedMachine = { id: '1', model: 'Updated Model' };

      mockRequest.params = { id: '1' };
      mockRequest.body = { model: 'Updated Model' };
      mockRepository.findOne.mockResolvedValue({ id: '1', model: 'Updated Model' });
      mockRepository.save.mockResolvedValue(updatedMachine);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(updatedMachine);
    });

    it('should handle machine not found on update', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { model: 'Updated Model' };
      mockRepository.findOne.mockResolvedValue(null);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Machine not found',
      });
    });

    it('should handle firmware_version conditional update', async () => {
      const existingMachine = { id: '1', model: 'Old Model', firmware_version: '1.0.0' };
      const updatedMachine = { id: '1', model: 'Old Model', firmware_version: '2.0.0' };

      mockRequest.params = { id: '1' };
      mockRequest.body = { firmware_version: '2.0.0' }; // Only update firmware_version
      mockRepository.findOne.mockResolvedValue(existingMachine);
      mockRepository.save.mockResolvedValue(updatedMachine);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(updatedMachine);
    });

    it('should handle database errors during update', async () => {
      const error = new Error('Database update failed');
      mockRequest.params = { id: '1' };
      mockRequest.body = { model: 'Updated Model' };
      mockRepository.findOne.mockResolvedValue({ id: '1', model: 'Old Model' });
      mockRepository.save.mockRejectedValue(error);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error updating machine',
      });
    });
  });

  describe('remove', () => {
    it('should delete a machine', async () => {
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        model: 'Test Model',
        firmware_version: '1.0.0',
      });
      mockRepository.remove.mockResolvedValue({ affected: 1 });

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.remove).toHaveBeenCalledWith({
        id: '1',
        model: 'Test Model',
        firmware_version: '1.0.0',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.send).toHaveBeenCalled();
    });

    it('should handle machine not found on deletion', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Machine not found',
      });
    });

    it('should handle database errors during deletion', async () => {
      const error = new Error('Database delete failed');
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        model: 'Test Model',
        firmware_version: '1.0.0',
      });
      mockRepository.remove.mockRejectedValue(error);

      const MachineController = (await import('../../../controllers/machine.controller'))
        .MachineController;
      const controller = new MachineController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error deleting machine',
      });
    });
  });
});
