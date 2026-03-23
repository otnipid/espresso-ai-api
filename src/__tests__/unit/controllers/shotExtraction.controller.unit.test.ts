import { Request, Response } from 'express';
import { ShotExtractionService } from '../../../services/ShotExtractionService';

// Mock ShotExtractionService
jest.mock('../../../services/ShotExtractionService');

describe('ShotExtractionController', () => {
  let mockShotExtractionService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: any;

  beforeEach(() => {
    mockShotExtractionService = {
      getAllShotExtractions: jest.fn(),
      getShotExtractionById: jest.fn(),
      createShotExtraction: jest.fn(),
      updateShotExtraction: jest.fn(),
      deleteShotExtraction: jest.fn(),
    };

    // Mock the service constructor
    (ShotExtractionService as jest.MockedClass<any>) = jest.fn().mockImplementation(() => mockShotExtractionService);

    mockRequest = {} as Request;
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe('all', () => {
    it('should return all shot extractions', async () => {
      // Test: Controller should call service and return HTTP response
      const mockExtractions = [
        { id: '1', yield_grams: 36.0 },
        { id: '2', yield_grams: 38.5 },
      ];

      mockShotExtractionService.getAllShotExtractions.mockResolvedValue(mockExtractions);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP interface, not repository calls
      expect(mockShotExtractionService.getAllShotExtractions).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockExtractions);
    });

    it('should handle errors', async () => {
      // Test: Controller should handle service errors and return HTTP error response
      const error = new Error('Database error');
      mockShotExtractionService.getAllShotExtractions.mockRejectedValue(error);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.all(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP error handling, not repository calls
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching shot extractions',
      });
    });
  });

  describe('one', () => {
    it('should return a single shot extraction by ID', async () => {
      // Test: Controller should call service with ID and return HTTP response
      const mockExtraction = { id: '1', yield_grams: 36.0 };
      mockRequest.params = { id: '1' };
      mockShotExtractionService.getShotExtractionById.mockResolvedValue(mockExtraction);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP interface, not repository calls
      expect(mockShotExtractionService.getShotExtractionById).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith(mockExtraction);
    });

    it('should handle shot extraction not found', async () => {
      // Test: Controller should handle service returning null and return 404
      mockRequest.params = { id: '999' };
      const error = new Error('Shot extraction not found');
      mockShotExtractionService.getShotExtractionById.mockRejectedValue(error);
      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.one(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP error handling, not repository calls
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Shot extraction not found',
      });
    });
  });

  describe('save', () => {
    it('should create a new shot extraction', async () => {
      // Test: Controller should pass data to service and return HTTP 201 response
      const newExtraction = {
        shot_id: '550e8400-e29b-41d4-a716-446655440002',
        yield_grams: '36.0',
        shot_time_seconds: '25',
        avg_pressure_bar: '9.0',
      };
      const createdExtraction = {
        id: '1',
        shot_id: '550e8400-e29b-41d4-a716-446655440002',
        yield_grams: 36.0,
        shot_time_seconds: 25,
        avg_pressure_bar: 9.0,
      };

      mockRequest.body = newExtraction;
      mockShotExtractionService.createShotExtraction.mockResolvedValue(createdExtraction);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP interface, not repository calls
      expect(mockShotExtractionService.createShotExtraction).toHaveBeenCalledWith(newExtraction);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdExtraction);
    });

    it('should handle null values correctly', async () => {
      // Test: Controller should pass null values to service and return HTTP response
      const newExtraction = { 
        shot_id: '550e8400-e29b-41d4-a716-446655440002',
        yield_grams: null, 
        shot_time_seconds: null 
      };
      const createdExtraction = { id: '1', ...newExtraction };

      mockRequest.body = newExtraction;
      mockShotExtractionService.createShotExtraction.mockResolvedValue(createdExtraction);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.save(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP interface, not repository calls
      expect(mockShotExtractionService.createShotExtraction).toHaveBeenCalledWith(newExtraction);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdExtraction);
    });
  });

  describe('update', () => {
    it('should update an existing shot extraction', async () => {
      // Test: Controller should pass ID and data to service and return HTTP response
      const existingExtraction = {
        id: '1',
        yield_grams: 36.0,
        shot_time_seconds: 25,
        avg_pressure_bar: 9.0,
      };
      const updatedExtraction = {
        id: '1',
        yield_grams: 38.0,
        shot_time_seconds: 27,
        avg_pressure_bar: 8.5,
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        yield_grams: '38.0',
        shot_time_seconds: '27',
        avg_pressure_bar: '8.5',
      };
      mockShotExtractionService.updateShotExtraction.mockResolvedValue(updatedExtraction);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP interface, not repository calls
      expect(mockShotExtractionService.updateShotExtraction).toHaveBeenCalledWith('1', {
        yield_grams: "38.0",
        shot_time_seconds: "27",
        avg_pressure_bar: "8.5",
        peak_pressure_bar: undefined,
        preinfusion_seconds: undefined,
        water_temp_c: undefined,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedExtraction);
    });

    it('should handle shot extraction not found on update', async () => {
      // Test: Controller should handle service returning null and return 404
      mockRequest.params = { id: '999' };
      mockRequest.body = { yield_grams: '38.0' };
      const error = new Error('Shot extraction not found');
      mockShotExtractionService.updateShotExtraction.mockRejectedValue(error);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP error handling, not repository calls
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Shot extraction not found',
      });
    });

    it('should handle partial updates', async () => {
      // Test: Controller should pass partial data to service and return HTTP response
      const existingExtraction = {
        id: '1',
        yield_grams: 36.0,
        shot_time_seconds: 25,
        avg_pressure_bar: 9.0,
        notes: 'Good extraction',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { yield_grams: '38.0' }; // Only updating one field
      mockShotExtractionService.updateShotExtraction.mockResolvedValue({ 
        ...existingExtraction, 
        yield_grams: 38.0 
      });

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.update(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP interface, not repository calls
      expect(mockShotExtractionService.updateShotExtraction).toHaveBeenCalledWith('1', {
        avg_pressure_bar: undefined,
        peak_pressure_bar: undefined,
        preinfusion_seconds: undefined,
        shot_time_seconds: undefined,
        water_temp_c: undefined,
        yield_grams: "38.0",
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        ...existingExtraction,
        yield_grams: 38.0,
      });
    });
  });

  describe('remove', () => {
    it('should delete a shot extraction', async () => {
      // Test: Controller should call service and return HTTP 204 response
      mockRequest.params = { id: '1' };
      mockShotExtractionService.deleteShotExtraction.mockResolvedValue(true);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP interface, not repository calls
      expect(mockShotExtractionService.deleteShotExtraction).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.send).toHaveBeenCalled();
    });

    it('should handle shot extraction not found on deletion', async () => {
      // Test: Controller should handle service returning false and return 404
      mockRequest.params = { id: '999' };
      mockShotExtractionService.deleteShotExtraction.mockResolvedValue(false);

      const ShotExtractionController = (
        await import('../../../controllers/shotExtraction.controller')
      ).ShotExtractionController;
      const controller = new ShotExtractionController();

      await controller.remove(mockRequest as Request, mockResponse as Response);

      // Assert: Test HTTP error handling, not repository calls
      expect(mockShotExtractionService.deleteShotExtraction).toHaveBeenCalledWith('999');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Shot extraction not found',
      });
    });
  });
});
