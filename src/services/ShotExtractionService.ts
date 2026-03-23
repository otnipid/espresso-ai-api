import { DataSource, Repository } from 'typeorm';
import { ShotExtraction } from '../entities/ShotExtraction';
import { Shot } from '../entities/Shot';

export interface ShotExtractionCreateData {
  shot_id: string;
  yield_grams?: number | string | null;
  shot_time_seconds?: number | string | null;
  avg_pressure_bar?: number | string | null;
  water_temp_c?: number | string | null;
  preinfusion_seconds?: number | string | null;
  peak_pressure_bar?: number | string | null;
}

export interface ShotExtractionUpdateData {
  yield_grams?: number | string | null;
  shot_time_seconds?: number | string | null;
  avg_pressure_bar?: number | string | null;
  water_temp_c?: number | string | null;
  preinfusion_seconds?: number | string | null;
  peak_pressure_bar?: number | string | null;
}

export class ShotExtractionService {
  private extractionRepository: Repository<ShotExtraction>;
  private shotRepository: Repository<Shot>;

  constructor(dataSource: DataSource) {
    this.extractionRepository = dataSource.getRepository(ShotExtraction);
    this.shotRepository = dataSource.getRepository(Shot);
  }

  /**
   * Get all shot extractions with their related shots
   * @returns Promise<ShotExtraction[]> Array of shot extractions with relations
   */
  async getAllShotExtractions(): Promise<ShotExtraction[]> {
    try {
      return await this.extractionRepository.find({
        relations: ['shot'],
      });
    } catch (error) {
      throw new Error(`Error fetching shot extractions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single shot extraction by ID with relations
   * @param shotId - Shot UUID
   * @returns Promise<ShotExtraction> Shot extraction with relations
   * @throws Error when shot extraction not found
   */
  async getShotExtractionById(shotId: string): Promise<ShotExtraction> {
    try {
      const extraction = await this.extractionRepository.findOne({
        where: { shot_id: shotId },
        relations: ['shot'],
      });

      if (!extraction) {
        throw new Error(`Shot extraction with ID ${shotId} not found`);
      }

      return extraction;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error fetching shot extraction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new shot extraction with validation
   * @param extractionData - Shot extraction data to create
   * @returns Promise<ShotExtraction> Created shot extraction
   * @throws Error when validation fails or database error occurs
   */
  async createShotExtraction(extractionData: ShotExtractionCreateData): Promise<ShotExtraction> {
    try {
      // Validate required fields
      if (!extractionData.shot_id || extractionData.shot_id.trim() === '') {
        throw new Error('Shot ID is required');
      }

      // Verify shot exists
      const shot = await this.shotRepository.findOne({
        where: { id: extractionData.shot_id },
      });

      if (!shot) {
        throw new Error(`Shot with ID ${extractionData.shot_id} not found`);
      }

      // Process numeric fields
      let processedYieldGrams: number | null | undefined = undefined;
      if (extractionData.yield_grams !== undefined && extractionData.yield_grams !== null) {
        processedYieldGrams = typeof extractionData.yield_grams === 'string' 
          ? parseFloat(extractionData.yield_grams) 
          : extractionData.yield_grams;
        
        if (isNaN(processedYieldGrams)) {
          processedYieldGrams = null;
        }
      }

      let processedShotTimeSeconds: number | null | undefined = undefined;
      if (extractionData.shot_time_seconds !== undefined && extractionData.shot_time_seconds !== null) {
        processedShotTimeSeconds = typeof extractionData.shot_time_seconds === 'string' 
          ? parseFloat(extractionData.shot_time_seconds) 
          : extractionData.shot_time_seconds;
        
        if (isNaN(processedShotTimeSeconds)) {
          processedShotTimeSeconds = null;
        }
      }

      let processedAvgPressureBar: number | null | undefined = undefined;
      if (extractionData.avg_pressure_bar !== undefined && extractionData.avg_pressure_bar !== null) {
        processedAvgPressureBar = typeof extractionData.avg_pressure_bar === 'string' 
          ? parseFloat(extractionData.avg_pressure_bar) 
          : extractionData.avg_pressure_bar;
        
        if (isNaN(processedAvgPressureBar)) {
          processedAvgPressureBar = null;
        }
      }

      let processedWaterTempC: number | null | undefined = undefined;
      if (extractionData.water_temp_c !== undefined && extractionData.water_temp_c !== null) {
        processedWaterTempC = typeof extractionData.water_temp_c === 'string' 
          ? parseFloat(extractionData.water_temp_c) 
          : extractionData.water_temp_c;
        
        if (isNaN(processedWaterTempC)) {
          processedWaterTempC = null;
        }
      }

      let processedPreinfusionSeconds: number | null | undefined = undefined;
      if (extractionData.preinfusion_seconds !== undefined && extractionData.preinfusion_seconds !== null) {
        processedPreinfusionSeconds = typeof extractionData.preinfusion_seconds === 'string' 
          ? parseFloat(extractionData.preinfusion_seconds) 
          : extractionData.preinfusion_seconds;
        
        if (isNaN(processedPreinfusionSeconds)) {
          processedPreinfusionSeconds = null;
        }
      }

      let processedPeakPressureBar: number | null | undefined = undefined;
      if (extractionData.peak_pressure_bar !== undefined && extractionData.peak_pressure_bar !== null) {
        processedPeakPressureBar = typeof extractionData.peak_pressure_bar === 'string' 
          ? parseFloat(extractionData.peak_pressure_bar) 
          : extractionData.peak_pressure_bar;
        
        if (isNaN(processedPeakPressureBar)) {
          processedPeakPressureBar = null;
        }
      }

      const extraction = this.extractionRepository.create({
        shot: shot,
        yield_grams: processedYieldGrams || null,
        shot_time_seconds: processedShotTimeSeconds || null,
        avg_pressure_bar: processedAvgPressureBar || null,
        water_temp_c: processedWaterTempC || null,
        preinfusion_seconds: processedPreinfusionSeconds || null,
        peak_pressure_bar: processedPeakPressureBar || null,
      });

      return await this.extractionRepository.save(extraction);
    } catch (error) {
      if (error instanceof Error && (error.message.includes('required') || error.message.includes('not found'))) {
        throw error;
      }
      throw new Error(`Error creating shot extraction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing shot extraction
   * @param shotId - Shot UUID
   * @param updateData - Partial shot extraction data to update
   * @returns Promise<ShotExtraction> Updated shot extraction
   * @throws Error when shot extraction not found
   */
  async updateShotExtraction(shotId: string, updateData: ShotExtractionUpdateData): Promise<ShotExtraction> {
    try {
      const existingExtraction = await this.extractionRepository.findOne({
        where: { shot_id: shotId },
      });

      if (!existingExtraction) {
        throw new Error(`Shot extraction with ID ${shotId} not found`);
      }

      // Process numeric fields if provided
      let processedYieldGrams: number | null | undefined = undefined;
      if (updateData.yield_grams !== undefined) {
        processedYieldGrams = updateData.yield_grams === null 
          ? null 
          : (typeof updateData.yield_grams === 'string' 
            ? parseFloat(updateData.yield_grams) 
            : updateData.yield_grams);
        
        if (processedYieldGrams !== null && isNaN(processedYieldGrams)) {
          processedYieldGrams = null;
        }
      }

      let processedShotTimeSeconds: number | null | undefined = undefined;
      if (updateData.shot_time_seconds !== undefined) {
        processedShotTimeSeconds = updateData.shot_time_seconds === null 
          ? null 
          : (typeof updateData.shot_time_seconds === 'string' 
            ? parseFloat(updateData.shot_time_seconds) 
            : updateData.shot_time_seconds);
        
        if (processedShotTimeSeconds !== null && isNaN(processedShotTimeSeconds)) {
          processedShotTimeSeconds = null;
        }
      }

      let processedAvgPressureBar: number | null | undefined = undefined;
      if (updateData.avg_pressure_bar !== undefined) {
        processedAvgPressureBar = updateData.avg_pressure_bar === null 
          ? null 
          : (typeof updateData.avg_pressure_bar === 'string' 
            ? parseFloat(updateData.avg_pressure_bar) 
            : updateData.avg_pressure_bar);
        
        if (processedAvgPressureBar !== null && isNaN(processedAvgPressureBar)) {
          processedAvgPressureBar = null;
        }
      }

      let processedWaterTempC: number | null | undefined = undefined;
      if (updateData.water_temp_c !== undefined) {
        processedWaterTempC = updateData.water_temp_c === null 
          ? null 
          : (typeof updateData.water_temp_c === 'string' 
            ? parseFloat(updateData.water_temp_c) 
            : updateData.water_temp_c);
        
        if (processedWaterTempC !== null && isNaN(processedWaterTempC)) {
          processedWaterTempC = null;
        }
      }

      let processedPreinfusionSeconds: number | null | undefined = undefined;
      if (updateData.preinfusion_seconds !== undefined) {
        processedPreinfusionSeconds = updateData.preinfusion_seconds === null 
          ? null 
          : (typeof updateData.preinfusion_seconds === 'string' 
            ? parseFloat(updateData.preinfusion_seconds) 
            : updateData.preinfusion_seconds);
        
        if (processedPreinfusionSeconds !== null && isNaN(processedPreinfusionSeconds)) {
          processedPreinfusionSeconds = null;
        }
      }

      let processedPeakPressureBar: number | null | undefined = undefined;
      if (updateData.peak_pressure_bar !== undefined) {
        processedPeakPressureBar = updateData.peak_pressure_bar === null 
          ? null 
          : (typeof updateData.peak_pressure_bar === 'string' 
            ? parseFloat(updateData.peak_pressure_bar) 
            : updateData.peak_pressure_bar);
        
        if (processedPeakPressureBar !== null && isNaN(processedPeakPressureBar)) {
          processedPeakPressureBar = null;
        }
      }

      // Only update fields that are provided
      if (processedYieldGrams !== undefined) {
        existingExtraction.yield_grams = processedYieldGrams;
      }
      if (processedShotTimeSeconds !== undefined) {
        existingExtraction.shot_time_seconds = processedShotTimeSeconds;
      }
      if (processedAvgPressureBar !== undefined) {
        existingExtraction.avg_pressure_bar = processedAvgPressureBar;
      }
      if (processedWaterTempC !== undefined) {
        existingExtraction.water_temp_c = processedWaterTempC;
      }
      if (processedPreinfusionSeconds !== undefined) {
        existingExtraction.preinfusion_seconds = processedPreinfusionSeconds;
      }
      if (processedPeakPressureBar !== undefined) {
        existingExtraction.peak_pressure_bar = processedPeakPressureBar;
      }

      return await this.extractionRepository.save(existingExtraction);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error updating shot extraction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a shot extraction
   * @param shotId - Shot UUID
   * @returns Promise<boolean> True if deleted, false if not found
   */
  async deleteShotExtraction(shotId: string): Promise<boolean> {
    try {
      const existingExtraction = await this.extractionRepository.findOne({
        where: { shot_id: shotId },
      });

      if (!existingExtraction) {
        throw new Error(`Shot extraction with ID ${shotId} not found`);
      }

      await this.extractionRepository.remove(existingExtraction);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error deleting shot extraction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
