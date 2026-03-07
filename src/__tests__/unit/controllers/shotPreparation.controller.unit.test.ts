import { Request, Response } from 'express';
import { AppDataSource } from '../../../data-source';

// Mock the data source
jest.mock('../../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('ShotPreparationController', () => {
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
    it('should return all shot preparations', async () => {
      const mockPreparations = [
        { shot_id: '1', dose_grams: 18.5 },
        { shot_id: '2', dose_grams: 19.0 },
      ];

      mockRepository.find.mockResolvedValue(mockPreparations);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.find).toHaveBeenCalledWith();
      expect(mockResponse.json).toHaveBeenCalledWith(mockPreparations);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockRepository.find.mockRejectedValue(error);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error fetching shot preparations',
      });
    });
  });

  describe('one', () => {
    it('should return a single shot preparation by ID', async () => {
      const mockPreparation = { shot_id: '1', dose_grams: 18.5 };
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue(mockPreparation);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: '1' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockPreparation);
    });

    it('should handle shot preparation not found', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot preparation not found',
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockRejectedValue(error);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error fetching shot preparation',
      });
    });
  });

  describe('save', () => {
    it('should create a new shot preparation', async () => {
      const newPreparation = {
        dose_grams: '18.5',
        grind_setting: '15.0',
        basket_type: 'bottomless',
        basket_size_grams: '18',
      };
      const createdPreparation = {
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: null,
        tamp_type: null,
        tamp_pressure_category: null,
      };
      const savedPreparation = { shot_id: '1', ...createdPreparation };

      mockRequest.body = newPreparation;
      mockRepository.create.mockReturnValue(createdPreparation);
      mockRepository.save.mockResolvedValue(savedPreparation);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalledWith({
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: null,
        tamp_type: null,
        tamp_pressure_category: null,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdPreparation);
      expect((mockResponse.status as jest.Mock).mock.calls[0][0]).toBe(201);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith(
        savedPreparation
      );
    });

    it('should handle null values correctly', async () => {
      const newPreparation = { dose_grams: null, grind_setting: null };
      const createdPreparation = {
        dose_grams: null,
        grind_setting: null,
        basket_type: null,
        basket_size_grams: null,
        distribution_method: null,
        tamp_type: null,
        tamp_pressure_category: null,
      };
      const savedPreparation = { shot_id: '1', ...createdPreparation };

      mockRequest.body = newPreparation;
      mockRepository.create.mockReturnValue(createdPreparation);
      mockRepository.save.mockResolvedValue(savedPreparation);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalledWith({
        dose_grams: null,
        grind_setting: null,
        basket_type: null,
        basket_size_grams: null,
        distribution_method: null,
        tamp_type: null,
        tamp_pressure_category: null,
      });
    });

    it('should handle database errors during save', async () => {
      const error = new Error('Database save failed');
      mockRequest.body = { dose_grams: '18.5', grind_setting: '15.0' };
      mockRepository.create.mockReturnValue({ dose_grams: 18.5, grind_setting: 15.0 });
      mockRepository.save.mockRejectedValue(error);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error creating shot preparation',
      });
    });
  });

  describe('update', () => {
    it('should update an existing shot preparation', async () => {
      const existingPreparation = {
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
      };
      const updatedPreparation = {
        shot_id: '1',
        dose_grams: 19.0,
        grind_setting: 16.0,
        basket_type: 'portafilter',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { dose_grams: '19.0', grind_setting: '16.0', basket_type: 'portafilter' };
      mockRepository.findOne.mockResolvedValue(existingPreparation);
      mockRepository.save.mockResolvedValue(updatedPreparation);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: '1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedPreparation);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle shot preparation not found on update', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { dose_grams: '19.0' };
      mockRepository.findOne.mockResolvedValue(null);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot preparation not found',
      });
    });

    it('should handle partial updates', async () => {
      const existingPreparation = {
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { dose_grams: '19.0' }; // Only updating one field
      mockRepository.findOne.mockResolvedValue(existingPreparation);
      mockRepository.save.mockResolvedValue({ ...existingPreparation, dose_grams: 19.0 });

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingPreparation,
        dose_grams: 19.0,
      });
    });

    it('should handle basket_size_grams parseInt branch', async () => {
      const existingPreparation = {
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'puck',
        tamp_pressure_category: 'light',
      };
      const updatedPreparation = {
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 20, // Updated parseInt value
        distribution_method: 'WDT',
        tamp_type: 'puck',
        tamp_pressure_category: 'light',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { basket_size_grams: '20' }; // String to parseInt
      mockRepository.findOne.mockResolvedValue(existingPreparation);
      mockRepository.save.mockResolvedValue(updatedPreparation);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedPreparation);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle distribution_method null branch', async () => {
      const existingPreparation = {
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'puck',
        tamp_pressure_category: 'light',
      };
      const updatedPreparation = {
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: null, // Set to null
        tamp_type: 'puck',
        tamp_pressure_category: 'light',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { distribution_method: null }; // Explicit null
      mockRepository.findOne.mockResolvedValue(existingPreparation);
      mockRepository.save.mockResolvedValue(updatedPreparation);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedPreparation);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle tamp_type null branch', async () => {
      const existingPreparation = {
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'puck',
        tamp_pressure_category: 'light',
      };
      const updatedPreparation = {
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: null, // Set to null
        tamp_pressure_category: 'light',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { tamp_type: null }; // Explicit null
      mockRepository.findOne.mockResolvedValue(existingPreparation);
      mockRepository.save.mockResolvedValue(updatedPreparation);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedPreparation);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle tamp_pressure_category null branch', async () => {
      const existingPreparation = {
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'puck',
        tamp_pressure_category: 'light',
      };
      const updatedPreparation = {
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
        basket_type: 'bottomless',
        basket_size_grams: 18,
        distribution_method: 'WDT',
        tamp_type: 'puck',
        tamp_pressure_category: null, // Set to null
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { tamp_pressure_category: null }; // Explicit null
      mockRepository.findOne.mockResolvedValue(existingPreparation);
      mockRepository.save.mockResolvedValue(updatedPreparation);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalledWith(updatedPreparation);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreparation);
    });

    it('should handle database errors during update', async () => {
      const error = new Error('Database update failed');
      mockRequest.params = { id: '1' };
      mockRequest.body = { dose_grams: '19.0' };
      mockRepository.findOne.mockResolvedValue({ shot_id: '1', dose_grams: 18.5 });
      mockRepository.save.mockRejectedValue(error);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error updating shot preparation',
      });
    });
  });

  describe('remove', () => {
    it('should delete a shot preparation', async () => {
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
      });
      mockRepository.remove.mockResolvedValue({ affected: 1 });

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.remove).toHaveBeenCalledWith({
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.send).toHaveBeenCalled();
    });

    it('should handle shot preparation not found on deletion', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot preparation not found',
      });
    });

    it('should handle database errors during deletion', async () => {
      const error = new Error('Database delete failed');
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        shot_id: '1',
        dose_grams: 18.5,
        grind_setting: 15.0,
      });
      mockRepository.remove.mockRejectedValue(error);

      const ShotPreparationController = (
        await import('../../../controllers/shotPreparation.controller')
      ).ShotPreparationController;
      const controller = new ShotPreparationController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error deleting shot preparation',
      });
    });
  });
});
