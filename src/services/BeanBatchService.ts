import { DataSource, Repository } from 'typeorm';
import { BeanBatch } from '../entities/BeanBatch';

export interface BeanBatchCreateData {
  name: string;
  roaster?: string | null;
  country?: string | null;
  roastDate: string | Date;
  bagOpenDate?: string | Date | null;
  roastLevel?: string | null;
}

export interface BeanBatchUpdateData {
  name?: string;
  roaster?: string | null;
  country?: string | null;
  roastDate?: string | Date;
  bagOpenDate?: string | Date | null;
  roastLevel?: string | null;
}

export class BeanBatchService {
  private beanBatchRepository: Repository<BeanBatch>;

  constructor(dataSource: DataSource) {
    this.beanBatchRepository = dataSource.getRepository(BeanBatch);
  }

  /**
   * Get all bean batches with their related shots
   * @returns Promise<BeanBatch[]> Array of bean batches with relations
   */
  async getAllBeanBatches(): Promise<BeanBatch[]> {
    try {
      return await this.beanBatchRepository.find({
        relations: ['shots'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching bean batches: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a single bean batch by ID with relations
   * @param id - Bean batch UUID
   * @returns Promise<BeanBatch> Bean batch with relations
   * @throws Error when bean batch not found
   */
  async getBeanBatchById(id: string): Promise<BeanBatch> {
    try {
      const beanBatch = await this.beanBatchRepository.findOne({
        where: { id },
        relations: ['shots'],
      });

      if (!beanBatch) {
        throw new Error(`Bean batch with ID ${id} not found`);
      }

      return beanBatch;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error fetching bean batch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new bean batch with validation
   * @param beanBatchData - Bean batch data to create
   * @returns Promise<BeanBatch> Created bean batch
   * @throws Error when validation fails or database error occurs
   */
  async createBeanBatch(beanBatchData: BeanBatchCreateData): Promise<BeanBatch> {
    try {
      // Validate required fields
      if (!beanBatchData.name || beanBatchData.name.trim() === '') {
        throw new Error('Bean name is required');
      }
      if (!beanBatchData.roastDate) {
        throw new Error('Roast date is required');
      }

      // Process date fields
      const processedRoastDate =
        typeof beanBatchData.roastDate === 'string'
          ? new Date(beanBatchData.roastDate)
          : beanBatchData.roastDate;

      let processedBagOpenDate: Date | null | undefined;
      if (beanBatchData.bagOpenDate !== undefined && beanBatchData.bagOpenDate !== null) {
        processedBagOpenDate =
          typeof beanBatchData.bagOpenDate === 'string'
            ? new Date(beanBatchData.bagOpenDate)
            : beanBatchData.bagOpenDate;
      }

      // Validate dates
      if (isNaN(processedRoastDate.getTime())) {
        throw new Error('Invalid roast date format');
      }

      if (processedBagOpenDate && isNaN(processedBagOpenDate.getTime())) {
        throw new Error('Invalid bag open date format');
      }

      const beanBatch = this.beanBatchRepository.create({
        name: beanBatchData.name.trim(),
        roaster: beanBatchData.roaster?.trim() || null,
        country: beanBatchData.country?.trim() || null,
        roastDate: processedRoastDate,
        bagOpenDate: processedBagOpenDate || null,
        roastLevel: beanBatchData.roastLevel?.trim() || null,
      });

      return await this.beanBatchRepository.save(beanBatch);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('required') ||
          error.message.includes('not found') ||
          error.message.includes('Invalid'))
      ) {
        throw error;
      }
      throw new Error(
        `Error creating bean batch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing bean batch
   * @param id - Bean batch UUID
   * @param updateData - Partial bean batch data to update
   * @returns Promise<BeanBatch> Updated bean batch
   * @throws Error when bean batch not found
   */
  async updateBeanBatch(id: string, updateData: BeanBatchUpdateData): Promise<BeanBatch> {
    try {
      const existingBeanBatch = await this.beanBatchRepository.findOne({
        where: { id },
      });

      if (!existingBeanBatch) {
        throw new Error(`Bean batch with ID ${id} not found`);
      }

      // Process date fields if provided
      let processedRoastDate: Date | undefined = undefined;
      if (updateData.roastDate !== undefined) {
        processedRoastDate =
          typeof updateData.roastDate === 'string'
            ? new Date(updateData.roastDate)
            : updateData.roastDate;

        if (isNaN(processedRoastDate.getTime())) {
          throw new Error('Invalid roast date format');
        }
      }

      let processedBagOpenDate: Date | null | undefined = undefined;
      if (updateData.bagOpenDate !== undefined) {
        processedBagOpenDate =
          updateData.bagOpenDate === null
            ? null
            : typeof updateData.bagOpenDate === 'string'
              ? new Date(updateData.bagOpenDate)
              : updateData.bagOpenDate;

        if (processedBagOpenDate !== null && isNaN(processedBagOpenDate.getTime())) {
          throw new Error('Invalid bag open date format');
        }
      }

      // Only update fields that are provided
      if (updateData.name !== undefined) {
        existingBeanBatch.name = updateData.name?.trim() || '';
      }
      if (updateData.roaster !== undefined) {
        existingBeanBatch.roaster = updateData.roaster?.trim() || null;
      }
      if (updateData.country !== undefined) {
        existingBeanBatch.country = updateData.country?.trim() || null;
      }
      if (processedRoastDate !== undefined) {
        existingBeanBatch.roastDate = processedRoastDate;
      }
      if (processedBagOpenDate !== undefined) {
        existingBeanBatch.bagOpenDate = processedBagOpenDate;
      }
      if (updateData.roastLevel !== undefined) {
        existingBeanBatch.roastLevel = updateData.roastLevel?.trim() || null;
      }

      return await this.beanBatchRepository.save(existingBeanBatch);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error updating bean batch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a bean batch
   * @param id - Bean batch UUID
   * @returns Promise<boolean> True if deleted, false if not found
   */
  async deleteBeanBatch(id: string): Promise<boolean> {
    try {
      const existingBeanBatch = await this.beanBatchRepository.findOne({
        where: { id },
      });

      if (!existingBeanBatch) {
        throw new Error(`Bean batch with ID ${id} not found`);
      }

      await this.beanBatchRepository.remove(existingBeanBatch);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error deleting bean batch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
