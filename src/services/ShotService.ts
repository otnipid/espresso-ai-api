import {
  Repository,
  DataSource,
  FindManyOptions,
  FindOneOptions,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Shot } from '../entities/Shot';
import { ShotPreparation } from '../entities/ShotPreparation';
import { ShotExtraction } from '../entities/ShotExtraction';
import { ShotEnvironment } from '../entities/shotEnvironment';
import { ShotFeedback } from '../entities/shotFeedback';
import { BeanBatch } from '../entities/BeanBatch';
import { Machine } from '../entities/Machine';

export interface CreateShotData {
  machineId: string;
  beanBatchId: string;
  shot_type: 'ristretto' | 'normale' | 'lungo';
  pulled_at?: Date;
  success?: boolean;
  notes?: string;
  preparation?: Partial<ShotPreparation>;
  extraction?: Partial<ShotExtraction>;
  environment?: Partial<ShotEnvironment>;
  feedback?: Partial<ShotFeedback>;
}

export interface UpdateShotData {
  machineId?: string;
  beanBatchId?: string;
  shot_type?: 'ristretto' | 'normale' | 'lungo';
  pulled_at?: Date;
  success?: boolean;
  notes?: string;
  preparation?: Partial<ShotPreparation>;
  extraction?: Partial<ShotExtraction>;
  environment?: Partial<ShotEnvironment>;
  feedback?: Partial<ShotFeedback>;
}

