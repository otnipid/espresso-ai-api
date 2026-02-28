import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ShotEnvironment } from '../entities/shotEnvironment';
import { FindOptionsWhere } from 'typeorm';

export class ShotEnvironmentController {
  private shotEnvironmentRepository = AppDataSource.getRepository(ShotEnvironment);

  async all(request: Request, response: Response) {
    try {
      const environments = await this.shotEnvironmentRepository.find();
      response.json(environments);
    } catch (error) {
      console.error('Error fetching shot environments:', error);
      response.status(500).json({ message: 'Error fetching shot environments' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const environment = await this.shotEnvironmentRepository.findOne({
        where: { id: request.params.id } as FindOptionsWhere<ShotEnvironment>,
      });

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

      const environment = this.shotEnvironmentRepository.create({
        ambient_temp_c: ambient_temp_c ? parseFloat(ambient_temp_c) : null,
        humidity_percent: humidity_percent ? parseInt(humidity_percent) : null,
        water_source: water_source,
        estimated_water_hardness_ppm: estimated_water_hardness_ppm
          ? parseInt(estimated_water_hardness_ppm)
          : null,
        machine_warmup_minutes: machine_warmup_minutes ? parseInt(machine_warmup_minutes) : null,
        shots_since_clean: shots_since_clean ? parseInt(shots_since_clean) : null,
      });

      const result = await this.shotEnvironmentRepository.save(environment);
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating shot:', error);
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

      // Find the shot with relations
      const environment = await this.shotEnvironmentRepository.findOne({
        where: { id: request.params.id } as FindOptionsWhere<ShotEnvironment>,
      });

      if (!environment) {
        return response.status(404).json({ message: 'Shot environment not found' });
      }

      // Update basic fields
      if (ambient_temp_c !== undefined)
        environment.ambient_temp_c = ambient_temp_c ? parseFloat(ambient_temp_c) : null;
      if (humidity_percent !== undefined)
        environment.humidity_percent = humidity_percent ? parseInt(humidity_percent) : null;
      if (water_source !== undefined) environment.water_source = water_source;
      if (estimated_water_hardness_ppm !== undefined)
        environment.estimated_water_hardness_ppm = estimated_water_hardness_ppm
          ? parseInt(estimated_water_hardness_ppm)
          : null;
      if (machine_warmup_minutes !== undefined)
        environment.machine_warmup_minutes = machine_warmup_minutes
          ? parseInt(machine_warmup_minutes)
          : null;
      if (shots_since_clean !== undefined)
        environment.shots_since_clean = shots_since_clean ? parseInt(shots_since_clean) : null;

      const result = await this.shotEnvironmentRepository.save(environment);
      response.json(result);
    } catch (error) {
      console.error('Error updating shot:', error);
      response.status(500).json({ message: 'Error updating shot' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      const environment = await this.shotEnvironmentRepository.findOne({
        where: { shot_id: request.params.id } as FindOptionsWhere<ShotEnvironment>,
      });

      if (!environment) {
        return response.status(404).json({ message: 'Shot environment not found' });
      }

      await this.shotEnvironmentRepository.remove(environment);
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting shot environment:', error);
      response.status(500).json({ message: 'Error deleting shot environment' });
    }
  }
}

export default new ShotEnvironmentController();
