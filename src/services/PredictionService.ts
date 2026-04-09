import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../data-source';
import { Shot } from '../entities/Shot';
import { ShotPreparation } from '../entities/ShotPreparation';
import { ShotExtraction } from '../entities/ShotExtraction';
import { BeanBatch } from '../entities/BeanBatch';
import { Machine } from '../entities/Machine';
import { Grinder } from '../entities/Grinder';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface PredictionFeatures {
  shotId: string;
  // Raw features
  doseGrams: number;
  burrSetting: number;
  sideHopper: number;
  waterTempC: number;
  extractionTimeSeconds: number;
  yieldGrams: number;
  pressureBars: number;

  // Engineered features
  extractionRatio: number;

  // Equipment features
  machineModel: string;
  grinderModel: string;
  grinderManufacturer: string;

  // Bean features
  beanName: string;
  beanRoaster: string;
  roastLevel: string;
  roastAge: number;
}

export interface ParameterPrediction {
  burrSetting: number;
  sideHopper: number;
  waterTempC: number;
  extractionTimeSeconds: number;
  pressureBars: number;
  uncertainty: number;
  yieldGrams: number;
}

export class PredictionService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../ml_service.py');
  }

  async extractFeatures(shotId: string): Promise<PredictionFeatures> {
    const shotRepository = AppDataSource.getRepository(Shot);
    const prepRepository = AppDataSource.getRepository(ShotPreparation);
    const extractionRepository = AppDataSource.getRepository(ShotExtraction);
    const batchRepository = AppDataSource.getRepository(BeanBatch);
    const machineRepository = AppDataSource.getRepository(Machine);
    const grinderRepository = AppDataSource.getRepository(Grinder);

    // Get shot and related data
    const shot = await shotRepository.findOne({
      where: { id: shotId },
      relations: ['beanBatch', 'machine', 'grinder', 'user'],
    });

    if (!shot) {
      throw new Error(`Shot not found: ${shotId}`);
    }

    const preparation = await prepRepository.findOne({
      where: { shot_id: shotId },
    });

    const extraction = await extractionRepository.findOne({
      where: { shot_id: shotId },
    });

    const beanBatch = await batchRepository.findOne({
      where: { id: shot.beanBatch?.id },
    });

    const bean = beanBatch; 

    const machine = await machineRepository.findOne({
      where: { id: shot.machine?.id },
    });

    const grinder = await grinderRepository.findOne({
      where: { id: shot.grinder?.id },
    });

    // Extract raw features
    const rawFeatures = {
      doseGrams: preparation?.dose_grams || 18,
      burrSetting: preparation?.burr_setting || 15,
      sideHopper: preparation?.side_hopper || 1,
      waterTempC: extraction?.water_temp_c || 92,
      extractionTimeSeconds: extraction?.shot_time_seconds || 25,
      yieldGrams: extraction?.yield_grams || 36,
      pressureBars: extraction?.avg_pressure_bar || 9,
      extractionRatio: (extraction?.yield_grams || 36) / (preparation?.dose_grams || 18),
    };

    // Calculate roast age
    const roastAge = beanBatch ? this.calculateRoastAge(beanBatch.roastDate) : 30;

    // Equipment features
    const equipmentFeatures = {
      machineModel: machine?.model || 'unknown',
      grinderModel: grinder?.model || 'unknown',
      grinderManufacturer: grinder?.manufacturer || 'unknown',
    };

    // Bean features
    const beanFeatures = {
      beanName: bean?.name || 'unknown',
      beanRoaster: bean?.roaster || 'unknown',
      roastLevel: beanBatch?.roastLevel || 'medium',
      roastAge,
    };

    return {
      shotId,
      ...rawFeatures,
      ...equipmentFeatures,
      ...beanFeatures,
    };
  }

  private calculateRoastAge(roastDate: Date): number {
    const now = new Date();
    const roast = new Date(roastDate);
    const daysSinceRoast = Math.floor((now.getTime() - roast.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceRoast;
  }

  async predictParameters(shotId: string): Promise<ParameterPrediction> {
    try {
      // Extract features
      const features = await this.extractFeatures(shotId);

      // Call Python ML service
      const prediction = await this.callPythonService('predict_parameters', {
        shot_id: features.shotId,
        dose_grams: features.doseGrams,
        burr_setting: features.burrSetting,
        side_hopper: features.sideHopper,
        water_temp_c: features.waterTempC,
        extraction_time_seconds: features.extractionTimeSeconds,
        yield_grams: features.yieldGrams,
        pressure_bars: features.pressureBars,
        machine_model: features.machineModel,
        grinder_model: features.grinderModel,
        grinder_manufacturer: features.grinderManufacturer,
        bean_name: features.beanName,
        bean_roaster: features.beanRoaster,
        roast_level: features.roastLevel,
      });

      return prediction;
    } catch (error) {
      console.error('Error predicting parameters:', error);
      throw new Error(
        `Parameter prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async callPythonService(method: string, data: any): Promise<any> {
    try {
      // Create temporary input file
      const inputFile = path.join(__dirname, `../../temp_input_${Date.now()}.json`);
      const outputFile = path.join(__dirname, `../../temp_output_${Date.now()}.json`);

      fs.writeFileSync(inputFile, JSON.stringify({ method, data }));

      // Call Python script
      const pythonCommand = `python3 ${this.pythonScriptPath} ${inputFile} ${outputFile}`;
      const { stdout, stderr } = await execAsync(pythonCommand);

      if (stderr) {
        console.warn('Python service warning:', stderr);
      }

      // Read output
      if (fs.existsSync(outputFile)) {
        const output = fs.readFileSync(outputFile, 'utf8');
        const result = JSON.parse(output);

        // Clean up temporary files
        fs.unlinkSync(inputFile);
        fs.unlinkSync(outputFile);

        return result;
      } else {
        throw new Error('Python service did not produce output file');
      }
    } catch (error) {
      console.error('Error calling Python service:', error);
      throw error;
    }
  }

  async saveFeaturesToDatabase(features: PredictionFeatures): Promise<void> {
    // This would save features to the prediction_features table
    // For now, just log the features
    console.log('Saving features to database:', features.shotId);
  }

  async getFeatureImportance(): Promise<Record<string, number>> {
    // This would return feature importance from the trained model
    // For now, return default importance
    return {
      doseGrams: 0.25,
      grindSetting: 0.2,
      waterTempC: 0.15,
      extractionTimeSeconds: 0.15,
      pressureBars: 0.1,
      machineModel: 0.05,
      grinderModel: 0.05,
      beanName: 0.03,
      roastLevel: 0.02,
    };
  }

  async getModelMetrics(): Promise<Record<string, any>> {
    // This would return model performance metrics
    // For now, return default metrics
    return {
      accuracy: 0.85,
      meanSquaredError: 0.12,
      trainingDataPoints: 1000,
      lastTrainingDate: new Date(),
      modelVersion: '1.0.0',
    };
  }
}
