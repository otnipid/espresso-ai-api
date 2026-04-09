import { Request, Response } from 'express';
import { BeanBatchService } from '../services/BeanBatchService';
import { BeanBatch } from '../entities/BeanBatch';

export class BeanBatchController {
  private beanBatchService: BeanBatchService;

  constructor() {
    this.beanBatchService = new BeanBatchService(require('../data-source').AppDataSource);
  }

  async all(request: Request, response: Response) {
    try {
      const batches = await this.beanBatchService.getAllBeanBatches();
      response.json(batches);
    } catch (error) {
      console.error('Error fetching bean batches:', error);
      response.status(500).json({ message: 'Error fetching bean batches' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response
          .status(400)
          .json({ message: 'Invalid bean batch ID. ID must be a string.' });
      }
      const batch = await this.beanBatchService.getBeanBatchById(request.params.id);

      if (!batch) {
        return response.status(404).json({ message: 'Bean batch not found' });
      }

      response.json(batch);
    } catch (error) {
      console.error('Error fetching bean batch:', error);
      response.status(500).json({ message: 'Error fetching bean batch' });
    }
  }

  async save(request: Request, response: Response) {
    try {
      const { name, roaster, country, roastDate, bagOpenDate, roastLevel } = request.body;

      const result = await this.beanBatchService.createBeanBatch({
        name,
        roaster,
        country,
        roastDate,
        bagOpenDate,
        roastLevel,
      });
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating bean batch:', error);
      if (
        error instanceof Error &&
        (error.message.includes('required') ||
          error.message.includes('not found') ||
          error.message.includes('Invalid'))
      ) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error creating bean batch' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response
          .status(400)
          .json({ message: 'Invalid bean batch ID. ID must be a string.' });
      }
      const { name, roaster, country, roastDate, bagOpenDate, roastLevel } = request.body;

      const result = await this.beanBatchService.updateBeanBatch(request.params.id, {
        name,
        roaster,
        country,
        roastDate,
        bagOpenDate,
        roastLevel,
      });
      if (!result) {
        return response.status(404).json({ message: 'Bean batch not found' });
      }
      response.json(result);
    } catch (error) {
      console.error('Error updating bean batch:', error);
      response.status(500).json({ message: 'Error updating bean batch' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response
          .status(400)
          .json({ message: 'Invalid bean batch ID. ID must be a string.' });
      }
      const success = await this.beanBatchService.deleteBeanBatch(request.params.id);
      if (!success) {
        return response.status(404).json({ message: 'Bean batch not found' });
      }
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting bean batch:', error);
      response.status(500).json({ message: 'Error deleting bean batch' });
    }
  }
}

export default new BeanBatchController();
