import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Shot } from '../entities/Shot';
import { ShotPreparation } from '../entities/ShotPreparation';
import { ShotExtraction } from '../entities/ShotExtraction';

export class ShotController {
  private shotRepository = AppDataSource.getRepository(Shot);
  private shotPreparationRepository = AppDataSource.getRepository(ShotPreparation);
  private shotExtractionRepository = AppDataSource.getRepository(ShotExtraction);

  async all(request: Request, response: Response) {
    try {
      const shots = await this.shotRepository.find({
        relations: ['machine', 'beanBatch', 'preparation', 'extraction'],
      });
      response.json(shots);
    } catch (error) {
      console.error('Error fetching shots:', error);
      response.status(500).json({ message: 'Error fetching shots' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const shot = await this.shotRepository.findOne({
        where: { id: request.params.id },
        relations: ['machine', 'beanBatch', 'preparation', 'extraction'],
      });

      if (!shot) {
        return response.status(404).json({ message: 'Shot not found' });
      }

      response.json(shot);
    } catch (error) {
      console.error('Error fetching shot:', error);
      response.status(500).json({ message: 'Error fetching shot' });
    }
  }

  async save(request: Request, response: Response) {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      const { machineId, beanBatchId, preparation, extraction, notes } = request.body;

      // Validate required fields
      if (!machineId || !beanBatchId || !preparation || !extraction) {
        return response.status(400).json({
          message: 'machineId, beanBatchId, preparation, and extraction are required',
        });
      }

      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Create preparation
      const prep = this.shotPreparationRepository.create(preparation);
      const savedPrep = await queryRunner.manager.save(prep);

      // Create extraction
      const extr = this.shotExtractionRepository.create(extraction);
      const savedExtr = await queryRunner.manager.save(extr);

      // Create shot
      const shotData = {
        machine: { id: machineId },
        beanBatch: { id: beanBatchId },
        preparation: savedPrep,
        extraction: savedExtr,
        notes: notes || null,
      };

      const result = await queryRunner.manager.save(shotData);

      await queryRunner.commitTransaction();
      response.status(201).json(result);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating shot:', error);
      response.status(500).json({ message: 'Error creating shot' });
    } finally {
      await queryRunner.release();
    }
  }

  async update(request: Request, response: Response) {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
      const { machineId, beanBatchId, preparation, extraction, notes } = request.body;

      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Find the shot with relations
      const shot = await this.shotRepository.findOne({
        where: { id: request.params.id },
        relations: ['preparation', 'extraction'],
      });

      if (!shot) {
        return response.status(404).json({ message: 'Shot not found' });
      }

      // Update basic fields
      if (machineId !== undefined) shot.machine = { id: machineId } as any;
      if (beanBatchId !== undefined) shot.beanBatch = { id: beanBatchId } as any;
      if (notes !== undefined) shot.notes = notes;

      // Update preparation if provided
      if (preparation) {
        if (!shot.preparation) {
          shot.preparation = new ShotPreparation();
        }
        Object.assign(shot.preparation, preparation);
        await queryRunner.manager.save(shot.preparation);
      }

      // Update extraction if provided
      if (extraction) {
        if (!shot.extraction) {
          shot.extraction = new ShotExtraction();
        }
        Object.assign(shot.extraction, extraction);
        await queryRunner.manager.save(shot.extraction);
      }

      const result = await queryRunner.manager.save(shot);

      await queryRunner.commitTransaction();
      response.json(result);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error updating shot:', error);
      response.status(500).json({ message: 'Error updating shot' });
    } finally {
      await queryRunner.release();
    }
  }

  async remove(request: Request, response: Response) {
    try {
      const shot = await this.shotRepository.findOne({
        where: { id: request.params.id },
        relations: ['preparation', 'extraction'],
      });

      if (!shot) {
        return response.status(404).json({ message: 'Shot not found' });
      }

      // Delete the shot and its related entities
      await this.shotRepository.remove(shot);

      if (shot.preparation) {
        await this.shotPreparationRepository.remove(shot.preparation);
      }

      if (shot.extraction) {
        await this.shotExtractionRepository.remove(shot.extraction);
      }

      response.status(204).send();
    } catch (error) {
      console.error('Error deleting shot:', error);
      response.status(500).json({ message: 'Error deleting shot' });
    }
  }
}

export default new ShotController();
