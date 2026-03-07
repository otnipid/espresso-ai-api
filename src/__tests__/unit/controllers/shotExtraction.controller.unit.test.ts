import { Request, Response } from 'express';
import { AppDataSource } from '../../../data-source';

// Mock the data source
jest.mock('../../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('ShotExtractionController', () => {
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
    it('should return all shot extractions', async () => {
      const mockExtractions = [
        { id: '1', yield_grams: 36.0 },
        { id: '2', yield_grams: 38.5 },
      ];

      mockRepository.find.mockResolvedValue(mockExtractions);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.find).toHaveBeenCalledWith();
      expect(mockResponse.json).toHaveBeenCalledWith(mockExtractions);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockRepository.find.mockRejectedValue(error);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Error fetching shot extractions',
      });
    });
  });

  describe('one', () => {
    it('should return a single shot extraction by ID', async () => {
      const mockExtraction = { id: '1', yield_grams: 36.0 };
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue(mockExtraction);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockExtraction);
    });

    it('should handle shot extraction not found', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot extraction not found',
      });
    });
  });

  describe('save', () => {
    it('should create a new shot extraction', async () => {
      const newExtraction = {
        yield_grams: '36.0',
        extraction_time_seconds: '25',
        pressure_bars: '9.0',
        notes: 'Good extraction',
      };
      const createdExtraction = {
        yield_grams: 36.0,
        extraction_time_seconds: 25,
        pressure_bars: 9.0,
        notes: 'Good extraction',
      };
      const savedExtraction = { id: '1', ...createdExtraction };

      mockRequest.body = newExtraction;
      mockRepository.create.mockReturnValue(createdExtraction);
      mockRepository.save.mockResolvedValue(savedExtraction);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalledWith({
        yield_grams: 36.0,
        extraction_time_seconds: 25,
        pressure_bars: 9.0,
        notes: 'Good extraction',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdExtraction);
      expect((mockResponse.status as jest.Mock).mock.calls[0][0]).toBe(201);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith(
        savedExtraction
      );
    });

    it('should handle null values correctly', async () => {
      const newExtraction = { yield_grams: null, extraction_time_seconds: null };
      const createdExtraction = {
        yield_grams: null,
        extraction_time_seconds: null,
        pressure_bars: null,
        notes: null,
      };
      const savedExtraction = { id: '1', ...createdExtraction };

      mockRequest.body = newExtraction;
      mockRepository.create.mockReturnValue(createdExtraction);
      mockRepository.save.mockResolvedValue(savedExtraction);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalledWith({
        yield_grams: null,
        extraction_time_seconds: null,
        pressure_bars: null,
        notes: null,
      });
    });

    it('should handle numeric conversions', async () => {
      const newExtraction = {
        yield_grams: '36.5',
        extraction_time_seconds: '27',
        pressure_bars: '8.5',
      };
      const createdExtraction = {
        yield_grams: 36.5,
        extraction_time_seconds: 27,
        pressure_bars: 8.5,
        notes: null,
      };
      const savedExtraction = { id: '1', ...createdExtraction };

      mockRequest.body = newExtraction;
      mockRepository.create.mockReturnValue(createdExtraction);
      mockRepository.save.mockResolvedValue(savedExtraction);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.create).toHaveBeenCalledWith({
        yield_grams: 36.5,
        extraction_time_seconds: 27,
        pressure_bars: 8.5,
        notes: null,
      });
    });
  });

  describe('update', () => {
    it('should update an existing shot extraction', async () => {
      const existingExtraction = {
        id: '1',
        yield_grams: 36.0,
        extraction_time_seconds: 25,
        pressure_bars: 9.0,
      };
      const updatedExtraction = {
        id: '1',
        yield_grams: 38.0,
        extraction_time_seconds: 27,
        pressure_bars: 8.5,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        yield_grams: '38.0',
        extraction_time_seconds: '27',
        pressure_bars: '8.5',
      };
      mockRepository.findOne.mockResolvedValue(existingExtraction);
      mockRepository.save.mockResolvedValue(updatedExtraction);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: '1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedExtraction);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedExtraction);
    });

    it('should handle shot extraction not found on update', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { yield_grams: '38.0' };
      mockRepository.findOne.mockResolvedValue(null);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot extraction not found',
      });
    });

    it('should handle partial updates', async () => {
      const existingExtraction = {
        id: '1',
        yield_grams: 36.0,
        extraction_time_seconds: 25,
        pressure_bars: 9.0,
        notes: 'Good extraction',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { yield_grams: '38.0' }; // Only updating one field
      mockRepository.findOne.mockResolvedValue(existingExtraction);
      mockRepository.save.mockResolvedValue({ ...existingExtraction, yield_grams: 38.0 });

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingExtraction,
        yield_grams: 38.0,
      });
    });
  });

  describe('remove', () => {
    it('should delete a shot extraction', async () => {
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        yield_grams: 36.0,
        extraction_time_seconds: 25,
      });
      mockRepository.remove.mockResolvedValue({ affected: 1 });

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: '1' },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith({
        id: '1',
        yield_grams: 36.0,
        extraction_time_seconds: 25,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.send).toHaveBeenCalled();
    });

    it('should handle shot extraction not found on deletion', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot extraction not found',
      });
    });
  });
});
