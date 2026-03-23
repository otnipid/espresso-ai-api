import { DataSource, Repository } from 'typeorm';
import { BeanBatch } from '../entities/BeanBatch';
import { Bean } from '../entities/Bean';

export interface BeanBatchCreateData {
  beanId: string;
  roastDate: string | Date;
  bagOpenDate?: string | Date | null;
  roastLevel?: string | null;
  roastDegree?: number | null;
}

export interface BeanBatchUpdateData {
  roastDate?: string | Date;
  bagOpenDate?: string | Date | null;
  roastLevel?: string | null;
  roastDegree?: number | null;
}

export class BeanBatchService {
  private beanBatchRepository: Repository<BeanBatch>;
  private beanRepository: Repository<Bean>;

  constructor(dataSource: DataSource) {
    this.beanBatchRepository = dataSource.getRepository(BeanBatch);
    this.beanRepository = dataSource.getRepository(Bean);
  }

  /**
   * Get all bean batches with their related beans and shots
   * @returns Promise<BeanBatch[]> Array of bean batches with relations
   */
  async getAllBeanBatches(): Promise<BeanBatch[]> {
    try {
      return await this.beanBatchRepository.find({
        relations: ['bean', 'shots'],
      });
    } catch (error) {
      throw new Error(`Error fetching bean batches: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        relations: ['bean', 'shots'],
      });

      if (!beanBatch) {
        throw new Error(`Bean batch with ID ${id} not found`);
      }

      return beanBatch;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error fetching bean batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      if (!beanBatchData.beanId || beanBatchData.beanId.trim() === '') {
        throw new Error('Bean ID is required');
      }
      if (!beanBatchData.roastDate) {
        throw new Error('Roast date is required');
      }

      // Verify bean exists
      const bean = await this.beanRepository.findOne({
        where: { id: beanBatchData.beanId },
      });

      if (!bean) {
        throw new Error(`Bean with ID ${beanBatchData.beanId} not found`);
      }

      // Process date fields
      const processedRoastDate = typeof beanBatchData.roastDate === 'string' 
        ? new Date(beanBatchData.roastDate) 
        : beanBatchData.roastDate;

      let processedBagOpenDate: Date | null | undefined;
      if (beanBatchData.bagOpenDate !== undefined && beanBatchData.bagOpenDate !== null) {
        processedBagOpenDate = typeof beanBatchData.bagOpenDate === 'string' 
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

      // Validate roast degree if provided
      let processedRoastDegree: number | null | undefined = undefined;
      if (beanBatchData.roastDegree !== undefined && beanBatchData.roastDegree !== null) {
        processedRoastDegree = typeof beanBatchData.roastDegree === 'string' 
          ? parseFloat(beanBatchData.roastDegree) 
          : beanBatchData.roastDegree;
        
        if (isNaN(processedRoastDegree)) {
          processedRoastDegree = null;
        }
      }

      const beanBatch = this.beanBatchRepository.create({
        bean: bean,
        roastDate: processedRoastDate,
        bagOpenDate: processedBagOpenDate || null,
        roastLevel: beanBatchData.roastLevel?.trim() || null,
        roastDegree: processedRoastDegree || null,
      });

      return await this.beanBatchRepository.save(beanBatch);
    } catch (error) {
      if (error instanceof Error && (error.message.includes('required') || error.message.includes('not found') || error.message.includes('Invalid'))) {
        throw error;
      }
      throw new Error(`Error creating bean batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        processedRoastDate = typeof updateData.roastDate === 'string' 
          ? new Date(updateData.roastDate) 
          : updateData.roastDate;
        
        if (isNaN(processedRoastDate.getTime())) {
          throw new Error('Invalid roast date format');
        }
      }

      let processedBagOpenDate: Date | null | undefined = undefined;
      if (updateData.bagOpenDate !== undefined) {
        processedBagOpenDate = updateData.bagOpenDate === null 
          ? null 
          : (typeof updateData.bagOpenDate === 'string' 
            ? new Date(updateData.bagOpenDate) 
            : updateData.bagOpenDate);
        
        if (processedBagOpenDate !== null && isNaN(processedBagOpenDate.getTime())) {
          throw new Error('Invalid bag open date format');
        }
      }

      // Process roast degree if provided
      let processedRoastDegree: number | null | undefined = undefined;
      if (updateData.roastDegree !== undefined) {
        processedRoastDegree = updateData.roastDegree === null 
          ? null 
          : (typeof updateData.roastDegree === 'string' 
            ? parseFloat(updateData.roastDegree) 
            : updateData.roastDegree);
        
        if (processedRoastDegree !== null && isNaN(processedRoastDegree)) {
          processedRoastDegree = null;
        }
      }

      // Only update fields that are provided
      if (processedRoastDate !== undefined) {
        existingBeanBatch.roastDate = processedRoastDate;
      }
      if (processedBagOpenDate !== undefined) {
        existingBeanBatch.bagOpenDate = processedBagOpenDate;
      }
      if (updateData.roastLevel !== undefined) {
        existingBeanBatch.roastLevel = updateData.roastLevel?.trim() || null;
      }
      if (processedRoastDegree !== undefined) {
        existingBeanBatch.roastDegree = processedRoastDegree;
      }

      return await this.beanBatchRepository.save(existingBeanBatch);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error updating bean batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Error deleting bean batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get bean batches for a specific bean
   * @param beanId - Bean UUID
   * @returns Promise<BeanBatch[]> Array of bean batches for the bean
   */
  async getBeanBatchesByBeanId(beanId: string): Promise<BeanBatch[]> {
    try {
      return await this.beanBatchRepository.find({
        where: { bean: { id: beanId } },
        relations: ['bean', 'shots'],
      });
    } catch (error) {
      throw new Error(`Error fetching bean batches for bean: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
