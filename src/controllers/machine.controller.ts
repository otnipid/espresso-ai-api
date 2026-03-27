import { Request, Response } from 'express';
import { MachineService, MachineCreateData, MachineUpdateData } from '../services/MachineService';
import { Machine } from '../entities/Machine';

export class MachineController {
  private machineService: MachineService;

  constructor() {
    this.machineService = new MachineService(require('../data-source').AppDataSource);
  }

  async all(request: Request, response: Response) {
    try {
      const machines = await this.machineService.getAllMachines();
      response.json(machines);
    } catch (error) {
      console.error('Error fetching machines:', error);
      response.status(500).json({ message: 'Error fetching machines' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid machine ID. ID must be a string.' });
      }
      const machine = await this.machineService.getMachineById(request.params.id);

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

      const result = await this.machineService.createMachine({
        model,
        firmware_version,
      });
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating machine:', error);
      if (error instanceof Error && error.message.includes('required')) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error creating machine' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid machine ID. ID must be a string.' });
      }
      const updateData: MachineUpdateData = {
        model: request.body.model,
        firmware_version: request.body.firmware_version,
      };

      const machine = await this.machineService.updateMachine(request.params.id, updateData);

      if (!machine) {
        return response.status(404).json({ message: 'Machine not found' });
      }

      response.json(machine);
    } catch (error) {
      console.error('Error updating machine:', error);
      response.status(400).json({ message: (error as Error).message || 'Error updating machine' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      if (typeof request.params.id !== 'string') {
        return response.status(400).json({ message: 'Invalid machine ID. ID must be a string.' });
      }
      const success = await this.machineService.deleteMachine(request.params.id);
      response.status(204).send();

      if (!success) {
        return response.status(404).json({ message: 'Machine not found' });
      }

      response.status(204).send();
    } catch (error) {
      console.error('Error deleting machine:', error);
      response.status(500).json({ message: 'Error deleting machine' });
    }
  }
}

export default new MachineController();