export interface ShotFilterOptions {
  machineId?: string;
  beanBatchId?: string;
  shot_type?: string;
  success?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ShotQueryResult {
  shots: Shot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Service class for managing Shot CRUD operations
 * Provides comprehensive business logic for shot data management
 */
export class ShotService {
  private shotRepository: Repository<Shot>;
  private shotPreparationRepository: Repository<ShotPreparation>;
  private shotExtractionRepository: Repository<ShotExtraction>;
  private shotEnvironmentRepository: Repository<ShotEnvironment>;
  private shotFeedbackRepository: Repository<ShotFeedback>;
  private beanBatchRepository: Repository<BeanBatch>;
  private machineRepository: Repository<Machine>;

  constructor(dataSource: DataSource) {
    this.shotRepository = dataSource.getRepository(Shot);
    this.shotPreparationRepository = dataSource.getRepository(ShotPreparation);
    this.shotExtractionRepository = dataSource.getRepository(ShotExtraction);
    this.shotEnvironmentRepository = dataSource.getRepository(ShotEnvironment);
    this.shotFeedbackRepository = dataSource.getRepository(ShotFeedback);
    this.beanBatchRepository = dataSource.getRepository(BeanBatch);
    this.machineRepository = dataSource.getRepository(Machine);
  }

  /**
   * Create a new shot with all related entities
   * @param shotData - The shot data to create
   * @returns The created shot with all relations
   */
  async createShot(shotData: CreateShotData): Promise<Shot> {
    const queryRunner = this.shotRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate related entities exist
      const machine = await this.machineRepository.findOne({
        where: { id: shotData.machineId },
      });
      if (!machine) {
        throw new Error(`Machine with ID ${shotData.machineId} not found`);
      }

      const beanBatch = await this.beanBatchRepository.findOne({
        where: { id: shotData.beanBatchId },
      });
      if (!beanBatch) {
        throw new Error(`BeanBatch with ID ${shotData.beanBatchId} not found`);
      }

      // Create the main shot entity
      const shot = this.shotRepository.create({
        machine,
        beanBatch,
        shot_type: shotData.shot_type,
        pulled_at: shotData.pulled_at || new Date(),
        success: shotData.success,
        notes: shotData.notes,
      });

      const savedShot = await queryRunner.manager.save(shot);

      // Create related entities if provided
      if (shotData.preparation) {
        const preparation = this.shotPreparationRepository.create({
          ...shotData.preparation,
          shot_id: savedShot.id,
        });
        await queryRunner.manager.save(preparation);
      }

      if (shotData.extraction) {
        const extraction = this.shotExtractionRepository.create({
          ...shotData.extraction,
          shot_id: savedShot.id,
        });
        await queryRunner.manager.save(extraction);
      }

      if (shotData.environment) {
        const environment = this.shotEnvironmentRepository.create({
          ...shotData.environment,
          shot: savedShot,
        });
        await queryRunner.manager.save(environment);
      }

      if (shotData.feedback) {
        const feedback = this.shotFeedbackRepository.create({
          ...shotData.feedback,
          shot: savedShot,
        });
        await queryRunner.manager.save(feedback);
      }

      await queryRunner.commitTransaction();

      // Return the complete shot with all relations
      return this.getShotById(savedShot.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get a single shot by ID with all relations
   * @param id - The shot ID
   * @returns The shot with all relations
   */
  async getShotById(id: string): Promise<Shot> {
    const shot = await this.shotRepository.findOne({
      where: { id },
      relations: ['machine', 'beanBatch', 'preparation', 'extraction', 'environment', 'feedback'],
    });

    if (!shot) {
      throw new Error(`Shot with ID ${id} not found`);
    }

    return shot;
  }

  /**
   * Get multiple shots with filtering, sorting, and pagination
   * @param options - Filter and pagination options
   * @returns Paginated shot results
   */
  async getShots(options: ShotFilterOptions = {}): Promise<ShotQueryResult> {
    const {
      machineId,
      beanBatchId,
      shot_type,
      success,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'pulled_at',
      sortOrder = 'DESC',
    } = options;

    // Build where conditions
    const where: any = {};

    if (machineId) where.machine = { id: machineId };
    if (beanBatchId) where.beanBatch = { id: beanBatchId };
    if (shot_type) where.shot_type = shot_type;
    if (success !== undefined) where.success = success;
    if (dateFrom || dateTo) {
      if (dateFrom && dateTo) {
        where.pulled_at = Between(dateFrom, dateTo);
      } else if (dateFrom) {
        where.pulled_at = MoreThanOrEqual(dateFrom);
      } else if (dateTo) {
        where.pulled_at = LessThanOrEqual(dateTo);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build find options
    const findOptions: FindManyOptions<Shot> = {
      where,
      relations: ['machine', 'beanBatch', 'preparation', 'extraction', 'environment', 'feedback'],
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    };

    // Execute queries
    const [shots, total] = await this.shotRepository.findAndCount(findOptions);

    return {
      shots,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update an existing shot and its related entities
   * @param id - The shot ID
   * @param updateData - The data to update
   * @returns The updated shot with all relations
   */
  async updateShot(id: string, updateData: UpdateShotData): Promise<Shot> {
    const queryRunner = this.shotRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if shot exists
      const existingShot = await this.getShotById(id);

      // Validate related entities if they're being updated
      if (updateData.machineId) {
        const machine = await this.machineRepository.findOne({
          where: { id: updateData.machineId },
        });
        if (!machine) {
          throw new Error(`Machine with ID ${updateData.machineId} not found`);
        }
        existingShot.machine = machine;
      }

      if (updateData.beanBatchId) {
        const beanBatch = await this.beanBatchRepository.findOne({
          where: { id: updateData.beanBatchId },
        });
        if (!beanBatch) {
          throw new Error(`BeanBatch with ID ${updateData.beanBatchId} not found`);
        }
        existingShot.beanBatch = beanBatch;
      }

      // Update main shot fields
      if (updateData.shot_type) existingShot.shot_type = updateData.shot_type;
      if (updateData.pulled_at) existingShot.pulled_at = updateData.pulled_at;
      if (updateData.success !== undefined) existingShot.success = updateData.success;
      if (updateData.notes !== undefined) existingShot.notes = updateData.notes;

      await queryRunner.manager.save(existingShot);

      // Update related entities if provided
      if (updateData.preparation) {
        const prepRepo = queryRunner.manager.getRepository(ShotPreparation);
        const existingPrep = await prepRepo.findOne({ where: { shot_id: id } });

        if (existingPrep) {
          Object.assign(existingPrep, updateData.preparation);
          await prepRepo.save(existingPrep);
        } else {
          const preparation = prepRepo.create({
            ...updateData.preparation,
            shot_id: id,
          });
          await prepRepo.save(preparation);
        }
      }

      if (updateData.extraction) {
        const extRepo = queryRunner.manager.getRepository(ShotExtraction);
        const existingExt = await extRepo.findOne({ where: { shot_id: id } });

        if (existingExt) {
          Object.assign(existingExt, updateData.extraction);
          await extRepo.save(existingExt);
        } else {
          const extraction = extRepo.create({
            ...updateData.extraction,
            shot_id: id,
          });
          await extRepo.save(extraction);
        }
      }

      if (updateData.environment) {
        const envRepo = queryRunner.manager.getRepository(ShotEnvironment);
        const existingEnv = await envRepo.findOne({
          where: { shot: { id } },
        });

        if (existingEnv) {
          Object.assign(existingEnv, updateData.environment);
          await envRepo.save(existingEnv);
        } else {
          const environment = envRepo.create({
            ...updateData.environment,
            shot: { id },
          });
          await envRepo.save(environment);
        }
      }

      if (updateData.feedback) {
        const feedbackRepo = queryRunner.manager.getRepository(ShotFeedback);
        const existingFeedback = await feedbackRepo.findOne({
          where: { shot: { id } },
        });

        if (existingFeedback) {
          Object.assign(existingFeedback, updateData.feedback);
          await feedbackRepo.save(existingFeedback);
        } else {
          const feedback = feedbackRepo.create({
            ...updateData.feedback,
            shot: { id },
          });
          await feedbackRepo.save(feedback);
        }
      }

      await queryRunner.commitTransaction();

      // Return the updated shot with all relations
      return this.getShotById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Soft delete a shot (marks as deleted but keeps in database)
   * @param id - The shot ID
   * @returns True if successfully deleted
   */
  async softDeleteShot(id: string): Promise<boolean> {
    try {
      const result = await this.shotRepository.softDelete(id);
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      throw new Error(`Failed to soft delete shot: ${error}`);
    }
  }

  /**
   * Permanently delete a shot from the database
   * @param id - The shot ID
   * @returns True if successfully deleted
   */
  async hardDeleteShot(id: string): Promise<boolean> {
    const queryRunner = this.shotRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete related entities first
      await queryRunner.manager.delete(ShotPreparation, { shot_id: id });
      await queryRunner.manager.delete(ShotExtraction, { shot_id: id });

      // For entities with relationships, we need to find them first
      const environment = await queryRunner.manager.findOne(ShotEnvironment, {
        where: { shot: { id } },
      });
      if (environment) {
        await queryRunner.manager.remove(ShotEnvironment, environment);
      }

      const feedback = await queryRunner.manager.findOne(ShotFeedback, {
        where: { shot: { id } },
      });
      if (feedback) {
        await queryRunner.manager.remove(ShotFeedback, feedback);
      }

      // Delete the main shot
      const result = await queryRunner.manager.delete(Shot, id);

      await queryRunner.commitTransaction();
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to delete shot: ${error}`);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Restore a soft-deleted shot
   * @param id - The shot ID
   * @returns The restored shot
   */
  async restoreShot(id: string): Promise<Shot> {
    try {
      const result = await this.shotRepository.restore(id);
      if (!result.affected || result.affected === 0) {
        throw new Error(`Shot with ID ${id} not found or not deleted`);
      }
      return this.getShotById(id);
    } catch (error) {
      throw new Error(`Failed to restore shot: ${error}`);
    }
  }

  /**
   * Get shot statistics for analytics
   * @param options - Filter options for statistics
   * @returns Statistics object
   */
  async getShotStatistics(options: ShotFilterOptions = {}): Promise<any> {
    const where: any = {};

    if (options.machineId) where.machine = { id: options.machineId };
    if (options.beanBatchId) where.beanBatch = { id: options.beanBatchId };
    if (options.dateFrom || options.dateTo) {
      where.pulled_at = {};
      if (options.dateFrom) where.pulled_at.$gte = options.dateFrom;
      if (options.dateTo) where.pulled_at.$lte = options.dateTo;
    }

    const totalShots = await this.shotRepository.count({ where });
    const successfulShots = await this.shotRepository.count({
      where: { ...where, success: true },
    });
    const failedShots = totalShots - successfulShots;

    return {
      total: totalShots,
      successful: successfulShots,
      failed: failedShots,
      successRate: totalShots > 0 ? (successfulShots / totalShots) * 100 : 0,
    };
  }
}
