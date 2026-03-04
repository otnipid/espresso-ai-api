import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Bean } from '../entities/Bean';

export class BeanController {
  private beanRepository = AppDataSource.getRepository(Bean);

  async all(request: Request, response: Response) {
    try {
      const beans = await this.beanRepository.find({
        relations: ['beanBatches'],
      });
      response.json(beans);
    } catch (error) {
      console.error('Error fetching beans:', error);
      response.status(500).json({ message: 'Error fetching beans' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const bean = await this.beanRepository.findOne({
        where: { id: request.params.id },
        relations: ['beanBatches'],
      });

      if (!bean) {
        return response.status(404).json({ message: 'Bean not found' });
      }

      response.json(bean);
    } catch (error) {
      console.error('Error fetching bean:', error);
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

      if (!name) {
        return response.status(400).json({ message: 'Name is required' });
      }

      const bean = this.beanRepository.create({
        name,
        roaster,
        country,
        region,
        farm,
        varietal,
        processing_method,
        altitude_m: altitude_m ? Number(altitude_m) : null,
        density_category,
      });

      const result = await this.beanRepository.save(bean);
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating bean:', error);
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

      const bean = await this.beanRepository.findOne({
        where: { id: request.params.id },
      });

      if (!bean) {
        return response.status(404).json({ message: 'Bean not found' });
      }

      // Only update fields that are provided in the request
      if (name !== undefined) bean.name = name;
      if (roaster !== undefined) bean.roaster = roaster;
      if (country !== undefined) bean.country = country;
      if (region !== undefined) bean.region = region;
      if (farm !== undefined) bean.farm = farm;
      if (varietal !== undefined) bean.varietal = varietal;
      if (processing_method !== undefined) bean.processing_method = processing_method;
      if (altitude_m !== undefined) bean.altitude_m = altitude_m ? Number(altitude_m) : null;
      if (density_category !== undefined) bean.density_category = density_category;

      const result = await this.beanRepository.save(bean);
      response.json(result);
    } catch (error) {
      console.error('Error updating bean:', error);
      response.status(500).json({ message: 'Error updating bean' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      const bean = await this.beanRepository.findOne({
        where: { id: request.params.id },
      });

      if (!bean) {
        return response.status(404).json({ message: 'Bean not found' });
      }

      await this.beanRepository.remove(bean);
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting bean:', error);
      response.status(500).json({ message: 'Error deleting bean' });
    }
  }
}

export default new BeanController();
