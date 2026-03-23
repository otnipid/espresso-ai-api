import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { UserService } from '../../services/UserService';
import { User } from '../../entities/User';
import { Repository } from 'typeorm';

// This is crucial: tell Vitest to replace the real '../../data-source' module
// with our mock, so we can control what getDataSource() returns in tests.
vi.mock('../../data-source');

describe('UserService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let userService: UserService;
  let userRepository: Repository<User>;

  // Start single container ONCE before all tests in this file
  beforeAll(async () => {
    await containerManager.initialize();
  }, 60000); // Increase timeout for container init

  // Stop single container ONCE after all tests in this file are done
  afterAll(async () => {
    await containerManager.teardown();
  }, 60000); // Increase timeout for container teardown

  // Restore snapshot and get a fresh DB connection BEFORE EACH test
  beforeEach(async () => {
    testDb = await containerManager.setupTestDatabase();

    // Point mocked getDataSource function to return our test database DataSource
    vi.mocked(getDataSource).mockReturnValue(testDb.dataSource);

    // Initialize service with mocked DataSource
    userService = new UserService(testDb.dataSource);

    // Get repository for test data setup
    userRepository = testDb.dataSource.getRepository(User);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  describe('createUser', () => {
    it('should create a user with all fields', async () => {
      // Arrange: Create test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      // Act: Call service method
      const result = await userService.createUser(userData);

      // Assert: Verify user was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a user with only required fields', async () => {
      // Arrange: Create test data with only required fields
      const userData = {
        name: 'Jane Smith',
      };

      // Act: Call service method
      const result = await userService.createUser(userData);

      // Assert: Verify user was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Jane Smith');
      expect(result.email).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should trim whitespace from name and email', async () => {
      // Arrange: Create test data with extra whitespace
      const userData = {
        name: '  Bob Johnson  ',
        email: '  bob.johnson@example.com  ',
      };

      // Act: Call service method
      const result = await userService.createUser(userData);

      // Assert: Verify whitespace is trimmed
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Bob Johnson');
      expect(result.email).toBe('bob.johnson@example.com');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should handle empty email by setting it to null', async () => {
      // Arrange: Create test data with empty email
      const userData = {
        name: 'Alice Brown',
        email: '', // Empty string
      };

      // Act: Call service method
      const result = await userService.createUser(userData);

      // Assert: Verify empty email is set to null
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Alice Brown');
      expect(result.email).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should throw error when name is missing', async () => {
      // Arrange: Create user data with missing name
      const userData = {
        name: '', // Empty name
        email: 'test@example.com',
      };

      // Act & Assert: Should throw error for missing name
      await expect(userService.createUser(userData)).rejects.toThrow('User name is required');
    });

    it('should throw error when name is only whitespace', async () => {
      // Arrange: Create user data with whitespace-only name
      const userData = {
        name: '   ', // Whitespace only
        email: 'test@example.com',
      };

      // Act & Assert: Should throw error for whitespace-only name
      await expect(userService.createUser(userData)).rejects.toThrow('User name is required');
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange: Create test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const user = await userService.createUser(userData);

      // Act: Get user by ID
      const result = await userService.getUserById(user.id);

      // Assert: Verify user is returned
      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should throw error when user not found', async () => {
      // Act & Assert: Should throw error for non-existent user
      await expect(userService.getUserById('550e8400-e29b-41d4-a716-446655440001')).rejects.toThrow(
        'User with ID 550e8400-e29b-41d4-a716-446655440001 not found'
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      // Arrange: Create test data with multiple users
      const userData1 = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const userData2 = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      };

      const user1 = await userService.createUser(userData1);
      const user2 = await userService.createUser(userData2);

      // Act: Get all users
      const result = await userService.getAllUsers();

      // Assert: Verify all users are returned
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(user1.id);
      expect(result[1].id).toBe(user2.id);
      expect(result[0].name).toBe('John Doe');
      expect(result[1].name).toBe('Jane Smith');
    });

    it('should return empty array when no users exist', async () => {
      // Act: Get all users
      const result = await userService.getAllUsers();

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('getUsersByEmail', () => {
    it('should return users filtered by email', async () => {
      // Arrange: Create test data with multiple users
      const userData1 = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const userData2 = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      };

      const userData3 = {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com', // Different email to avoid unique constraint
      };

      const user1 = await userService.createUser(userData1);
      const user2 = await userService.createUser(userData2);
      const user3 = await userService.createUser(userData3);

      // Act: Get users by email
      const result = await userService.getUsersByEmail('john.doe@example.com');

      // Assert: Verify user with matching email is returned
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(user1.id);
      expect(result[0].email).toBe('john.doe@example.com');
    });

    it('should return empty array when no users match email', async () => {
      // Arrange: Create users with different emails
      const userData1 = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const userData2 = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      };

      await userService.createUser(userData1);
      await userService.createUser(userData2);

      // Act: Get users by non-existent email
      const result = await userService.getUsersByEmail('nonexistent@example.com');

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no users exist', async () => {
      // Act: Get users by email
      const result = await userService.getUsersByEmail('test@example.com');

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateUser', () => {
    it('should update existing user', async () => {
      // Arrange: Create test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const user = await userService.createUser(userData);

      const updateData = {
        name: 'John Smith',
        email: 'john.smith@example.com',
      };

      // Act: Update user
      const result = await userService.updateUser(user.id, updateData);

      // Assert: Verify user was updated
      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.name).toBe('John Smith');
      expect(result.email).toBe('john.smith@example.com');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should handle partial updates correctly', async () => {
      // Arrange: Create test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const user = await userService.createUser(userData);

      const updateData = {
        name: 'John Smith',
      };

      // Act: Update user partially
      const result = await userService.updateUser(user.id, updateData);

      // Assert: Verify only specified fields were updated
      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.name).toBe('John Smith');
      expect(result.email).toBe('john.doe@example.com'); // Should remain unchanged
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should handle null values in updates', async () => {
      // Arrange: Create test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const user = await userService.createUser(userData);

      const updateData = {
        email: null,
      };

      // Act: Update user with null email
      const result = await userService.updateUser(user.id, updateData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.name).toBe('John Doe'); // Should remain unchanged
      expect(result.email).toBeNull();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should trim whitespace in updates', async () => {
      // Arrange: Create test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const user = await userService.createUser(userData);

      const updateData = {
        name: '  John Smith  ',
        email: '  john.smith@example.com  ',
      };

      // Act: Update user with whitespace
      const result = await userService.updateUser(user.id, updateData);

      // Assert: Verify whitespace is trimmed
      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.name).toBe('John Smith');
      expect(result.email).toBe('john.smith@example.com');
    });

    it('should handle empty strings in updates by setting them to null', async () => {
      // Arrange: Create test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const user = await userService.createUser(userData);

      const updateData = {
        email: '', // Empty string
      };

      // Act: Update user with empty string
      const result = await userService.updateUser(user.id, updateData);

      // Assert: Verify empty string is set to null
      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.name).toBe('John Doe'); // Should remain unchanged
      expect(result.email).toBeNull();
    });

    it('should throw error when updating non-existent user', async () => {
      // Act & Assert: Should throw error for non-existent user
      const updateData = {
        name: 'John Smith',
      };
      await expect(
        userService.updateUser('550e8400-e29b-41d4-a716-446655440002', updateData)
      ).rejects.toThrow('User with ID 550e8400-e29b-41d4-a716-446655440002 not found');
    });

    it('should throw error when updating with empty name', async () => {
      // Arrange: Create test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const user = await userService.createUser(userData);

      const updateData = {
        name: '', // Empty name
      };

      // Act & Assert: Should throw error for empty name
      await expect(userService.updateUser(user.id, updateData)).rejects.toThrow(
        'User name cannot be empty'
      );
    });

    it('should throw error when updating with whitespace-only name', async () => {
      // Arrange: Create test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const user = await userService.createUser(userData);

      const updateData = {
        name: '   ', // Whitespace only
      };

      // Act & Assert: Should throw error for whitespace-only name
      await expect(userService.updateUser(user.id, updateData)).rejects.toThrow(
        'User name cannot be empty'
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      // Arrange: Create test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const user = await userService.createUser(userData);

      // Act: Delete user
      const result = await userService.deleteUser(user.id);

      // Assert: Verify deletion was successful
      expect(result).toBe(true);
    });

    it('should throw error when deleting non-existent user', async () => {
      // Act & Assert: Should throw error for non-existent user
      await expect(userService.deleteUser('550e8400-e29b-41d4-a716-446655440003')).rejects.toThrow(
        'User with ID 550e8400-e29b-41d4-a716-446655440003 not found'
      );
    });
  });
});
