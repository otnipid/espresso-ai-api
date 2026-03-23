import { Request, Response } from 'express';
import { FindOptionsWhere } from 'typeorm';
import { ShotExtractionService } from '../services/ShotExtractionService';
import { ShotExtraction } from '../entities/ShotExtraction';

export class ShotExtractionController {
  private shotExtractionService: ShotExtractionService;

  constructor() {
    this.shotExtractionService = new ShotExtractionService(require('../data-source').AppDataSource);
  }

  async all(request: Request, response: Response) {
    try {
      const extractions = await this.shotExtractionService.getAllShotExtractions();
      response.json(extractions);
    } catch (error) {
      console.error('Error fetching shot extractions:', error);
      response.status(500).json({ message: 'Error fetching shot extractions' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const extraction = await this.shotExtractionService.getShotExtractionById(request.params.id);
      response.json(extraction);
    } catch (error) {
      console.error('Error fetching shot extraction:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Shot extraction not found' });
      }
      response.status(500).json({ message: 'Error fetching shot extraction' });
    }
  }

  async save(request: Request, response: Response) {
    try {
      const {
        shot_id,
        yield_grams,
        shot_time_seconds,
        avg_pressure_bar,
        water_temp_c,
        preinfusion_seconds,
        peak_pressure_bar,
      } = request.body;

      const result = await this.shotExtractionService.createShotExtraction({
        shot_id,
        yield_grams,
        shot_time_seconds,
        avg_pressure_bar,
        water_temp_c,
        preinfusion_seconds,
        peak_pressure_bar,
      });
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating shot extraction:', error);
      if (error instanceof Error && error.message.includes('required')) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error creating shot extraction' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      const {
        yield_grams,
        shot_time_seconds,
        avg_pressure_bar,
        water_temp_c,
        preinfusion_seconds,
        peak_pressure_bar,
      } = request.body;

      const result = await this.shotExtractionService.updateShotExtraction(request.params.id, {
        yield_grams,
        shot_time_seconds,
        avg_pressure_bar,
        water_temp_c,
        preinfusion_seconds,
        peak_pressure_bar,
      });

      response.json(result);
    } catch (error) {
      console.error('Error updating shot extraction:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Shot extraction not found' });
      }
      response.status(500).json({ message: 'Error updating shot extraction' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      const success = await this.shotExtractionService.deleteShotExtraction(request.params.id);
      if (!success) {
        return response.status(404).json({ message: 'Shot extraction not found' });
      }
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting shot extraction:', error);
      response.status(500).json({ message: 'Error deleting shot extraction' });
    }
  }
}

export default new ShotExtractionController();
