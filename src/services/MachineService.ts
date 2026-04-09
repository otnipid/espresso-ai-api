import { DataSource, Repository, Like } from 'typeorm';
import { Machine } from '../entities/Machine';

export interface MachineCreateData {
  model: string;
  manufacturer?: string | null;
  firmware_version?: string | null;
}

export interface MachineUpdateData {
  model?: string;
  manufacturer?: string | null;
  firmware_version?: string | null;
}

export class MachineService {
  private machineRepository: Repository<Machine>;

  constructor(dataSource: DataSource) {
    this.machineRepository = dataSource.getRepository(Machine);
  }

  /**
   * Get all machines with their related shots
   * @returns Promise<Machine[]> Array of machines with relations
   */
  async getAllMachines(): Promise<Machine[]> {
    try {
      return await this.machineRepository.find({
        relations: ['shots'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching machines: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a single machine by ID with relations
   * @param id - Machine UUID
   * @returns Promise<Machine> Machine with relations
   * @throws Error when machine not found
   */
  async getMachineById(id: string): Promise<Machine> {
    try {
      const machine = await this.machineRepository.findOne({
        where: { id },
        relations: ['shots'],
      });

      if (!machine) {
        throw new Error(`Machine with ID ${id} not found`);
      }

      return machine;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error fetching machine: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new machine with validation
   * @param machineData - Machine data to create
   * @returns Promise<Machine> Created machine
   * @throws Error when validation fails or database error occurs
   */
  async createMachine(machineData: MachineCreateData): Promise<Machine> {
    try {
      // Validate required fields
      if (!machineData.model || machineData.model.trim() === '') {
        throw new Error('Machine model is required');
      }

      // Process firmware_version
      let processedFirmwareVersion: string | null = null;
      if (machineData.firmware_version !== undefined && machineData.firmware_version !== null) {
        processedFirmwareVersion = machineData.firmware_version.trim() || null;
      }

      // Process manufacturer
      let processedManufacturer: string | null = null;
      if (machineData.manufacturer !== undefined && machineData.manufacturer !== null) {
        processedManufacturer = machineData.manufacturer.trim() || null;
      }

      const machine = this.machineRepository.create({
        model: machineData.model.trim(),
        manufacturer: processedManufacturer,
        firmware_version: processedFirmwareVersion,
      });

      return await this.machineRepository.save(machine);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        throw error;
      }
      throw new Error(
        `Error creating machine: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing machine
   * @param id - Machine UUID
   * @param updateData - Partial machine data to update
   * @returns Promise<Machine> Updated machine
   * @throws Error when machine not found
   */
  async updateMachine(id: string, updateData: MachineUpdateData): Promise<Machine> {
    try {
      const existingMachine = await this.machineRepository.findOne({
        where: { id },
      });

      if (!existingMachine) {
        throw new Error(`Machine with ID ${id} not found`);
      }

      // Only update fields that are provided
      if (updateData.model !== undefined) {
        if (updateData.model.trim() === '') {
          throw new Error('Machine model cannot be empty');
        }
        existingMachine.model = updateData.model.trim();
      }

      if (updateData.manufacturer !== undefined) {
        existingMachine.manufacturer =
          updateData.manufacturer === null ? null : updateData.manufacturer?.trim() || null;
      }

      if (updateData.firmware_version !== undefined) {
        existingMachine.firmware_version =
          updateData.firmware_version === null ? null : updateData.firmware_version?.trim() || null;
      }

      return await this.machineRepository.save(existingMachine);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error updating machine: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a machine
   * @param id - Machine UUID
   * @returns Promise<boolean> True if deleted, false if not found
   */
  async deleteMachine(id: string): Promise<boolean> {
    try {
      const existingMachine = await this.machineRepository.findOne({
        where: { id },
      });

      if (!existingMachine) {
        throw new Error(`Machine with ID ${id} not found`);
      }

      await this.machineRepository.remove(existingMachine);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error deleting machine: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get machines filtered by model name
   * @param model - Model name to search for
   * @returns Promise<Machine[]> Array of matching machines
   */
  async getMachinesByModel(model: string): Promise<Machine[]> {
    try {
      return await this.machineRepository.find({
        where: {
          model: Like(`%${model}%`), // Use TypeORM Like operator
        },
        relations: ['shots'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching machines by model: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
