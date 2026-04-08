import { DataSource, Repository } from 'typeorm';
import { ShotPreparation } from '../entities/ShotPreparation';
import { Shot } from '../entities/Shot';

export interface ShotPreparationCreateData {
  shot_id: string;
  dose_grams?: number | string | null;
  burr_setting?: number | string | null;
  side_hopper?: number | string | null;
  basket_type?: string | null;
  basket_size_grams?: number | string | null;
  distribution_method?: string | null;
  tamp_type?: string | null;
  tamp_pressure_category?: string | null;
}

export interface ShotPreparationUpdateData {
  dose_grams?: number | string | null;
  burr_setting?: number | string | null;
  side_hopper?: number | string | null;
  basket_type?: string | null;
  basket_size_grams?: number | string | null;
  distribution_method?: string | null;
  tamp_type?: string | null;
  tamp_pressure_category?: string | null;
}

export class ShotPreparationService {
  private preparationRepository: Repository<ShotPreparation>;
  private shotRepository: Repository<Shot>;

  constructor(dataSource: DataSource) {
    this.preparationRepository = dataSource.getRepository(ShotPreparation);
    this.shotRepository = dataSource.getRepository(Shot);
  }

  /**
   * Get all shot preparations with their related shots
   * @returns Promise<ShotPreparation[]> Array of shot preparations with relations
   */
  async getAllShotPreparations(): Promise<ShotPreparation[]> {
    try {
      return await this.preparationRepository.find({
        relations: ['shot'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching shot preparations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a single shot preparation by ID with relations
   * @param shotId - Shot UUID
   * @returns Promise<ShotPreparation> Shot preparation with relations
   * @throws Error when shot preparation not found
   */
  async getShotPreparationById(shotId: string): Promise<ShotPreparation> {
    try {
      const preparation = await this.preparationRepository.findOne({
        where: { shot_id: shotId },
        relations: ['shot'],
      });

      if (!preparation) {
        throw new Error(`Shot preparation with ID ${shotId} not found`);
      }

      return preparation;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error fetching shot preparation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new shot preparation with validation
   * @param preparationData - Shot preparation data to create
   * @returns Promise<ShotPreparation> Created shot preparation
   * @throws Error when validation fails or database error occurs
   */
  async createShotPreparation(
    preparationData: ShotPreparationCreateData
  ): Promise<ShotPreparation> {
    try {
      // Validate required fields
      if (!preparationData.shot_id || preparationData.shot_id.trim() === '') {
        throw new Error('Shot ID is required');
      }

      // Verify shot exists
      const shot = await this.shotRepository.findOne({
        where: { id: preparationData.shot_id },
      });

      if (!shot) {
        throw new Error(`Shot with ID ${preparationData.shot_id} not found`);
      }

      // Process numeric fields
      let processedDoseGrams: number | null | undefined = undefined;
      if (preparationData.dose_grams !== undefined && preparationData.dose_grams !== null) {
        processedDoseGrams =
          typeof preparationData.dose_grams === 'string'
            ? parseFloat(preparationData.dose_grams)
            : preparationData.dose_grams;

        if (isNaN(processedDoseGrams)) {
          processedDoseGrams = null;
        }
      }

      let processedBurrSetting: number | null | undefined = undefined;
      if (preparationData.burr_setting !== undefined && preparationData.burr_setting !== null) {
        processedBurrSetting =
          typeof preparationData.burr_setting === 'string'
            ? parseFloat(preparationData.burr_setting)
            : preparationData.burr_setting;

        if (isNaN(processedBurrSetting)) {
          processedBurrSetting = null;
        }
      }

      let processedBasketSizeGrams: number | null | undefined = undefined;
      if (
        preparationData.basket_size_grams !== undefined &&
        preparationData.basket_size_grams !== null
      ) {
        processedBasketSizeGrams =
          typeof preparationData.basket_size_grams === 'string'
            ? parseInt(preparationData.basket_size_grams)
            : preparationData.basket_size_grams;

        if (isNaN(processedBasketSizeGrams)) {
          processedBasketSizeGrams = null;
        }
      }

      const preparation = this.preparationRepository.create({
        shot_id: shot.id,
        dose_grams: processedDoseGrams || null,
        burr_setting: processedBurrSetting || null,
        side_hopper: typeof preparationData.side_hopper === 'string' ? 
          parseInt(preparationData.side_hopper) || 1 : 
          (preparationData.side_hopper || 1),
        basket_type: preparationData.basket_type?.trim() || null,
        basket_size_grams: processedBasketSizeGrams || null,
        distribution_method: preparationData.distribution_method?.trim() || null,
        tamp_type: preparationData.tamp_type?.trim() || null,
        tamp_pressure_category: preparationData.tamp_pressure_category?.trim() || null,
      });

      return await this.preparationRepository.save(preparation);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('required') || error.message.includes('not found'))
      ) {
        throw error;
      }
      throw new Error(
        `Error creating shot preparation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing shot preparation
   * @param shotId - Shot UUID
   * @param updateData - Partial shot preparation data to update
   * @returns Promise<ShotPreparation> Updated shot preparation
   * @throws Error when shot preparation not found
   */
  async updateShotPreparation(
    shotId: string,
    updateData: ShotPreparationUpdateData
  ): Promise<ShotPreparation> {
    try {
      const existingPreparation = await this.preparationRepository.findOne({
        where: { shot_id: shotId },
      });

      if (!existingPreparation) {
        throw new Error(`Shot preparation with ID ${shotId} not found`);
      }

      // Process numeric fields if provided
      let processedDoseGrams: number | null | undefined = undefined;
      if (updateData.dose_grams !== undefined) {
        processedDoseGrams =
          updateData.dose_grams === null
            ? null
            : typeof updateData.dose_grams === 'string'
              ? parseFloat(updateData.dose_grams)
              : updateData.dose_grams;

        if (processedDoseGrams !== null && isNaN(processedDoseGrams)) {
          processedDoseGrams = null;
        }
      }

      let processedBurrSetting: number | null | undefined = undefined;
      if (updateData.burr_setting !== undefined) {
        processedBurrSetting =
          updateData.burr_setting === null
            ? null
            : typeof updateData.burr_setting === 'string'
              ? parseFloat(updateData.burr_setting)
              : updateData.burr_setting;

        if (processedBurrSetting !== null && isNaN(processedBurrSetting)) {
          processedBurrSetting = null;
        }
      }

      let processedBasketSizeGrams: number | null | undefined = undefined;
      if (updateData.basket_size_grams !== undefined) {
        processedBasketSizeGrams =
          updateData.basket_size_grams === null
            ? null
            : typeof updateData.basket_size_grams === 'string'
              ? parseInt(updateData.basket_size_grams)
              : updateData.basket_size_grams;

        if (processedBasketSizeGrams !== null && isNaN(processedBasketSizeGrams)) {
          processedBasketSizeGrams = null;
        }
      }

      // Only update fields that are provided
      if (processedDoseGrams !== undefined) {
        existingPreparation.dose_grams = processedDoseGrams;
      }
      if (processedBurrSetting !== undefined) {
        existingPreparation.burr_setting = processedBurrSetting;
      }
      if (updateData.side_hopper !== undefined) {
        existingPreparation.side_hopper = typeof updateData.side_hopper === 'string' ? 
          parseInt(updateData.side_hopper) || 1 : 
          (updateData.side_hopper ?? 1);
      }
      if (updateData.basket_type !== undefined) {
        existingPreparation.basket_type = updateData.basket_type?.trim() || null;
      }
      if (processedBasketSizeGrams !== undefined) {
        existingPreparation.basket_size_grams = processedBasketSizeGrams;
      }
      if (updateData.distribution_method !== undefined) {
        existingPreparation.distribution_method = updateData.distribution_method?.trim() || null;
      }
      if (updateData.tamp_type !== undefined) {
        existingPreparation.tamp_type = updateData.tamp_type?.trim() || null;
      }
      if (updateData.tamp_pressure_category !== undefined) {
        existingPreparation.tamp_pressure_category =
          updateData.tamp_pressure_category?.trim() || null;
      }

      return await this.preparationRepository.save(existingPreparation);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error updating shot preparation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all shot preparations for a specific shot
   * @param shotId - Shot UUID
   * @returns Promise<ShotPreparation[]> Array of shot preparations with relations
   * @throws Error when database error occurs
   */
  async getShotPreparationsByShotId(shotId: string): Promise<ShotPreparation[]> {
    try {
      return await this.preparationRepository.find({
        where: { shot: { id: shotId } },
        relations: ['shot'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching shot preparations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a shot preparation
   * @param shotId - Shot UUID
   * @returns Promise<boolean> True if deleted, false if not found
   * @throws Error when shot preparation not found
   */
  async deleteShotPreparation(shotId: string): Promise<boolean> {
    try {
      const existingPreparation = await this.preparationRepository.findOne({
        where: { shot_id: shotId },
      });

      if (!existingPreparation) {
        throw new Error(`Shot preparation with ID ${shotId} not found`);
      }

      await this.preparationRepository.remove(existingPreparation);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error deleting shot preparation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
