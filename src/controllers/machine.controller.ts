import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Machine } from '../entities/Machine';

export class MachineController {
  private machineRepository = AppDataSource.getRepository(Machine);

  async all(request: Request, response: Response) {
    try {
      const machines = await this.machineRepository.find();
      response.json(machines);
    } catch (error) {
      console.error('Error fetching machine:', error);
      response.status(500).json({ message: 'Error fetching machines' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const machine = await this.machineRepository.findOne({
        where: { id: request.params.id },
      });

      if (!machine) {
        return response.status(404).json({ message: 'Machine not found' });
      }

      response.json(machine);
    } catch (error) {
      console.error('Error fetching machine:', error);
      response.status(500).json({ message: 'Error fetching machine' });
    }
  }

  async save(request: Request, response: Response) {
    try {
      const { model, firmware_version } = request.body;

      if (!model) {
        return response.status(400).json({ message: 'Model is required' });
      }

      const machine = this.machineRepository.create({
        model,
        firmware_version,
      });

      const result = await this.machineRepository.save(machine);
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating machine:', error);
      response.status(500).json({ message: 'Error creating machine' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      const { model, firmware_version } = request.body;

      const machine = await this.machineRepository.findOne({
        where: { id: request.params.id },
      });

      if (!machine) {
        return response.status(404).json({ message: 'Machine not found' });
      }

      machine.model = model || machine.model;
      if (firmware_version !== undefined) {
        machine.firmware_version = firmware_version;
      }

      const result = await this.machineRepository.save(machine);
      response.json(result);
    } catch (error) {
      console.error('Error updating machine:', error);
      response.status(500).json({ message: 'Error updating machine' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      const machine = await this.machineRepository.findOne({
        where: { id: request.params.id },
      });

      if (!machine) {
        return response.status(404).json({ message: 'Machine not found' });
      }

      await this.machineRepository.remove(machine);
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting machine:', error);
      response.status(500).json({ message: 'Error deleting machine' });
    }
  }
}

export default new MachineController();
