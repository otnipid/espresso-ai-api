import { DataSource, Repository, Between } from 'typeorm';
import { ShotFeedback } from '../entities/shotFeedback';
import { Shot } from '../entities/Shot';

export interface ShotFeedbackCreateData {
  shot_id: string;
  overall_score?: number | string | null;
  acidity?: number | string | null;
  sweetness?: number | string | null;
  bitterness?: number | string | null;
  body?: number | string | null;
  extraction_assessment?: string | null;
  notes?: string | null;
}

export interface ShotFeedbackUpdateData {
  overall_score?: number | string | null;
  acidity?: number | string | null;
  sweetness?: number | string | null;
  bitterness?: number | string | null;
  body?: number | string | null;
  extraction_assessment?: string | null;
  notes?: string | null;
}

export class ShotFeedbackService {
  private feedbackRepository: Repository<ShotFeedback>;
  private shotRepository: Repository<Shot>;

  constructor(dataSource: DataSource) {
    this.feedbackRepository = dataSource.getRepository(ShotFeedback);
    this.shotRepository = dataSource.getRepository(Shot);
  }

  /**
   * Get all shot feedbacks with their related shots
   * @returns Promise<ShotFeedback[]> Array of feedbacks with relations
   */
  async getAllShotFeedbacks(): Promise<ShotFeedback[]> {
    try {
      return await this.feedbackRepository.find({
        relations: ['shot'],
      });
    } catch (error) {
      throw new Error(`Error fetching shot feedbacks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single shot feedback by ID with relations
   * @param shot_id - Shot UUID (primary key)
   * @returns Promise<ShotFeedback> Feedback with relations
   * @throws Error when feedback not found
   */
  async getShotFeedbackById(shot_id: string): Promise<ShotFeedback> {
    try {
      const feedback = await this.feedbackRepository.findOne({
        where: { shot_id },
        relations: ['shot'],
      });

      if (!feedback) {
        throw new Error(`Shot feedback with ID ${shot_id} not found`);
      }

      return feedback;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error fetching shot feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new shot feedback with validation
   * @param feedbackData - Feedback data to create
   * @returns Promise<ShotFeedback> Created feedback
   * @throws Error when validation fails or database error occurs
   */
  async createShotFeedback(feedbackData: ShotFeedbackCreateData): Promise<ShotFeedback> {
    try {
      // Validate required fields
      if (!feedbackData.shot_id || feedbackData.shot_id.trim() === '') {
        throw new Error('Shot ID is required');
      }

      // Verify shot exists
      const shot = await this.shotRepository.findOne({
        where: { id: feedbackData.shot_id },
      });

      if (!shot) {
        throw new Error(`Shot with ID ${feedbackData.shot_id} not found`);
      }

      // Process numeric fields
      const processedData = {
        shot,
        overall_score: this.processNumericField(feedbackData.overall_score),
        acidity: this.processNumericField(feedbackData.acidity),
        sweetness: this.processNumericField(feedbackData.sweetness),
        bitterness: this.processNumericField(feedbackData.bitterness),
        body: this.processNumericField(feedbackData.body),
        extraction_assessment: feedbackData.extraction_assessment?.trim() || null,
        notes: feedbackData.notes?.trim() || null,
      };

      const feedback = this.feedbackRepository.create(processedData);
      return await this.feedbackRepository.save(feedback);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        throw error;
      }
      throw new Error(`Error creating shot feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing shot feedback
   * @param shot_id - Shot UUID (primary key)
   * @param updateData - Partial feedback data to update
   * @returns Promise<ShotFeedback> Updated feedback
   * @throws Error when feedback not found
   */
  async updateShotFeedback(shot_id: string, updateData: ShotFeedbackUpdateData): Promise<ShotFeedback> {
    try {
      const existingFeedback = await this.feedbackRepository.findOne({
        where: { shot_id },
      });

      if (!existingFeedback) {
        throw new Error(`Shot feedback with ID ${shot_id} not found`);
      }

      // Only update fields that are provided
      if (updateData.overall_score !== undefined) {
        existingFeedback.overall_score = this.processNumericField(updateData.overall_score);
      }
      if (updateData.acidity !== undefined) {
        existingFeedback.acidity = this.processNumericField(updateData.acidity);
      }
      if (updateData.sweetness !== undefined) {
        existingFeedback.sweetness = this.processNumericField(updateData.sweetness);
      }
      if (updateData.bitterness !== undefined) {
        existingFeedback.bitterness = this.processNumericField(updateData.bitterness);
      }
      if (updateData.body !== undefined) {
        existingFeedback.body = this.processNumericField(updateData.body);
      }
      if (updateData.extraction_assessment !== undefined) {
        existingFeedback.extraction_assessment = updateData.extraction_assessment?.trim() || null;
      }
      if (updateData.notes !== undefined) {
        existingFeedback.notes = updateData.notes?.trim() || null;
      }

      return await this.feedbackRepository.save(existingFeedback);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error updating shot feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a shot feedback
   * @param shot_id - Shot UUID (primary key)
   * @returns Promise<boolean> True if deleted, false if not found
   */
  async deleteShotFeedback(shot_id: string): Promise<boolean> {
    try {
      const existingFeedback = await this.feedbackRepository.findOne({
        where: { shot_id },
      });

      if (!existingFeedback) {
        throw new Error(`Shot feedback with ID ${shot_id} not found`);
      }

      await this.feedbackRepository.remove(existingFeedback);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Error deleting shot feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get feedbacks filtered by score range
   * @param minScore - Minimum score (1-10)
   * @param maxScore - Maximum score (1-10)
   * @returns Promise<ShotFeedback[]> Array of matching feedbacks
   */
  async getShotFeedbacksByScore(minScore: number, maxScore: number): Promise<ShotFeedback[]> {
    try {
      return await this.feedbackRepository.find({
        where: {
          overall_score: Between(minScore, maxScore)
        },
        relations: ['shot'],
      });
    } catch (error) {
      throw new Error(`Error fetching shot feedbacks by score: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    const parsed = parseInt(value.toString(), 10);
    return isNaN(parsed) ? null : parsed;
  }
}
