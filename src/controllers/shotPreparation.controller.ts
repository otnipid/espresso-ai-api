import { FindOptionsWhere } from 'typeorm';
import { Request, Response } from 'express';
import { ShotPreparationService } from '../services/ShotPreparationService';
import { ShotPreparation } from '../entities/ShotPreparation';

export class ShotPreparationController {
  private shotPreparationService: ShotPreparationService;

  constructor() {
    this.shotPreparationService = new ShotPreparationService(
      require('../data-source').AppDataSource
    );
  }

  async all(request: Request, response: Response) {
    try {
      const preparations = await this.shotPreparationService.getAllShotPreparations();
      response.json(preparations);
    } catch (error) {
      console.error('Error fetching shot preparations:', error);
      response.status(500).json({ message: 'Error fetching shot preparations' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response
          .status(400)
          .json({ message: 'Invalid shot preparation ID. ID must be a string.' });
      }
      const preparation = await this.shotPreparationService.getShotPreparationById(
        request.params.id
      );

      if (!preparation) {
        return response.status(404).json({ message: 'Shot preparation not found' });
      }

      response.json(preparation);
    } catch (error) {
      console.error('Error fetching shot preparation:', error);
      response.status(500).json({ message: 'Error fetching shot preparation' });
    }
  }

  async save(request: Request, response: Response) {
    try {
      const {
        shot_id,
        dose_grams,
        burr_setting,
        side_hopper,
        basket_type,
        basket_size_grams,
        distribution_method,
        tamp_type,
        tamp_pressure_category,
      } = request.body;

      const result = await this.shotPreparationService.createShotPreparation({
        shot_id,
        dose_grams,
        burr_setting,
        side_hopper,
        basket_type,
        basket_size_grams,
        distribution_method,
        tamp_type,
        tamp_pressure_category,
      });
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating shot preparation:', error);
      if (error instanceof Error && error.message.includes('required')) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error creating shot preparation' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response
          .status(400)
          .json({ message: 'Invalid shot preparation ID. ID must be a string.' });
      }
      const {
        dose_grams,
        burr_setting,
        side_hopper,
        basket_type,
        basket_size_grams,
        distribution_method,
        tamp_type,
        tamp_pressure_category,
      } = request.body;

      const result = await this.shotPreparationService.updateShotPreparation(request.params.id, {
        dose_grams,
        burr_setting,
        side_hopper,
        basket_type,
        basket_size_grams,
        distribution_method,
        tamp_type,
        tamp_pressure_category,
      });
      response.json(result);
    } catch (error) {
      console.error('Error updating shot preparation:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Shot preparation not found' });
      }
      response.status(500).json({ message: 'Error updating shot preparation' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response
          .status(400)
          .json({ message: 'Invalid shot preparation ID. ID must be a string.' });
      }
      await this.shotPreparationService.deleteShotPreparation(request.params.id);

      response.status(204).send();
    } catch (error) {
      console.error('Error deleting shot preparation:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Shot preparation not found' });
      }
      response.status(500).json({ message: 'Error deleting shot preparation' });
    }
  }
}

export default new ShotPreparationController();
