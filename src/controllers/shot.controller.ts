import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ShotService, CreateShotData, UpdateShotData } from '../services/ShotService';

export class ShotController {
  private shotService: ShotService;

  constructor() {
    this.shotService = new ShotService(AppDataSource);
  }

  async all(request: Request, response: Response) {
    try {
      // Extract query parameters for filtering
      const filters = {
        machineId: request.query.machineId as string,
        beanBatchId: request.query.beanBatchId as string,
        shot_type: request.query.shot_type as string,
        success: request.query.success ? request.query.success === 'true' : undefined,
        dateFrom: request.query.dateFrom ? new Date(request.query.dateFrom as string) : undefined,
        dateTo: request.query.dateTo ? new Date(request.query.dateTo as string) : undefined,
        page: request.query.page ? parseInt(request.query.page as string) : undefined,
        limit: request.query.limit ? parseInt(request.query.limit as string) : undefined,
        sortBy: request.query.sortBy as string,
        sortOrder: request.query.sortOrder as 'ASC' | 'DESC',
      };

      const result = await this.shotService.getShots(filters);
      response.json(result);
    } catch (error) {
      console.error('Error fetching shots:', error);
      response.status(500).json({ message: 'Error fetching shots' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const shot = await this.shotService.getShotById(request.params.id);

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
    try {
      // Extract and validate shot data from request body
      const shotData: CreateShotData = {
        machineId: request.body.machineId,
        beanBatchId: request.body.beanBatchId,
        shot_type: request.body.shot_type,
        pulled_at: request.body.pulled_at ? new Date(request.body.pulled_at) : undefined,
        success: request.body.success,
        notes: request.body.notes,
        preparation: request.body.preparation,
        extraction: request.body.extraction,
        environment: request.body.environment,
        feedback: request.body.feedback,
      };

      // Let the service handle validation and business logic
      const shot = await this.shotService.createShot(shotData);
      response.status(201).json(shot);
    } catch (error) {
      console.error('Error creating shot:', error);
      response.status(400).json({ message: (error as Error).message || 'Error creating shot' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      // Extract and validate update data from request body
      const updateData: UpdateShotData = {
        machineId: request.body.machineId,
        beanBatchId: request.body.beanBatchId,
        shot_type: request.body.shot_type,
        pulled_at: request.body.pulled_at ? new Date(request.body.pulled_at) : undefined,
        success: request.body.success,
        notes: request.body.notes,
        preparation: request.body.preparation,
        extraction: request.body.extraction,
        environment: request.body.environment,
        feedback: request.body.feedback,
      };

      const shot = await this.shotService.updateShot(request.params.id, updateData);
      response.json(shot);
    } catch (error) {
      console.error('Error updating shot:', error);
      response.status(400).json({ message: (error as Error).message || 'Error updating shot' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      const success = await this.shotService.hardDeleteShot(request.params.id);

      if (!success) {
        return response.status(404).json({ message: 'Shot not found' });
      }

      response.status(204).send();
    } catch (error) {
      console.error('Error deleting shot:', error);
      response.status(500).json({ message: 'Error deleting shot' });
    }
  }
}

export default new ShotController();
