import { request, Request, Response } from 'express';
import { UserService } from '../../../services/UserService';
import { UserController } from '../../../controllers/user.controller';

// Mock service
jest.mock('../../../services/UserService');

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock service
    mockUserService = {
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getUsersByEmail: jest.fn(),
    } as any;

    // Mock the service constructor
    (UserService as jest.MockedClass<any>).mockImplementation(() => mockUserService);

    // Create controller instance with mocked service
    userController = new UserController();

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
    it('should return all users on success', async () => {
      // Arrange
      const mockUsers = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          email: 'john@example.com',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01'),
          shots: [],
          createdShots: [],
          updatedShots: [],
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Jane Smith',
          email: 'jane@example.com',
          created_at: new Date('2023-02-01'),
          updated_at: new Date('2023-02-01'),
          shots: [],
          createdShots: [],
          updatedShots: [],
        },
      ];

      mockUserService.getAllUsers.mockResolvedValue(mockUsers);

      // Act
      await userController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle errors when fetching users fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockUserService.getAllUsers.mockRejectedValue(error);

      // Act
      await userController.all(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching users' });
    });
  });

  describe('one', () => {
    it('should return user by ID on success', async () => {
      // Arrange
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        email: 'john@example.com',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        shots: [],
        createdShots: [],
        updatedShots: [],
      };

      mockUserService.getUserById.mockResolvedValue(mockUser);

      // Act
      await userController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      const error = new Error('User not found');
      mockUserService.getUserById.mockRejectedValue(error);
      mockRequest.params = { id: '999' };

      // Act
      await userController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle errors when fetching user by ID fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockUserService.getUserById.mockRejectedValue(error);
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      // Act
      await userController.one(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error fetching user' });
    });
  });

  describe('save', () => {
    it('should create user on success', async () => {
      // Arrange
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        email: 'john@example.com',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        shots: [],
        createdShots: [],
        updatedShots: [],
      };
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      mockUserService.createUser.mockResolvedValue(mockUser);

      // Act
      await userController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 400 when name is missing', async () => {
      // Arrange
      mockUserService.createUser.mockRejectedValue(new Error('User name is required'));

      mockRequest.body = {
        email: 'john@example.com',
        // name is missing
      };

      // Act
      await userController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User name is required',
      });
    });

    it('should return 400 when name is only whitespace', async () => {
      // Arrange
      mockUserService.createUser.mockRejectedValue(new Error('User name is required'));

      mockRequest.body = {
        email: 'john@example.com',
        name: '   ', // only whitespace
      };

      // Act
      await userController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User name is required',
      });
    });

    it('should handle errors when creating user fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockUserService.createUser.mockRejectedValue(error);

      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      // Act
      await userController.save(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error creating user',
      });
    });
  });

  describe('update', () => {
    it('should update user on success', async () => {
      // Arrange
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe Updated',
        email: 'john.updated@example.com',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
        shots: [],
        createdShots: [],
        updatedShots: [],
      };

      mockUserService.updateUser.mockResolvedValue(mockUser);

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockRequest.body = {
        name: 'John Doe Updated',
        email: 'john.updated@example.com',
      };

      // Act
      await userController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      const error = new Error('User not found');
      mockUserService.updateUser.mockRejectedValue(error);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'Updated Name',
      };

      // Act
      await userController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found',
      });
    });

    it('should return 400 when name is empty in update', async () => {
      // Arrange
      mockUserService.updateUser.mockRejectedValue(new Error('User name cannot be empty'));

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockRequest.body = {
        name: '',
      };

      // Act
      await userController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User name cannot be empty',
      });
    });

    it('should return 400 when name is only whitespace in update', async () => {
      // Arrange
      mockUserService.updateUser.mockRejectedValue(new Error('User name cannot be empty'));

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockRequest.body = {
        name: '   ', // only whitespace
      };

      // Act
      await userController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User name cannot be empty',
      });
    });

    it('should handle errors when updating user fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockUserService.updateUser.mockRejectedValue(error);

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockRequest.body = {
        name: 'Updated Name',
      };

      // Act
      await userController.update(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error updating user',
      });
    });
  });

  describe('remove', () => {
    it('should delete user on success', async () => {
      // Arrange
      mockUserService.deleteUser.mockResolvedValue(true);

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      // Act
      await userController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      const error = new Error('User not found');
      mockUserService.deleteUser.mockRejectedValue(error);

      mockRequest.params = { id: '999' };

      // Act
      await userController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User not found',
      });
    });

    it('should handle errors when deleting user fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockUserService.deleteUser.mockRejectedValue(error);

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      // Act
      await userController.remove(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error deleting user',
      });
    });
  });

  describe('getUsersByEmail', () => {
    it('should return users by email on success', async () => {
      // Arrange
      const mockUsers = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          email: 'john@example.com',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-01'),
          shots: [],
          createdShots: [],
          updatedShots: [],
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'John Smith',
          email: 'john@example.com',
          created_at: new Date('2023-02-01'),
          updated_at: new Date('2023-02-01'),
          shots: [],
          createdShots: [],
          updatedShots: [],
        },
      ];

      mockUserService.getUsersByEmail.mockResolvedValue(mockUsers);

      mockRequest.query = { email: 'john@example.com' };

      // Act
      await userController.getUsersByEmail(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle errors when fetching users by email fails', async () => {
      // Arrange
      const error = new Error('Database error');
      mockUserService.getUsersByEmail.mockRejectedValue(error);

      mockRequest.query = { email: 'john@example.com' };

      // Act
      await userController.getUsersByEmail(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching users by email',
      });
    });

    it('should handle missing email parameter', async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await userController.getUsersByEmail(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Email parameter is required',
      });
    });
  });
});
