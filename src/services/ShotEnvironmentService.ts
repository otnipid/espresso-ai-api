import { DataSource, Repository, Between } from 'typeorm';
import { ShotEnvironment } from '../entities/shotEnvironment';
import { Shot } from '../entities/Shot';

export interface ShotEnvironmentCreateData {
  shot_id: string;
  ambient_temp_c?: number | string | null;
  humidity_percent?: number | string | null;
  water_source?: string | null;
  estimated_water_hardness_ppm?: number | string | null;
  machine_warmup_minutes?: number | string | null;
  shots_since_clean?: number | string | null;
}

export interface ShotEnvironmentUpdateData {
  ambient_temp_c?: number | string | null;
  humidity_percent?: number | string | null;
  water_source?: string | null;
  estimated_water_hardness_ppm?: number | string | null;
  machine_warmup_minutes?: number | string | null;
  shots_since_clean?: number | string | null;
}

export class ShotEnvironmentService {
  private environmentRepository: Repository<ShotEnvironment>;
  private shotRepository: Repository<Shot>;

  constructor(dataSource: DataSource) {
    this.environmentRepository = dataSource.getRepository(ShotEnvironment);
    this.shotRepository = dataSource.getRepository(Shot);
  }

  /**
   * Get all shot environments with their related shots
   * @returns Promise<ShotEnvironment[]> Array of environments with relations
   */
  async getAllShotEnvironments(): Promise<ShotEnvironment[]> {
    try {
      return await this.environmentRepository.find({
        relations: ['shot'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching shot environments: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a single shot environment by ID with relations
   * @param shot_id - Shot UUID (primary key)
   * @returns Promise<ShotEnvironment> Environment with relations
   * @throws Error when environment not found
   */
  async getShotEnvironmentById(shot_id: string): Promise<ShotEnvironment> {
    try {
      const environment = await this.environmentRepository.findOne({
        where: { shot_id },
        relations: ['shot'],
      });

      if (!environment) {
        throw new Error(`Shot environment with ID ${shot_id} not found`);
      }

      return environment;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error fetching shot environment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a new shot environment with validation
   * @param environmentData - Environment data to create
   * @returns Promise<ShotEnvironment> Created environment
   * @throws Error when validation fails or database error occurs
   */
  async createShotEnvironment(
    environmentData: ShotEnvironmentCreateData
  ): Promise<ShotEnvironment> {
    try {
      // Validate required fields
      if (!environmentData.shot_id || environmentData.shot_id.trim() === '') {
        throw new Error('Shot ID is required');
      }

      // Verify shot exists
      const shot = await this.shotRepository.findOne({
        where: { id: environmentData.shot_id },
      });

      if (!shot) {
        throw new Error(`Shot with ID ${environmentData.shot_id} not found`);
      }

      // Process numeric fields
      const processedData = {
        shot,
        ambient_temp_c: this.processNumericField(environmentData.ambient_temp_c),
        humidity_percent: this.processNumericField(environmentData.humidity_percent),
        water_source: environmentData.water_source?.trim() || null,
        estimated_water_hardness_ppm: this.processNumericField(
          environmentData.estimated_water_hardness_ppm
        ),
        machine_warmup_minutes: this.processNumericField(environmentData.machine_warmup_minutes),
        shots_since_clean: this.processNumericField(environmentData.shots_since_clean),
      };

      const environment = this.environmentRepository.create(processedData);
      return await this.environmentRepository.save(environment);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        throw error;
      }
      throw new Error(
        `Error creating shot environment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing shot environment
   * @param shot_id - Shot UUID (primary key)
   * @param updateData - Partial environment data to update
   * @returns Promise<ShotEnvironment> Updated environment
   * @throws Error when environment not found
   */
  async updateShotEnvironment(
    shot_id: string,
    updateData: ShotEnvironmentUpdateData
  ): Promise<ShotEnvironment> {
    try {
      const existingEnvironment = await this.environmentRepository.findOne({
        where: { shot_id },
      });

      if (!existingEnvironment) {
        throw new Error(`Shot environment with ID ${shot_id} not found`);
      }

      // Only update fields that are provided
      if (updateData.ambient_temp_c !== undefined) {
        existingEnvironment.ambient_temp_c = this.processNumericField(updateData.ambient_temp_c);
      }
      if (updateData.humidity_percent !== undefined) {
        existingEnvironment.humidity_percent = this.processNumericField(
          updateData.humidity_percent
        );
      }
      if (updateData.water_source !== undefined) {
        existingEnvironment.water_source = updateData.water_source?.trim() || null;
      }
      if (updateData.estimated_water_hardness_ppm !== undefined) {
        existingEnvironment.estimated_water_hardness_ppm = this.processNumericField(
          updateData.estimated_water_hardness_ppm
        );
      }
      if (updateData.machine_warmup_minutes !== undefined) {
        existingEnvironment.machine_warmup_minutes = this.processNumericField(
          updateData.machine_warmup_minutes
        );
      }
      if (updateData.shots_since_clean !== undefined) {
        existingEnvironment.shots_since_clean = this.processNumericField(
          updateData.shots_since_clean
        );
      }

      return await this.environmentRepository.save(existingEnvironment);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error updating shot environment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a shot environment
   * @param shot_id - Shot UUID (primary key)
   * @returns Promise<boolean> True if deleted, false if not found
   */
  async deleteShotEnvironment(shot_id: string): Promise<boolean> {
    try {
      const existingEnvironment = await this.environmentRepository.findOne({
        where: { shot_id },
      });

      if (!existingEnvironment) {
        throw new Error(`Shot environment with ID ${shot_id} not found`);
      }

      await this.environmentRepository.remove(existingEnvironment);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(
        `Error deleting shot environment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get environments filtered by temperature range
   * @param minTemp - Minimum temperature (Celsius)
   * @param maxTemp - Maximum temperature (Celsius)
   * @returns Promise<ShotEnvironment[]> Array of matching environments
   */
  async getShotEnvironmentsByTemperature(
    minTemp: number,
    maxTemp: number
  ): Promise<ShotEnvironment[]> {
    try {
      return await this.environmentRepository.find({
        where: {
          ambient_temp_c: Between(minTemp, maxTemp),
        },
        relations: ['shot'],
      });
    } catch (error) {
      throw new Error(
        `Error fetching shot environments by temperature: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Helper method to process numeric fields with string to number conversion
   * @param value - Value to process (can be number, string, or null)
   * @returns number | null - Processed numeric value or null
   */
  private processNumericField(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }

    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? null : parsed;
  }
}
