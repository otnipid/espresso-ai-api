import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/User';

export interface UserCreateData {
  name: string;
  email?: string | null;
}

export interface UserUpdateData {
  name?: string;
  email?: string | null;
}

export class UserService {
  private userRepository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(User);
  }

  /**
   * Get all users with their related shots
   * @returns Promise<User[]> Array of users with relations
   */
  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userRepository.find({
        relations: ['shots', 'createdShots', 'updatedShots'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a single user by ID with relations
   * @param id - User UUID
   * @returns Promise<User> User with relations
   * @throws Error when user not found
   */
  async getUserById(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['shots', 'createdShots', 'updatedShots'],
      });

      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error fetching user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new user with validation
   * @param userData - User data to create
   * @returns Promise<User> Created user
   * @throws Error when validation fails or database error occurs
   */
  async createUser(userData: UserCreateData): Promise<User> {
    try {
      // Validate required fields
      if (!userData.name || userData.name.trim() === '') {
        throw new Error('User name is required');
      }

      const user = this.userRepository.create({
        name: userData.name.trim(),
        email: userData.email?.trim() || null,
      });

      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        throw error;
      }
      throw new Error(
        `Error creating user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing user
   * @param id - User UUID
   * @param updateData - Partial user data to update
   * @returns Promise<User> Updated user
   * @throws Error when user not found
   */
  async updateUser(id: string, updateData: UserUpdateData): Promise<User> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { id },
      });

      if (!existingUser) {
        throw new Error(`User with ID ${id} not found`);
      }

      // Only update fields that are provided
      if (updateData.name !== undefined) {
        if (updateData.name.trim() === '') {
          throw new Error('User name cannot be empty');
        }
        existingUser.name = updateData.name.trim();
      }

      if (updateData.email !== undefined) {
        existingUser.email = updateData.email?.trim() || null;
      }

      return await this.userRepository.save(existingUser);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a user
   * @param id - User UUID
   * @returns Promise<boolean> True if deleted, false if not found
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { id },
      });

      if (!existingUser) {
        throw new Error(`User with ID ${id} not found`);
      }

      await this.userRepository.remove(existingUser);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get users filtered by email
   * @param email - Email to filter by
   * @returns Promise<User[]> Array of matching users
   */
  async getUsersByEmail(email: string): Promise<User[]> {
    try {
      return await this.userRepository.find({
        where: { email: email },
        relations: ['shots', 'createdShots', 'updatedShots'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching users by email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
