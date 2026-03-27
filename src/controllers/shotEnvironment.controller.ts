import { Request, Response } from 'express';
import { ShotEnvironmentService } from '../services/ShotEnvironmentService';
import { ShotEnvironment } from '../entities/shotEnvironment';

export class ShotEnvironmentController {
  private shotEnvironmentService: ShotEnvironmentService;

  constructor() {
    this.shotEnvironmentService = new ShotEnvironmentService(
      require('../data-source').AppDataSource
    );
  }

  async all(request: Request, response: Response) {
    try {
      const environments = await this.shotEnvironmentService.getAllShotEnvironments();
      response.json(environments);
    } catch (error) {
      console.error('Error fetching shot environments:', error);
      response.status(500).json({ message: 'Error fetching shot environments' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const environment = await this.shotEnvironmentService.getShotEnvironmentById(
        request.params.id
      );

      if (!environment) {
        return response.status(404).json({ message: 'Shot environment not found' });
      }

      response.json(environment);
    } catch (error) {
      console.error('Error fetching shot environment:', error);
      response.status(500).json({ message: 'Error fetching shot environment' });
    }
  }

  async save(request: Request, response: Response) {
    try {
      const {
        ambient_temp_c,
        humidity_percent,
        water_source,
        estimated_water_hardness_ppm,
        machine_warmup_minutes,
        shots_since_clean,
      } = request.body;

      const result = await this.shotEnvironmentService.createShotEnvironment({
        shot_id: request.params.id,
        ambient_temp_c,
        humidity_percent,
        water_source,
        estimated_water_hardness_ppm,
        machine_warmup_minutes,
        shots_since_clean,
      });
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating shot:', error);
      if (error instanceof Error && error.message.includes('required')) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error creating shot' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      const {
        ambient_temp_c,
        humidity_percent,
        water_source,
        estimated_water_hardness_ppm,
        machine_warmup_minutes,
        shots_since_clean,
      } = request.body;

      const result = await this.shotEnvironmentService.updateShotEnvironment(request.params.id, {
        ambient_temp_c,
        humidity_percent,
        water_source,
        estimated_water_hardness_ppm,
        machine_warmup_minutes,
        shots_since_clean,
      });
      response.json(result);
    } catch (error) {
      console.error('Error updating shot:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Shot environment not found' });
      }
      response.status(500).json({ message: 'Error updating shot' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      await this.shotEnvironmentService.deleteShotEnvironment(request.params.id);
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting shot environment:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Shot environment not found' });
      }
      response.status(500).json({ message: 'Error deleting shot environment' });
    }
  }
}

export default new ShotEnvironmentController();
