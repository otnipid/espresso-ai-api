import { DataSource, Repository } from 'typeorm';
import { Grinder } from '../entities/Grinder';

export interface GrinderCreateData {
  model: string;
  manufacturer?: string | null;
  burrType?: string | null;
  burrInstallDate?: string | Date | null;
  serialNumber?: string | null;
}

export interface GrinderUpdateData {
  model?: string;
  manufacturer?: string | null;
  burrType?: string | null;
  burrInstallDate?: string | Date | null;
  serialNumber?: string | null;
}

export class GrinderService {
  private grinderRepository: Repository<Grinder>;

  constructor(dataSource: DataSource) {
    this.grinderRepository = dataSource.getRepository(Grinder);
  }

  /**
   * Get all grinders with their related shots
   * @returns Promise<Grinder[]> Array of grinders with relations
   */
  async getAllGrinders(): Promise<Grinder[]> {
    try {
      return await this.grinderRepository.find({
        relations: ['shots'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching grinders: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a single grinder by ID with relations
   * @param id - Grinder UUID
   * @returns Promise<Grinder> Grinder with relations
   * @throws Error when grinder not found
   */
  async getGrinderById(id: string): Promise<Grinder> {
    try {
      const grinder = await this.grinderRepository.findOne({
        where: { id },
        relations: ['shots'],
      });

      if (!grinder) {
        throw new Error(`Grinder with ID ${id} not found`);
      }

      return grinder;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error fetching grinder: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new grinder with validation
   * @param grinderData - Grinder data to create
   * @returns Promise<Grinder> Created grinder
   * @throws Error when validation fails or database error occurs
   */
  async createGrinder(grinderData: GrinderCreateData): Promise<Grinder> {
    try {
      // Validate required fields
      if (!grinderData.model || grinderData.model.trim() === '') {
        throw new Error('Grinder model is required');
      }

      // Process burrInstallDate
      let processedBurrInstallDate: Date | null = null;
      if (grinderData.burrInstallDate !== undefined && grinderData.burrInstallDate !== null) {
        processedBurrInstallDate =
          typeof grinderData.burrInstallDate === 'string'
            ? new Date(grinderData.burrInstallDate)
            : grinderData.burrInstallDate;

        // Check if the date is invalid
        if (isNaN(processedBurrInstallDate.getTime())) {
          processedBurrInstallDate = null;
        }
      }

      const grinder = this.grinderRepository.create({
        model: grinderData.model.trim(),
        manufacturer: grinderData.manufacturer?.trim() || null,
        burrType: grinderData.burrType?.trim() || null,
        burrInstallDate: processedBurrInstallDate,
        serialNumber: grinderData.serialNumber?.trim() || null,
      });

      return await this.grinderRepository.save(grinder);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        throw error;
      }
      throw new Error(
        `Error creating grinder: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing grinder
   * @param id - Grinder UUID
   * @param updateData - Partial grinder data to update
   * @returns Promise<Grinder> Updated grinder
   * @throws Error when grinder not found
   */
  async updateGrinder(id: string, updateData: GrinderUpdateData): Promise<Grinder> {
    try {
      const existingGrinder = await this.grinderRepository.findOne({
        where: { id },
      });

      if (!existingGrinder) {
        throw new Error(`Grinder with ID ${id} not found`);
      }

      // Only update fields that are provided
      if (updateData.model !== undefined) {
        if (updateData.model.trim() === '') {
          throw new Error('Grinder model cannot be empty');
        }
        existingGrinder.model = updateData.model.trim();
      }

      if (updateData.manufacturer !== undefined) {
        existingGrinder.manufacturer = updateData.manufacturer?.trim() || null;
      }

      if (updateData.burrType !== undefined) {
        existingGrinder.burrType = updateData.burrType?.trim() || null;
      }

      if (updateData.burrInstallDate !== undefined) {
        if (updateData.burrInstallDate === null) {
          existingGrinder.burrInstallDate = null;
        } else {
          const processedDate =
            typeof updateData.burrInstallDate === 'string'
              ? new Date(updateData.burrInstallDate)
              : updateData.burrInstallDate;

          if (isNaN(processedDate.getTime())) {
            existingGrinder.burrInstallDate = null;
          } else {
            existingGrinder.burrInstallDate = processedDate;
          }
        }
      }

      if (updateData.serialNumber !== undefined) {
        existingGrinder.serialNumber = updateData.serialNumber?.trim() || null;
      }

      return await this.grinderRepository.save(existingGrinder);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error updating grinder: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a grinder
   * @param id - Grinder UUID
   * @returns Promise<boolean> True if deleted, false if not found
   */
  async deleteGrinder(id: string): Promise<boolean> {
    try {
      const existingGrinder = await this.grinderRepository.findOne({
        where: { id },
      });

      if (!existingGrinder) {
        throw new Error(`Grinder with ID ${id} not found`);
      }

      await this.grinderRepository.remove(existingGrinder);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error deleting grinder: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get grinders filtered by manufacturer
   * @param manufacturer - Manufacturer name to filter by
   * @returns Promise<Grinder[]> Array of matching grinders
   */
  async getGrindersByManufacturer(manufacturer: string): Promise<Grinder[]> {
    try {
      return await this.grinderRepository.find({
        where: { manufacturer: manufacturer },
        relations: ['shots'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching grinders by manufacturer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
