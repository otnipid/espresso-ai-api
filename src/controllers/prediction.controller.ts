import { Request, Response } from 'express';
import { PredictionService } from '../services/PredictionService';
import { AppDataSource } from '../data-source';
import { Shot } from '../entities/Shot';

export class PredictionController {
  private predictionService: PredictionService;

  constructor() {
    this.predictionService = new PredictionService();
  }

  /**
   * Predicts optimal espresso shot parameters for a given shot using ML
   *
   * @param request - Express request object containing shotId in params
   * @param response - Express response object
   *
   * @returns {Promise<void>} - Returns JSON response with:
   *   - 200: { success: true, data: ParameterPrediction }
   *   - 400: { message: string } - Invalid shot ID
   *   - 404: { message: string } - Shot not found
   *   - 500: { message: string, error?: string } - Server error
   */
  async predictParameters(request: Request, response: Response) {
    try {
      const { shotId } = request.params;

      // Request error handling
      if (!shotId) {
        return response.status(400).json({
          message: 'Invalid request! Shot ID is undefined!',
        });
      } else if (typeof shotId !== 'string') {
        return response.status(400).json({
          message: 'Invalid shot ID. Shot ID must be a string!',
        });
      }

      // Verify shot exists
      const shotRepository = AppDataSource.getRepository(Shot);
      const shot = await shotRepository.findOne({ where: { id: shotId } });

      if (!shot) {
        return response.status(404).json({
          message: 'Shot not found',
        });
      }

      const prediction = await this.predictionService.predictParameters(shotId);

      response.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      console.error('Error predicting parameters:', error);
      response.status(500).json({
        message: 'Error predicting parameters',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Retrieves feature importance scores from the ML model
   *
   * @param request - Express request object (no parameters required)
   * @param response - Express response object
   *
   * @returns {Promise<void>} - Returns JSON response with:
   *   - 200: { success: true, data: FeatureImportance }
   *   - 500: { message: string, error?: string } - Server error
   */
  async getFeatureImportance(request: Request, response: Response) {
    try {
      const importance = await this.predictionService.getFeatureImportance();

      response.status(200).json({
        success: true,
        data: importance,
      });
    } catch (error) {
      console.error('Error getting feature importance:', error);
      response.status(500).json({
        message: 'Error getting feature importance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Retrieves ML model performance metrics and statistics
   *
   * @param request - Express request object (no parameters required)
   * @param response - Express response object
   *
   * @returns {Promise<void>} - Returns JSON response with:
   *   - 200: { success: true, data: ModelMetrics }
   *   - 500: { message: string, error?: string } - Server error
   */
  async getModelMetrics(request: Request, response: Response) {
    try {
      const metrics = await this.predictionService.getModelMetrics();

      response.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Error getting model metrics:', error);
      response.status(500).json({
        message: 'Error getting model metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Predicts parameters directly from shot data without requiring a database shot
   *
   * @param request - Express request object containing shotData in body
   * @param response - Express response object
   *
   * @returns {Promise<void>} - Returns JSON response with:
   *   - 200: { success: true, data: ParameterPrediction }
   *   - 400: { message: string } - Invalid or missing shot data
   *   - 500: { message: string, error?: string } - Server error
   */
  async predictParametersFromData(request: Request, response: Response) {
    try {
      const shotData = request.body;

      // Request error handling
      if (!shotData) {
        return response.status(400).json({
          message: 'Invalid request! Shot data is undefined!',
        });
      } else if (typeof shotData !== 'object') {
        return response.status(400).json({
          message: 'Invalid shot data. Shot data must be an object!',
        });
      }

      // Validate required fields
      const requiredFields = ['dose_grams', 'burr_setting', 'side_hopper', 'water_temp_c'];
      for (const field of requiredFields) {
        if (!(field in shotData)) {
          return response.status(400).json({
            message: `Missing required field: ${field}`,
          });
        }
      }

      // Create a temporary shot ID for prediction
      const tempShotId = `temp-${Date.now()}`;

      const prediction = await this.predictionService.predictParameters(tempShotId);

      response.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      console.error('Error predicting from data:', error);
      response.status(500).json({
        message: 'Error predicting from data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Extracts and saves ML features for a specific shot to the database
   *
   * @param request - Express request object containing shotId in params
   * @param response - Express response object
   *
   * @returns {Promise<void>} - Returns JSON response with:
   *   - 200: { success: true, message: string }
   *   - 400: { message: string } - Invalid shot ID
   *   - 500: { message: string, error?: string } - Server error
   */
  async saveFeatures(request: Request, response: Response) {
    try {
      const { shotId } = request.params;

      // Request error handling
      if (!shotId) {
        return response.status(400).json({
          message: 'Invalid request! Shot ID is undefined!',
        });
      } else if (typeof shotId !== 'string') {
        return response.status(400).json({
          message: 'Invalid shot ID. Shot ID must be a string!',
        });
      }

      const features = await this.predictionService.extractFeatures(shotId);
      await this.predictionService.saveFeaturesToDatabase(features);

      response.status(200).json({
        success: true,
        message: 'Features saved successfully',
      });
    } catch (error) {
      console.error('Error saving features:', error);
      response.status(500).json({
        message: 'Error saving features',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
