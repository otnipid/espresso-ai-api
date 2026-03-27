import { Request, Response } from 'express';
import { BeanService } from '../services/BeanService';
import { Bean } from '../entities/Bean';

export class BeanController {
  private beanService: BeanService;

  constructor() {
    this.beanService = new BeanService(require('../data-source').AppDataSource);
  }

  async all(request: Request, response: Response) {
    try {
      const beans = await this.beanService.getAllBeans();
      response.json(beans);
    } catch (error) {
      console.error('Error fetching beans:', error);
      response.status(500).json({ message: 'Error fetching beans' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        throw new Error('Invalid bean ID. ID must be a string.');
      }
      const bean = await this.beanService.getBeanById(request.params.id);

      if (!bean) {
        return response.status(404).json({ message: 'Bean not found' });
      }

      response.json(bean);
    } catch (error) {
      console.error('Error fetching bean:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Bean not found' });
      }
      response.status(500).json({ message: 'Error fetching bean' });
    }
  }

  async save(request: Request, response: Response) {
    try {
      const {
        name,
        roaster,
        country,
        region,
        farm,
        varietal,
        processing_method,
        altitude_m,
        density_category,
      } = request.body;

      const result = await this.beanService.createBean({
        name,
        roaster,
        country,
        region,
        farm,
        varietal,
        processing_method,
        altitude_m,
        density_category,
      });
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating bean:', error);
      if (error instanceof Error && error.message.includes('required')) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error creating bean' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      const {
        name,
        roaster,
        country,
        region,
        farm,
        varietal,
        processing_method,
        altitude_m,
        density_category,
      } = request.body;

      if (typeof request.params.id !== 'string') {
        throw new Error('Invalid bean ID. ID must be a string.');
      }
      const result = await this.beanService.updateBean(request.params.id, {
        name,
        roaster,
        country,
        region,
        farm,
        varietal,
        processing_method,
        altitude_m,
        density_category,
      });
      response.json(result);
    } catch (error) {
      console.error('Error updating bean:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Bean not found' });
      }
      response.status(500).json({ message: 'Error updating bean' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        throw new Error('Invalid bean ID. ID must be a string.');
      }
      const success = await this.beanService.deleteBean(request.params.id);
      if (!success) {
        return response.status(404).json({ message: 'Bean not found' });
      }
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting bean:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Bean not found' });
      }
      response.status(500).json({ message: 'Error deleting bean' });
    }
  }
}

export default new BeanController();
