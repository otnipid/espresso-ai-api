import { Request, Response } from 'express';
import { MachineController } from '../../../controllers/machine.controller';
import { MachineService } from '../../../services/MachineService';

// Mock MachineService and data source
jest.mock('../../../services/MachineService');

describe('MachineController', () => {
  let machineController: MachineController;
  let mockMachineService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockMachineService = {
      getAllMachines: jest.fn(),
      getMachineById: jest.fn(),
      createMachine: jest.fn(),
      updateMachine: jest.fn(),
      deleteMachine: jest.fn(),
      getMachinesByModel: jest.fn(),
    } as any;

    // Mock the constructor to return our mock service
    (MachineService as jest.MockedClass<any>) = jest
      .fn()
      .mockImplementation(() => mockMachineService);

    // Initialize the controller
    machineController = new MachineController();

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
    it('should return all machines', async () => {
      // Arrange
      const mockMachines = [
        { id: '1', model: 'Model1' },
        { id: '2', model: 'Model2' },
      ];

      mockMachineService.getAllMachines.mockResolvedValue(mockMachines);

      // Act
      await machineController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMachineService.getAllMachines).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockMachines);
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockMachineService.getAllMachines.mockRejectedValue(error);

      // Act
      await machineController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching machines',
      });
    });
  });

  describe('one', () => {
    it('should return a single machine by ID', async () => {
      // Arrange
      const mockMachine = { id: '1', model: 'Test Machine' };
      mockRequest.params = { id: '1' };
      mockMachineService.getMachineById.mockResolvedValue(mockMachine);

      // Act
      await machineController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMachineService.getMachineById).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith(mockMachine);
    });

    it('should return 404 when machine not found', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      mockMachineService.getMachineById.mockResolvedValue(null as any);

      // Act
      await machineController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Machine not found',
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRequest.params = { id: '1' };
      mockMachineService.getMachineById.mockRejectedValue(error);

      // Act
      await machineController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching machine',
      });
    });
  });

  describe('save', () => {
    it('should create a new machine', async () => {
      // Arrange
      const machineData = { model: 'New Model', firmware_version: '1.0.0' };
      mockRequest.body = machineData;

      const createdMachine = { id: '3', ...machineData };
      mockMachineService.createMachine.mockResolvedValue(createdMachine);

      // Act
      await machineController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMachineService.createMachine).toHaveBeenCalledWith(machineData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdMachine);
    });

    it('should handle missing model validation', async () => {
      // Arrange
      const invalidData = { firmware_version: '1.0.0' }; // Missing model
      mockRequest.body = invalidData;
      mockMachineService.createMachine.mockRejectedValue(new Error('Machine model is required'));

      // Act
      await machineController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect((mockResponse.status as jest.Mock).mock.results[0].value.json).toHaveBeenCalledWith({
        message: 'Machine model is required',
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRequest.body = { model: 'Test Model' };
      mockMachineService.createMachine.mockRejectedValue(error);

      // Act
      await machineController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error creating machine',
      });
    });
  });

  describe('update', () => {
    it('should update an existing machine', async () => {
      // Arrange
      const existingMachine = { id: '1', model: 'Old Model' };
      const updateData = { model: 'Updated Model' };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      mockMachineService.updateMachine.mockResolvedValue({ ...existingMachine, ...updateData });

      // Act
      await machineController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMachineService.updateMachine).toHaveBeenCalledWith('1', updateData);
      expect(mockResponse.json).toHaveBeenCalledWith({ ...existingMachine, ...updateData });
    });

    it('should return 404 when updating non-existent machine', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      mockRequest.body = { model: 'Updated Model' };
      mockMachineService.updateMachine.mockResolvedValue(null);

      // Act
      await machineController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Machine not found',
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const updateData = { model: 'Updated Model' };
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      const error = new Error('Error updating machine');
      mockMachineService.updateMachine.mockRejectedValue(error);

      // Act
      await machineController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error updating machine',
      });
    });
  });

  describe('remove', () => {
    it('should delete an existing machine', async () => {
      // Arrange
      const existingMachine = { id: '1', model: 'Test Machine' };
      mockRequest.params = { id: '1' };
      mockMachineService.deleteMachine.mockResolvedValue(true);

      // Act
      await machineController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockMachineService.deleteMachine).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });

    it('should return 404 when deleting non-existent machine', async () => {
      // Arrange
      mockRequest.params = { id: 'non-existent' };
      mockMachineService.deleteMachine.mockResolvedValue(false);

      // Act
      await machineController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Machine not found',
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRequest.params = { id: '1' };
      mockMachineService.deleteMachine.mockRejectedValue(error);

      // Act
      await machineController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error deleting machine',
      });
    });
  });
});
