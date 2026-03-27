import { Request, Response } from 'express';
import { GrinderService } from '../services/GrinderService';
import { Grinder } from '../entities/Grinder';

export class GrinderController {
  private grinderService: GrinderService;

  constructor() {
    this.grinderService = new GrinderService(require('../data-source').AppDataSource);
  }

  async all(request: Request, response: Response) {
    try {
      const grinders = await this.grinderService.getAllGrinders();
      response.status(200).json(grinders);
    } catch (error) {
      console.error('Error fetching grinders:', error);
      response.status(500).json({ message: 'Error fetching grinders' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid grinder ID. ID must be a string.' });
      }
      const grinder = await this.grinderService.getGrinderById(request.params.id);
      response.status(200).json(grinder);
    } catch (error) {
      console.error('Error fetching grinder:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Grinder not found' });
      }
      response.status(500).json({ message: 'Error fetching grinder' });
    }
  }

  async save(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid grinder ID. ID must be a string.' });
      }
      const { model, manufacturer, burrType, burrInstallDate, serialNumber } = request.body;

      const result = await this.grinderService.createGrinder({
        model,
        manufacturer,
        burrType,
        burrInstallDate,
        serialNumber,
      });
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating grinder:', error);
      if (error instanceof Error && error.message.includes('required')) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error creating grinder' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid grinder ID. ID must be a string.' });
      }
      const { model, manufacturer, burrType, burrInstallDate, serialNumber } = request.body;

      const result = await this.grinderService.updateGrinder(request.params.id, {
        model,
        manufacturer,
        burrType,
        burrInstallDate,
        serialNumber,
      });
      response.status(200).json(result);
    } catch (error) {
      console.error('Error updating grinder:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Grinder not found' });
      }
      if (error instanceof Error && error.message.includes('cannot be empty')) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error updating grinder' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid grinder ID. ID must be a string.' });
      }
      await this.grinderService.deleteGrinder(request.params.id);
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting grinder:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Grinder not found' });
      }
      response.status(500).json({ message: 'Error deleting grinder' });
    }
  }

  async getGrindersByManufacturer(request: Request, response: Response) {
    try {
      const { manufacturer } = request.query;

      if (!manufacturer || typeof manufacturer !== 'string') {
        return response.status(400).json({ message: 'Manufacturer parameter is required' });
      }

      const grinders = await this.grinderService.getGrindersByManufacturer(manufacturer);
      response.status(200).json(grinders);
    } catch (error) {
      console.error('Error fetching grinders by manufacturer:', error);
      response.status(500).json({ message: 'Error fetching grinders by manufacturer' });
    }
  }
}

export default new GrinderController();
