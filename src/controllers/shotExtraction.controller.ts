import { Request, Response } from 'express';
import { FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../data-source';
import { ShotExtraction } from '../entities/ShotExtraction';

export class ShotExtractionController {
  private extractionRepository = AppDataSource.getRepository(ShotExtraction);

  async all(request: Request, response: Response) {
    try {
      const extractions = await this.extractionRepository.find();
      response.json(extractions);
    } catch (error) {
      console.error('Error fetching shot extractions:', error);
      response.status(500).json({ message: 'Error fetching shot extractions' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const extraction = await this.extractionRepository.findOne({
        where: { id: request.params.id } as FindOptionsWhere<ShotExtraction>,
      });

      if (!extraction) {
        return response.status(404).json({ message: 'Shot extraction not found' });
      }

      response.json(extraction);
    } catch (error) {
      console.error('Error fetching shot extraction:', error);
      response.status(500).json({ message: 'Error fetching shot extraction' });
    }
  }

  async save(request: Request, response: Response) {
    try {
      const {
        yield_grams,
        shot_time_seconds,
        avg_pressure_bar,
        water_temp_c,
        preinfusion_seconds,
        peak_pressure_bar,
      } = request.body;

      const extraction = this.extractionRepository.create({
        yield_grams: yield_grams ? parseFloat(yield_grams) : null,
        shot_time_seconds: shot_time_seconds ? parseInt(shot_time_seconds) : null,
        avg_pressure_bar: avg_pressure_bar ? parseFloat(avg_pressure_bar) : null,
        water_temp_c: water_temp_c ? parseFloat(water_temp_c) : null,
        preinfusion_seconds: preinfusion_seconds ? parseInt(preinfusion_seconds) : null,
        peak_pressure_bar: peak_pressure_bar ? parseFloat(peak_pressure_bar) : null,
      });

      const result = await this.extractionRepository.save(extraction);
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating shot extraction:', error);
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

      const extraction = await this.extractionRepository.findOne({
        where: { shot_id: request.params.id } as FindOptionsWhere<ShotExtraction>,
      });

      if (!extraction) {
        return response.status(404).json({ message: 'Shot extraction not found' });
      }

      if (yield_grams !== undefined)
        extraction.yield_grams = yield_grams ? parseFloat(yield_grams) : null;
      if (shot_time_seconds !== undefined)
        extraction.shot_time_seconds = shot_time_seconds ? parseInt(shot_time_seconds) : null;
      if (avg_pressure_bar !== undefined)
        extraction.avg_pressure_bar = avg_pressure_bar ? parseFloat(avg_pressure_bar) : null;
      if (water_temp_c !== undefined)
        extraction.water_temp_c = water_temp_c ? parseFloat(water_temp_c) : null;
      if (preinfusion_seconds !== undefined)
        extraction.preinfusion_seconds = preinfusion_seconds ? parseInt(preinfusion_seconds) : null;
      if (peak_pressure_bar !== undefined)
        extraction.peak_pressure_bar = peak_pressure_bar ? parseFloat(peak_pressure_bar) : null;

      const result = await this.extractionRepository.save(extraction);
      response.json(result);
    } catch (error) {
      console.error('Error updating shot extraction:', error);
      response.status(500).json({ message: 'Error updating shot extraction' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      const extraction = await this.extractionRepository.findOne({
        where: { shot_id: request.params.id } as FindOptionsWhere<ShotExtraction>,
      });

      if (!extraction) {
        return response.status(404).json({ message: 'Shot extraction not found' });
      }

      await this.extractionRepository.remove(extraction);
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting shot extraction:', error);
      response.status(500).json({ message: 'Error deleting shot extraction' });
    }
  }
}

export default new ShotExtractionController();
