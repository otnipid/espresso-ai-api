import { Request, Response } from 'express';
import { AppDataSource } from '../../../data-source';

// Mock the data source
jest.mock('../../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    createQueryRunner: jest.fn(),
  },
}));

describe('ShotController', () => {
  let mockShotRepository: any;
  let mockShotPreparationRepository: any;
  let mockShotExtractionRepository: any;
  let mockQueryRunner: any;
  let mockRequest: Partial<Request>;
  let mockResponse: any;

  beforeEach(() => {
    mockShotRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockShotPreparationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockShotExtractionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest.fn(),
      },
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
      if (entity.name === 'Shot') return mockShotRepository;
      if (entity.name === 'ShotPreparation') return mockShotPreparationRepository;
      if (entity.name === 'ShotExtraction') return mockShotExtractionRepository;
      return mockShotRepository;
    });

    (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockQueryRunner);

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
    it('should return all shots', async () => {
      const mockShots = [
        { id: '1', machine: { id: '1' } },
        { id: '2', machine: { id: '2' } },
      ];

      mockShotRepository.find.mockResolvedValue(mockShots);

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      expect(mockShotRepository.find).toHaveBeenCalledWith({
        relations: ['machine', 'beanBatch', 'preparation', 'extraction'],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockShots);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockShotRepository.find.mockRejectedValue(error);

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error fetching shots',
      });
    });
  });

  describe('one', () => {
    it('should return a single shot by ID', async () => {
      const mockShot = { id: '1', machine: { id: '1' } };
      mockRequest.params = { id: '1' };
      mockShotRepository.findOne.mockResolvedValue(mockShot);

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockShotRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['machine', 'beanBatch', 'preparation', 'extraction'],
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockShot);
    });

    it('should handle shot not found', async () => {
      mockRequest.params = { id: '999' };
      mockShotRepository.findOne.mockResolvedValue(null);

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot not found',
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockRequest.params = { id: '1' };
      mockShotRepository.findOne.mockRejectedValue(error);

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error fetching shot',
      });
    });
  });

  describe('save', () => {
    it('should create a new shot', async () => {
      const newShot = {
        machineId: '1',
        beanBatchId: '1',
        preparation: { dose: 18.5 },
        extraction: { time: 25 },
        notes: 'Test shot',
      };

      const savedPrep = { id: 'prep1', dose: 18.5 };
      const savedExtr = { id: 'extr1', time: 25 };
      const savedShot = { id: '1', machine: { id: '1' }, beanBatch: { id: '1' } };

      mockRequest.body = newShot;
      mockShotPreparationRepository.create.mockReturnValue({ dose: 18.5 });
      mockShotExtractionRepository.create.mockReturnValue({ time: 25 });
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(savedPrep)
        .mockResolvedValueOnce(savedExtr)
        .mockResolvedValueOnce(savedShot);

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockShotPreparationRepository.create).toHaveBeenCalledWith({ dose: 18.5 });
      expect(mockShotExtractionRepository.create).toHaveBeenCalledWith({ time: 25 });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(3);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect((mockResponse.status as jest.Mock).mock.calls[0][0]).toBe(201);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith(
        savedShot
      );
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = { machineId: '1' }; // Missing required fields

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'machineId, beanBatchId, preparation, and extraction are required',
      });
    });

    it('should handle transaction rollback on error', async () => {
      const newShot = {
        machineId: '1',
        beanBatchId: '1',
        preparation: { dose: 18.5 },
        extraction: { time: 25 },
      };

      mockRequest.body = newShot;
      mockShotPreparationRepository.create.mockReturnValue({ dose: 18.5 });
      mockQueryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error creating shot',
      });
    });
  });

  describe('update', () => {
    it('should update an existing shot', async () => {
      const existingShot = {
        id: '1',
        machine: { id: '1' },
        beanBatch: { id: '1' },
        preparation: { id: 'prep1', dose: 18.5 },
        extraction: { id: 'extr1', time: 25 },
      };

      const updatedShot = {
        id: '1',
        machine: { id: '2' },
        beanBatch: { id: '2' },
        preparation: { id: 'prep1', dose: 19.0 },
        extraction: { id: 'extr1', time: 26 },
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        machineId: '2',
        beanBatchId: '2',
        preparation: { dose: 19.0 },
        extraction: { time: 26 },
      };
      mockShotRepository.findOne.mockResolvedValue(existingShot);
      mockQueryRunner.manager.save.mockResolvedValue(updatedShot);

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockShotRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['preparation', 'extraction'],
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(3);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(updatedShot);
    });

    it('should handle shot not found on update', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { machineId: '1' };
      mockShotRepository.findOne.mockResolvedValue(null);

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot not found',
      });
    });

    it('should handle preparation creation branch when preparation is null', async () => {
      const existingShot = {
        id: '1',
        machine: { id: '1' },
        preparation: null, // No preparation exists
        extraction: null,
      };
      const updatedShot = {
        id: '1',
        machine: { id: '1' },
        preparation: { id: 'prep1', dose: 18.5 }, // New preparation created
        extraction: null,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { preparation: { dose: 18.5 } };
      mockShotRepository.findOne.mockResolvedValue(existingShot);
      mockQueryRunner.manager.save.mockResolvedValue({ id: 'prep1', dose: 18.5 });

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });

    it('should handle extraction creation branch when extraction is null', async () => {
      const existingShot = {
        id: '1',
        machine: { id: '1' },
        preparation: null,
        extraction: null, // No extraction exists
      };
      const updatedShot = {
        id: '1',
        machine: { id: '1' },
        preparation: null,
        extraction: { id: 'extr1', time: 25 }, // New extraction created
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { extraction: { time: 25 } };
      mockShotRepository.findOne.mockResolvedValue(existingShot);
      mockQueryRunner.manager.save.mockResolvedValue({ id: 'extr1', time: 25 });

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      const error = new Error('Database update failed');
      mockRequest.params = { id: '1' };
      mockRequest.body = { machineId: '1' };
      mockShotRepository.findOne.mockResolvedValue({ id: '1', machine: { id: '1' } });
      mockQueryRunner.manager.save.mockRejectedValue(error);

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error updating shot',
      });
    });
  });

  describe('remove', () => {
    it('should delete a shot and its related entities', async () => {
      const existingShot = {
        id: '1',
        machine: { id: '1' },
        preparation: { id: 'prep1', dose: 18.5 },
        extraction: { id: 'extr1', time: 25 },
      };

      mockRequest.params = { id: '1' };
      mockShotRepository.findOne.mockResolvedValue(existingShot);
      mockShotRepository.remove.mockResolvedValue({ affected: 1 });
      mockShotPreparationRepository.remove.mockResolvedValue({ affected: 1 });
      mockShotExtractionRepository.remove.mockResolvedValue({ affected: 1 });

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockShotRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['preparation', 'extraction'],
      });
      expect(mockShotRepository.remove).toHaveBeenCalledWith(existingShot);
      expect(mockShotPreparationRepository.remove).toHaveBeenCalledWith(existingShot.preparation);
      expect(mockShotExtractionRepository.remove).toHaveBeenCalledWith(existingShot.extraction);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.send).toHaveBeenCalled();
    });

    it('should handle shot not found on deletion', async () => {
      mockRequest.params = { id: '999' };
      mockShotRepository.findOne.mockResolvedValue(null);

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot not found',
      });
    });

    it('should handle deletion without related entities', async () => {
      const existingShot = {
        id: '1',
        machine: { id: '1' },
        preparation: null,
        extraction: null,
      };

      mockRequest.params = { id: '1' };
      mockShotRepository.findOne.mockResolvedValue(existingShot);
      mockShotRepository.remove.mockResolvedValue({ affected: 1 });

      const ShotController = (await import('../../../controllers/shot.controller')).ShotController;
      const controller = new ShotController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockShotRepository.remove).toHaveBeenCalledWith(existingShot);
      expect(mockShotPreparationRepository.remove).not.toHaveBeenCalled();
      expect(mockShotExtractionRepository.remove).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.send).toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      const error = new Error('Database delete failed');
      mockRequest.params = { id: '1' };
      mockShotRepository.findOne.mockResolvedValue({
        id: '1',
        machine: { id: '1' },
        preparation: null,
        extraction: null,
      });
      mockShotRepository.remove.mockRejectedValue(error);

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
