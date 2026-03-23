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
      response.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      response.status(500).json({ message: 'Error fetching users' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const user = await this.userService.getUserById(request.params.id);
      response.json(user);
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
      const { name, email } = request.body;

      const result = await this.userService.updateUser(request.params.id, {
        name,
        email,
      });
      response.json(result);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'User not found' });
      }
      response.status(500).json({ message: 'Error updating user' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
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
}

export default new UserController();
