import { Request, Response } from 'express';
import { ShotFeedbackService } from '../services/ShotFeedbackService';
import { ShotFeedback } from '../entities/shotFeedback';

export class ShotFeedbackController {
  private shotFeedbackService: ShotFeedbackService;

  constructor() {
    this.shotFeedbackService = new ShotFeedbackService(require('../data-source').AppDataSource);
  }

  async all(request: Request, response: Response) {
    try {
      const feedbacks = await this.shotFeedbackService.getAllShotFeedbacks();
      response.json(feedbacks);
    } catch (error) {
      console.error('Error fetching shot feedbacks:', error);
      response.status(500).json({ message: 'Error fetching shot feedbacks' });
    }
  }

  async one(request: Request, response: Response) {
    try {
      const feedback = await this.shotFeedbackService.getShotFeedbackById(request.params.id);
      
      if (!feedback) {
        return response.status(404).json({ message: 'Shot feedback not found' });
      }

      response.json(feedback);
    } catch (error) {
      console.error('Error fetching shot feedback:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Shot feedback not found' });
      }
      response.status(500).json({ message: 'Error fetching shot feedback' });
    }
  }

  async save(request: Request, response: Response) {
    try {
      const { overall_score, acidity, sweetness, bitterness, body, extraction_assessment, notes } =
        request.body;

      const result = await this.shotFeedbackService.createShotFeedback({
        shot_id: request.params.id,
        overall_score,
        acidity,
        sweetness,
        bitterness,
        body,
        extraction_assessment,
        notes,
      });
      response.status(201).json(result);
    } catch (error) {
      console.error('Error creating shot:', error);
      if (error instanceof Error && error.message.includes('required')) {
        return response.status(400).json({ message: error.message });
      }
      response.status(500).json({ message: 'Error creating shot feedback' });
    }
  }

  async update(request: Request, response: Response) {
    try {
      const { overall_score, acidity, sweetness, bitterness, body, extraction_assessment, notes } =
        request.body;

      const result = await this.shotFeedbackService.updateShotFeedback(request.params.id, {
        overall_score,
        acidity,
        sweetness,
        bitterness,
        body,
        extraction_assessment,
        notes,
      });
      response.json(result);
    } catch (error) {
      console.error('Error updating shot:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Shot feedback not found' });
      }
      response.status(500).json({ message: 'Error updating shot feedback' });
    }
  }

  async remove(request: Request, response: Response) {
    try {
      await this.shotFeedbackService.deleteShotFeedback(request.params.id);
      response.status(204).send();
    } catch (error) {
      console.error('Error deleting shot feedback:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return response.status(404).json({ message: 'Shot feedback not found' });
      }
      response.status(500).json({ message: 'Error deleting shot feedback' });
    }
  }
}

export default new ShotFeedbackController();
