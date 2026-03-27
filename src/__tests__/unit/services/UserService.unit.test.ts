import { UserService } from '../../../services/UserService';
import { User } from '../../../entities/User';
import { DataSource } from 'typeorm';
import { createMockDataSource } from '../../__mocks__/data-source.mock';

// Mock data
const mockUserData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
};

describe('UserService', () => {
  let userService: UserService;
  let mockDataSource: DataSource;
  let mockUserRepository: any;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    mockUserRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findAndCount: jest.fn(),
    };

    mockDataSource.getRepository = jest.fn().mockReturnValue(mockUserRepository);
    userService = new UserService(mockDataSource);
  });

  describe('getAllUsers', () => {
    it('should return all users with relations', async () => {
      // Arrange
      const expectedUsers = [
        {
          id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          created_at: new Date(),
          updated_at: new Date(),
          shots: [],
          createdShots: [],
          updatedShots: [],
        },
        {
          id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          created_at: new Date(),
          updated_at: new Date(),
          shots: [],
          createdShots: [],
          updatedShots: [],
        },
      ];
      mockUserRepository.find.mockResolvedValue(expectedUsers);

      // Act
      const result = await userService.getAllUsers();

      // Assert
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        relations: ['shots', 'createdShots', 'updatedShots'],
      });
      expect(result).toEqual(expectedUsers);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockUserRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.getAllUsers()).rejects.toThrow('Database error');
    });
  });

  describe('getUserById', () => {
    it('should return user by ID with relations', async () => {
      // Arrange
      const userId = 'test-id';
      const expectedUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date(),
        shots: [],
        createdShots: [],
        updatedShots: [],
      };
      mockUserRepository.findOne.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['shots', 'createdShots', 'updatedShots'],
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 'non-existent-id';
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow(
        `User with ID ${userId} not found`
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const userId = 'test-id';
      const error = new Error('Database error');
      mockUserRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.getUserById(userId)).rejects.toThrow('Database error');
    });
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const expectedUser = {
        id: 'new-id',
        name: 'John Doe',
        email: 'john.doe@example.com',
        created_at: new Date(),
        updated_at: new Date(),
        shots: [],
        createdShots: [],
        updatedShots: [],
      };
      mockUserRepository.create.mockReturnValue(mockUserData);
      mockUserRepository.save.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(mockUserData);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(mockUserData);
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUserData);
      expect(result).toEqual(expectedUser);
    });

    it('should throw error when name is missing', async () => {
      // Arrange
      const invalidData = {
        name: '', // Empty string should trigger validation
        email: 'test@example.com',
      };

      // Act & Assert
      await expect(userService.createUser(invalidData)).rejects.toThrow('User name is required');
    });

    it('should throw error when name is empty string', async () => {
      // Arrange
      const invalidData = {
        name: '',
        email: 'test@example.com',
      };

      // Act & Assert
      await expect(userService.createUser(invalidData)).rejects.toThrow('User name is required');
    });

    it('should handle null email', async () => {
      // Arrange
      const userDataWithNullEmail = {
        name: 'Test User',
        email: null,
      };
      const expectedUser = {
        id: 'new-id',
        name: 'Test User',
        email: null,
        created_at: new Date(),
        updated_at: new Date(),
        shots: [],
        createdShots: [],
        updatedShots: [],
      };
      mockUserRepository.create.mockReturnValue(userDataWithNullEmail);
      mockUserRepository.save.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userDataWithNullEmail);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(userDataWithNullEmail);
      expect(result).toEqual(expectedUser);
    });

    it('should handle undefined email', async () => {
      // Arrange
      const userDataWithoutEmail = {
        name: 'Test User',
        // email is undefined
      };
      const expectedUser = {
        id: 'new-id',
        name: 'Test User',
        email: null,
        created_at: new Date(),
        updated_at: new Date(),
        shots: [],
        createdShots: [],
        updatedShots: [],
      };
      mockUserRepository.create.mockReturnValue({
        name: 'Test User',
        email: null,
      });
      mockUserRepository.save.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userDataWithoutEmail);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: null,
      });
      expect(result).toEqual(expectedUser);
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const error = new Error('Database error');
      mockUserRepository.create.mockReturnValue(mockUserData);
      mockUserRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.createUser(mockUserData)).rejects.toThrow('Database error');
    });
  });

  describe('updateUser', () => {
    it('should update existing user', async () => {
      // Arrange
      const userId = 'test-id';
      const existingUser = {
        id: userId,
        name: 'Old Name',
        email: 'old@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const updateData = {
        name: 'New Name',
        email: 'new@example.com',
      };
      const updatedUser = {
        ...existingUser,
        ...updateData,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUser(userId, updateData);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error when user not found for update', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const updateData = { name: 'New Name' };
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateUser(userId, updateData)).rejects.toThrow(
        `User with ID ${userId} not found`
      );
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const userId = 'test-id';
      const existingUser = {
        id: userId,
        name: 'Original Name',
        email: 'original@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const partialUpdate = { name: 'Updated Name' }; // Only updating name
      const updatedUser = { ...existingUser, name: 'Updated Name' };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUser(userId, partialUpdate);

      // Assert
      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe('original@example.com'); // Should remain unchanged
    });

    it('should handle null email in update', async () => {
      // Arrange
      const userId = 'test-id';
      const existingUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const updateData = { email: null };
      const updatedUser = {
        ...existingUser,
        email: null,
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUser(userId, updateData);

      // Assert
      expect(result.email).toBe(null);
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const userId = 'test-id';
      const updateData = { name: 'New Name' };
      const error = new Error('Database error');
      mockUserRepository.findOne.mockResolvedValue({ id: userId });
      mockUserRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.updateUser(userId, updateData)).rejects.toThrow('Database error');
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      // Arrange
      const userId = 'test-id';
      const existingUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date(),
        shots: [],
        createdShots: [],
        updatedShots: [],
      };
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.remove.mockResolvedValue(existingUser);

      // Act
      const result = await userService.deleteUser(userId);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(existingUser);
      expect(result).toBe(true);
    });

    it('should throw error when user not found for deletion', async () => {
      // Arrange
      const userId = 'non-existent-id';
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.deleteUser(userId)).rejects.toThrow(
        `User with ID ${userId} not found`
      );
    });

    it('should handle repository errors during deletion', async () => {
      // Arrange
      const userId = 'test-id';
      const error = new Error('Database error');
      mockUserRepository.findOne.mockResolvedValue({ id: userId });
      mockUserRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.deleteUser(userId)).rejects.toThrow('Database error');
    });
  });

  describe('getUsersByEmail', () => {
    it('should return users filtered by email', async () => {
      // Arrange
      const email = 'test@example.com';
      const expectedUsers = [
        {
          id: '1',
          name: 'User 1',
          email: 'test@example.com',
          created_at: new Date(),
          updated_at: new Date(),
          shots: [],
          createdShots: [],
          updatedShots: [],
        },
        {
          id: '2',
          name: 'User 2',
          email: 'test@example.com',
          created_at: new Date(),
          updated_at: new Date(),
          shots: [],
          createdShots: [],
          updatedShots: [],
        },
      ];
      mockUserRepository.find.mockResolvedValue(expectedUsers);

      // Act
      const result = await userService.getUsersByEmail(email);

      // Assert
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { email: email },
        relations: ['shots', 'createdShots', 'updatedShots'],
      });
      expect(result).toEqual(expectedUsers);
    });

    it('should return empty array when no users match email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockUserRepository.find.mockResolvedValue([]);

      // Act
      const result = await userService.getUsersByEmail(email);

      // Assert
      expect(result).toEqual([]);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { email: email },
        relations: ['shots', 'createdShots', 'updatedShots'],
      });
    });

    it('should handle repository errors when fetching by email', async () => {
      // Arrange
      const email = 'test@example.com';
      const error = new Error('Database error');
      mockUserRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(userService.getUsersByEmail(email)).rejects.toThrow('Database error');
    });
  });
});
