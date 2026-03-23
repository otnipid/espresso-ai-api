import { DataSource, Repository } from 'typeorm';
import { Bean } from '../entities/Bean';

export interface BeanCreateData {
  name: string;
  roaster: string;
  country?: string | null;
  region?: string | null;
  farm?: string | null;
  varietal?: string | null;
  processing_method?: string | null;
  altitude_m?: number | string | null;
  density_category?: string | null;
}

export interface BeanUpdateData {
  name?: string;
  roaster?: string;
  country?: string | null;
  region?: string | null;
  farm?: string | null;
  varietal?: string | null;
  processing_method?: string | null;
  altitude_m?: number | string | null;
  density_category?: string | null;
}

export class BeanService {
  private beanRepository: Repository<Bean>;

  constructor(dataSource: DataSource) {
    this.beanRepository = dataSource.getRepository(Bean);
  }

  /**
   * Get all beans with their related bean batches
   * @returns Promise<Bean[]> Array of beans with relations
   */
  async getAllBeans(): Promise<Bean[]> {
    try {
      return await this.beanRepository.find({
        relations: ['beanBatches'],
      });
    } catch (error) {
      throw new Error(`Error fetching beans: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single bean by ID with relations
   * @param id - Bean UUID
   * @returns Promise<Bean> Bean with relations
   * @throws Error when bean not found
   */
  async getBeanById(id: string): Promise<Bean> {
    try {
      const bean = await this.beanRepository.findOne({
        where: { id },
        relations: ['beanBatches'],
      });

      if (!bean) {
        throw new Error(`Bean with ID ${id} not found`);
      }

      return bean;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error fetching bean: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new bean with validation
   * @param beanData - Bean data to create
   * @returns Promise<Bean> Created bean
   * @throws Error when validation fails or database error occurs
   */
  async createBean(beanData: BeanCreateData): Promise<Bean> {
    try {
      // Validate required fields
      if (!beanData.name || beanData.name.trim() === '') {
        throw new Error('Bean name is required');
      }

      // Process altitude_m - convert string to number if needed
      let processedAltitude: number | null = null;
      if (beanData.altitude_m !== null && beanData.altitude_m !== undefined) {
        processedAltitude = typeof beanData.altitude_m === 'string' 
          ? parseFloat(beanData.altitude_m) 
          : beanData.altitude_m;
        
        // Validate altitude is a valid number
        if (isNaN(processedAltitude)) {
          processedAltitude = null;
        }
      }

      const bean = this.beanRepository.create({
        name: beanData.name.trim(),
        roaster: beanData.roaster?.trim() || undefined,
        country: beanData.country?.trim() || undefined,
        region: beanData.region?.trim() || undefined,
        farm: beanData.farm?.trim() || undefined,
        varietal: beanData.varietal?.trim() || undefined,
        processing_method: beanData.processing_method?.trim() || undefined,
        altitude_m: processedAltitude,
        density_category: beanData.density_category?.trim() || undefined,
      });

      return await this.beanRepository.save(bean);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        throw error;
      }
      throw new Error(`Error creating bean: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing bean
   * @param id - Bean UUID
   * @param updateData - Partial bean data to update
   * @returns Promise<Bean> Updated bean
   * @throws Error when bean not found
   */
  async updateBean(id: string, updateData: BeanUpdateData): Promise<Bean> {
    try {
      const existingBean = await this.beanRepository.findOne({
        where: { id },
      });

      if (!existingBean) {
        throw new Error(`Bean with ID ${id} not found`);
      }

      // Process altitude_m if provided
      let processedAltitude: number | null | undefined = undefined;
      if (updateData.altitude_m !== null && updateData.altitude_m !== undefined) {
        processedAltitude = typeof updateData.altitude_m === 'string' 
          ? parseFloat(updateData.altitude_m) 
          : updateData.altitude_m;
        
        // Validate altitude is a valid number
        if (isNaN(processedAltitude)) {
          processedAltitude = null;
        }
      }

      // Only update fields that are provided
      if (updateData.name !== undefined) {
        existingBean.name = updateData.name?.trim() || existingBean.name;
      }
      if (updateData.roaster !== undefined) {
        existingBean.roaster = updateData.roaster?.trim() || existingBean.roaster;
      }
      if (updateData.country !== undefined) {
        existingBean.country = updateData.country?.trim() || existingBean.country;
      }
      if (updateData.region !== undefined) {
        existingBean.region = updateData.region?.trim() || existingBean.region;
      }
      if (updateData.farm !== undefined) {
        existingBean.farm = updateData.farm?.trim() || existingBean.farm;
      }
      if (updateData.varietal !== undefined) {
        existingBean.varietal = updateData.varietal?.trim() || existingBean.varietal;
      }
      if (updateData.processing_method !== undefined) {
        existingBean.processing_method = updateData.processing_method?.trim() || existingBean.processing_method;
      }
      if (processedAltitude !== undefined) {
        existingBean.altitude_m = processedAltitude;
      }
      if (updateData.density_category !== undefined) {
        existingBean.density_category = updateData.density_category?.trim() || existingBean.density_category;
      }

      return await this.beanRepository.save(existingBean);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error updating bean: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a bean
   * @param id - Bean UUID
   * @returns Promise<boolean> True if deleted, false if not found
   */
  async deleteBean(id: string): Promise<boolean> {
    try {
      const existingBean = await this.beanRepository.findOne({
        where: { id },
      });

      if (!existingBean) {
        throw new Error(`Bean with ID ${id} not found`);
      }

      await this.beanRepository.remove(existingBean);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error deleting bean: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
