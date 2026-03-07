import { Request, Response } from 'express';
import { AppDataSource } from '../../../data-source';

// Mock the data source
jest.mock('../../../data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('ShotFeedbackController', () => {
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
    it('should return all shot feedbacks', async () => {
      const mockFeedbacks = [
        { id: '1', overall_score: 8 },
        { id: '2', overall_score: 7 },
      ];
      
      mockRepository.find.mockResolvedValue(mockFeedbacks);
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.all(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.find).toHaveBeenCalledWith();
      expect(mockResponse.json).toHaveBeenCalledWith(mockFeedbacks);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockRepository.find.mockRejectedValue(error);
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.all(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Error fetching shot feedbacks' });
    });
  });

  describe('one', () => {
    it('should return a single shot feedback by ID', async () => {
      const mockFeedback = { id: '1', overall_score: 8 };
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue(mockFeedback);
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.one(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockFeedback);
    });

    it('should handle shot feedback not found', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.one(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Shot feedback not found' });
    });
  });

  describe('save', () => {
    it('should create a new shot feedback', async () => {
      const newFeedback = {
        overall_score: '8',
        acidity: '7',
        sweetness: '6',
        bitterness: '5',
        body: '7',
        extraction_assessment: 'balanced',
        notes: 'Good shot',
      };
      const createdFeedback = {
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'balanced',
        notes: 'Good shot',
      };
      const savedFeedback = { id: '1', ...createdFeedback };
      
      mockRequest.body = newFeedback;
      mockRepository.create.mockReturnValue(createdFeedback);
      mockRepository.save.mockResolvedValue(savedFeedback);
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'balanced',
        notes: 'Good shot',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(createdFeedback);
      expect((mockResponse.status as jest.Mock).mock.calls[0][0]).toBe(201);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith(savedFeedback);
    });

    it('should handle null values correctly', async () => {
      const newFeedback = { overall_score: null, acidity: null };
      const createdFeedback = {
        overall_score: null,
        acidity: null,
        sweetness: null,
        bitterness: null,
        body: null,
        extraction_assessment: undefined,
        notes: undefined,
      };
      const savedFeedback = { id: '1', ...createdFeedback };
      
      mockRequest.body = newFeedback;
      mockRepository.create.mockReturnValue(createdFeedback);
      mockRepository.save.mockResolvedValue(savedFeedback);
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        overall_score: null,
        acidity: null,
        sweetness: null,
        bitterness: null,
        body: null,
        extraction_assessment: undefined,
        notes: undefined,
      });
    });

    it('should handle numeric conversions', async () => {
      const newFeedback = {
        overall_score: '9',
        acidity: '8',
        sweetness: '7',
        bitterness: '6',
        body: '8',
      };
      const createdFeedback = {
        overall_score: 9,
        acidity: 8,
        sweetness: 7,
        bitterness: 6,
        body: 8,
        extraction_assessment: undefined,
        notes: undefined,
      };
      const savedFeedback = { id: '1', ...createdFeedback };
      
      mockRequest.body = newFeedback;
      mockRepository.create.mockReturnValue(createdFeedback);
      mockRepository.save.mockResolvedValue(savedFeedback);
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.save(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.create).toHaveBeenCalledWith({
        overall_score: 9,
        acidity: 8,
        sweetness: 7,
        bitterness: 6,
        body: 8,
        extraction_assessment: undefined,
        notes: undefined,
      });
    });
  });

  describe('update', () => {
    it('should update an existing shot feedback', async () => {
      const existingFeedback = {
        id: '1',
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
      };
      const updatedFeedback = {
        id: '1',
        overall_score: 9,
        acidity: 8,
        sweetness: 7,
        bitterness: 6,
        body: 8,
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { overall_score: '9', acidity: '8', sweetness: '7', bitterness: '6', body: '8' };
      mockRepository.findOne.mockResolvedValue(existingFeedback);
      mockRepository.save.mockResolvedValue(updatedFeedback);
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: '1' },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(updatedFeedback);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedFeedback);
    });

    it('should handle shot feedback not found on update', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { overall_score: '9' };
      mockRepository.findOne.mockResolvedValue(null);
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Shot feedback not found' });
    });

    it('should handle partial updates', async () => {
      const existingFeedback = {
        id: '1',
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
        bitterness: 5,
        body: 7,
        extraction_assessment: 'balanced',
        notes: 'Good shot',
      };
      
      mockRequest.params = { id: '1' };
      mockRequest.body = { overall_score: '9' }; // Only updating one field
      mockRepository.findOne.mockResolvedValue(existingFeedback);
      mockRepository.save.mockResolvedValue({ ...existingFeedback, overall_score: 9 });
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.update(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingFeedback,
        overall_score: 9,
      });
    });
  });

  describe('remove', () => {
    it('should delete a shot feedback', async () => {
      mockRequest.params = { id: '1' };
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
      });
      mockRepository.remove.mockResolvedValue({ affected: 1 });
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.remove(mockRequest as Request, mockResponse as Response);
      
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { shot_id: '1' },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith({
        id: '1',
        overall_score: 8,
        acidity: 7,
        sweetness: 6,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.send).toHaveBeenCalled();
    });

    it('should handle shot feedback not found on deletion', async () => {
      mockRequest.params = { id: '999' };
      mockRepository.findOne.mockResolvedValue(null);
      
      const ShotFeedbackController = (await import('../../../controllers/shotFeedback.controller')).ShotFeedbackController;
      const controller = new ShotFeedbackController();
      
      await controller.remove(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({ message: 'Shot feedback not found' });
    });
  });
});
