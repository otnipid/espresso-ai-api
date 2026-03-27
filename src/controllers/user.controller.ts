import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { User } from '../entities/User';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService(require('../data-source').AppDataSource);
  }

  async all(request: Request, response: Response) {
    try {
      const users = await this.userService.getAllUsers();
      response.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      response.status(500).json({ message: 'Error fetching users' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid user ID. ID must be a string.' });
      }
      const user = await this.userService.getUserById(request.params.id);
      response.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'User not found' });
      }
      response.status(500).json({ message: 'Error fetching user' });
    }
  }

  async save(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid user ID. ID must be a string.' });
      }
      const { name, email } = request.body;

      const result = await this.userService.createUser({
        name,
        email,
      });
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error && error.message.includes('required')) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error creating user' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid user ID. ID must be a string.' });
      }
      const { name, email } = request.body;

      const result = await this.userService.updateUser(request.params.id, {
        name,
        email,
      });
      response.status(200).json(result);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'User not found' });
      }
      if (error instanceof Error && error.message.includes('cannot be empty')) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error updating user' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid user ID. ID must be a string.' });
      }
      await this.userService.deleteUser(request.params.id);
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'User not found' });
      }
      response.status(500).json({ message: 'Error deleting user' });
    }
  }

  async getUsersByEmail(request: Request, response: Response) {
    try {
      const { email } = request.query;

      if (!email || typeof email !== 'string') {
        return response.status(400).json({ message: 'Email parameter is required' });
      }

      const users = await this.userService.getUsersByEmail(email);
      response.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users by email:', error);
      response.status(500).json({ message: 'Error fetching users by email' });
    }
  }
}

export default new UserController();
