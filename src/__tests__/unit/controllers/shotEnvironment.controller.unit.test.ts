import { Request, Response } from 'express';
import { AppDataSource } from '../../../data-source';

// Mock the data source
jest.mock('../../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('ShotEnvironmentController', () => {
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
    it('should return all shot environments', async () => {
      const mockEnvironments = [
        { id: '1', ambient_temp_c: 22.5 },
        { id: '2', ambient_temp_c: 23.0 },
      ];

      mockRepository.find.mockResolvedValue(mockEnvironments);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.find).toHaveBeenCalledWith();
      expect(mockResponse.json).toHaveBeenCalledWith(mockEnvironments);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockRepository.find.mockRejectedValue(error);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error fetching shot environments',
      });
    });
  });

  describe('one', () => {
    it('should return a single shot environment by ID', async () => {
      const mockEnvironment = { id: '1', ambient_temp_c: 22.5 };
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue(mockEnvironment);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockEnvironment);
    });

    it('should handle shot environment not found', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot environment not found',
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockRejectedValue(error);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error fetching shot environment',
      });
    });
  });

  describe('save', () => {
    it('should create a new shot environment', async () => {
      const newEnvironment = {
        ambient_temp_c: '22.5',
        humidity_percent: '65',
        water_source: 'tap',
        estimated_water_hardness_ppm: '150',
        machine_warmup_minutes: '10',
        shots_since_clean: '5',
      };
      const createdEnvironment = {
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      };
      const savedEnvironment = { id: '1', ...createdEnvironment };

      mockRequest.body = newEnvironment;
      mockRepository.create.mockReturnValue(createdEnvironment);
      mockRepository.save.mockResolvedValue(savedEnvironment);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdEnvironment);
      expect((mockResponse.status as jest.Mock).mock.calls[0][0]).toBe(201);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith(
        savedEnvironment
      );
    });

    it('should handle null values correctly', async () => {
      const newEnvironment = { ambient_temp_c: null, humidity_percent: null };
      const createdEnvironment = {
        ambient_temp_c: null,
        humidity_percent: null,
        water_source: undefined,
        estimated_water_hardness_ppm: null,
        machine_warmup_minutes: null,
        shots_since_clean: null,
      };
      const savedEnvironment = { id: '1', ...createdEnvironment };

      mockRequest.body = newEnvironment;
      mockRepository.create.mockReturnValue(createdEnvironment);
      mockRepository.save.mockResolvedValue(savedEnvironment);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ambient_temp_c: null,
        humidity_percent: null,
        water_source: undefined,
        estimated_water_hardness_ppm: null,
        machine_warmup_minutes: null,
        shots_since_clean: null,
      });
    });

    it('should handle numeric conversions', async () => {
      const newEnvironment = {
        ambient_temp_c: '23.5',
        humidity_percent: '70',
        estimated_water_hardness_ppm: '200',
        machine_warmup_minutes: '15',
        shots_since_clean: '8',
      };
      const createdEnvironment = {
        ambient_temp_c: 23.5,
        humidity_percent: 70,
        water_source: undefined,
        estimated_water_hardness_ppm: 200,
        machine_warmup_minutes: 15,
        shots_since_clean: 8,
      };
      const savedEnvironment = { id: '1', ...createdEnvironment };

      mockRequest.body = newEnvironment;
      mockRepository.create.mockReturnValue(createdEnvironment);
      mockRepository.save.mockResolvedValue(savedEnvironment);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ambient_temp_c: 23.5,
        humidity_percent: 70,
        water_source: undefined,
        estimated_water_hardness_ppm: 200,
        machine_warmup_minutes: 15,
        shots_since_clean: 8,
      });
    });

    it('should handle database errors during save', async () => {
      const error = new Error('Database save failed');
      mockRequest.body = { ambient_temp_c: '22.5', humidity_percent: '65' };
      mockRepository.create.mockReturnValue({ ambient_temp_c: 22.5, humidity_percent: 65 });
      mockRepository.save.mockRejectedValue(error);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error creating shot',
      });
    });
  });

  describe('update', () => {
    it('should update an existing shot environment', async () => {
      const existingEnvironment = {
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
      };
      const updatedEnvironment = {
        id: '1',
        ambient_temp_c: 23.0,
        humidity_percent: 70,
        water_source: 'filtered',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        ambient_temp_c: '23.0',
        humidity_percent: '70',
        water_source: 'filtered',
      };
      mockRepository.findOne.mockResolvedValue(existingEnvironment);
      mockRepository.save.mockResolvedValue(updatedEnvironment);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedEnvironment);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedEnvironment);
    });

    it('should handle shot environment not found on update', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { ambient_temp_c: '23.0' };
      mockRepository.findOne.mockResolvedValue(null);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot environment not found',
      });
    });

    it('should handle partial updates', async () => {
      const existingEnvironment = {
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
        estimated_water_hardness_ppm: 150,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { ambient_temp_c: '23.0' }; // Only updating one field
      mockRepository.findOne.mockResolvedValue(existingEnvironment);
      mockRepository.save.mockResolvedValue({ ...existingEnvironment, ambient_temp_c: 23.0 });

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingEnvironment,
        ambient_temp_c: 23.0,
      });
    });

    it('should handle estimated_water_hardness_ppm parseInt branch', async () => {
      const existingEnvironment = {
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      };
      const updatedEnvironment = {
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
        estimated_water_hardness_ppm: 200, // Updated parseInt value
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { estimated_water_hardness_ppm: '200' }; // String to parseInt
      mockRepository.findOne.mockResolvedValue(existingEnvironment);
      mockRepository.save.mockResolvedValue(updatedEnvironment);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedEnvironment);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedEnvironment);
    });

    it('should handle machine_warmup_minutes parseInt branch', async () => {
      const existingEnvironment = {
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      };
      const updatedEnvironment = {
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 15, // Updated parseInt value
        shots_since_clean: 5,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { machine_warmup_minutes: '15' }; // String to parseInt
      mockRepository.findOne.mockResolvedValue(existingEnvironment);
      mockRepository.save.mockResolvedValue(updatedEnvironment);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedEnvironment);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedEnvironment);
    });

    it('should handle shots_since_clean parseInt branch', async () => {
      const existingEnvironment = {
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 5,
      };
      const updatedEnvironment = {
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
        water_source: 'tap',
        estimated_water_hardness_ppm: 150,
        machine_warmup_minutes: 10,
        shots_since_clean: 8, // Updated parseInt value
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { shots_since_clean: '8' }; // String to parseInt
      mockRepository.findOne.mockResolvedValue(existingEnvironment);
      mockRepository.save.mockResolvedValue(updatedEnvironment);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedEnvironment);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedEnvironment);
    });

    it('should handle database errors during update', async () => {
      const error = new Error('Database update failed');
      mockRequest.params = { id: '1' };
      mockRequest.body = { ambient_temp_c: '23.0' };
      mockRepository.findOne.mockResolvedValue({ id: '1', ambient_temp_c: 22.5 });
      mockRepository.save.mockRejectedValue(error);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error updating shot',
      });
    });
  });

  describe('remove', () => {
    it('should delete a shot environment', async () => {
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
      });
      mockRepository.remove.mockResolvedValue({ affected: 1 });

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: '1' },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith({
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.send).toHaveBeenCalled();
    });

    it('should handle shot environment not found on deletion', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot environment not found',
      });
    });

    it('should handle database errors during deletion', async () => {
      const error = new Error('Database delete failed');
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        ambient_temp_c: 22.5,
        humidity_percent: 65,
      });
      mockRepository.remove.mockRejectedValue(error);

      const ShotEnvironmentController = (
        await import('../../../controllers/shotEnvironment.controller')
      ).ShotEnvironmentController;
      const controller = new ShotEnvironmentController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error deleting shot environment',
      });
    });
  });
});
