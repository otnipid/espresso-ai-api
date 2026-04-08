import { PredictionService } from '../../../../src/services/PredictionService';
import { AppDataSource } from '../../../../src/data-source';
import { Shot } from '../../../../src/entities/Shot';
import { ShotPreparation } from '../../../../src/entities/ShotPreparation';
import { ShotExtraction } from '../../../../src/entities/ShotExtraction';
import { BeanBatch } from '../../../../src/entities/BeanBatch';
import { Bean } from '../../../../src/entities/Bean';
import { Machine } from '../../../../src/entities/Machine';
import { Grinder } from '../../../../src/entities/Grinder';

// Mock the data source
jest.mock('../../../../src/data-source');
const mockAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;

describe('PredictionService', () => {
  let predictionService: PredictionService;
  let mockShotRepository: any;
  let mockPrepRepository: any;
  let mockExtractionRepository: any;
  let mockBatchRepository: any;
  let mockBeanRepository: any;
  let mockMachineRepository: any;
  let mockGrinderRepository: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock repositories
    mockShotRepository = {
      findOne: jest.fn(),
    };

    mockPrepRepository = {
      findOne: jest.fn(),
    };

    mockExtractionRepository = {
      findOne: jest.fn(),
    };

    mockBatchRepository = {
      findOne: jest.fn(),
    };

    mockBeanRepository = {
      findOne: jest.fn(),
    };

    mockMachineRepository = {
      findOne: jest.fn(),
    };

    mockGrinderRepository = {
      findOne: jest.fn(),
    };

    // Setup mock data source getRepository method
    mockAppDataSource.getRepository = jest.fn().mockImplementation((entity) => {
      if (entity === Shot) return mockShotRepository;
      if (entity === ShotPreparation) return mockPrepRepository;
      if (entity === ShotExtraction) return mockExtractionRepository;
      if (entity === BeanBatch) return mockBatchRepository;
      if (entity === Bean) return mockBeanRepository;
      if (entity === Machine) return mockMachineRepository;
      if (entity === Grinder) return mockGrinderRepository;
      return null;
    });

    // Initialize service
    predictionService = new PredictionService();
  });

  describe('extractFeatures', () => {
    it('should extract features for a complete shot', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const mockShot = {
        id: shotId,
        beanBatch: { id: 'batch-1' },
        machine: { id: 'machine-1' },
        grinder: { id: 'grinder-1' },
        user: { id: 'user-1' },
      };
      const mockPreparation = {
        shot_id: shotId,
        dose_grams: 18.5,
        burr_setting: 15,
        side_hopper: 2,
      };
      const mockExtraction = {
        shot_id: shotId,
        water_temp_c: 92,
        shot_time_seconds: 25,
        yield_grams: 36,
        avg_pressure_bar: 9,
      };
      const mockBeanBatch = {
        id: 'batch-1',
        roastDate: new Date('2024-01-01'),
        roastLevel: 'medium',
        bean: {
          name: 'Test Bean',
          roaster: 'Test Roaster',
        },
      };
      const mockMachine = {
        id: 'machine-1',
        model: 'La Marzocco',
      };
      const mockGrinder = {
        id: 'grinder-1',
        model: 'Fellow Ode',
        manufacturer: 'Fellow',
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockPrepRepository.findOne.mockResolvedValue(mockPreparation);
      mockExtractionRepository.findOne.mockResolvedValue(mockExtraction);
      mockBatchRepository.findOne.mockResolvedValue(mockBeanBatch);
      mockMachineRepository.findOne.mockResolvedValue(mockMachine);
      mockGrinderRepository.findOne.mockResolvedValue(mockGrinder);

      // Act
      const result = await predictionService.extractFeatures(shotId);

      // Assert
      expect(mockShotRepository.findOne).toHaveBeenCalledWith({
        where: { id: shotId },
        relations: ['beanBatch', 'machine', 'grinder', 'user'],
      });
      expect(result).toEqual({
        shotId,
        doseGrams: 18.5,
        burrSetting: 15,
        sideHopper: 2,
        waterTempC: 92,
        extractionTimeSeconds: 25,
        yieldGrams: 36,
        pressureBars: 9,
        extractionRatio: 36 / 18.5,
        machineModel: 'La Marzocco',
        grinderModel: 'Fellow Ode',
        grinderManufacturer: 'Fellow',
        beanName: 'Test Bean',
        beanRoaster: 'Test Roaster',
        roastLevel: 'medium',
        roastAge: expect.any(Number),
      });
    });

    it('should use default values when data is missing', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const mockShot = {
        id: shotId,
        beanBatch: null,
        machine: null,
        grinder: null,
        user: { id: 'user-1' },
      };

      mockShotRepository.findOne.mockResolvedValue(mockShot);
      mockPrepRepository.findOne.mockResolvedValue(null);
      mockExtractionRepository.findOne.mockResolvedValue(null);
      mockBatchRepository.findOne.mockResolvedValue(null);
      mockMachineRepository.findOne.mockResolvedValue(null);
      mockGrinderRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await predictionService.extractFeatures(shotId);

      // Assert
      expect(result).toEqual({
        shotId,
        doseGrams: 18,
        burrSetting: 15,
        sideHopper: 1,
        waterTempC: 92,
        extractionTimeSeconds: 25,
        yieldGrams: 36,
        pressureBars: 9,
        extractionRatio: 36 / 18,
        machineModel: 'unknown',
        grinderModel: 'unknown',
        grinderManufacturer: 'unknown',
        beanName: 'unknown',
        beanRoaster: 'unknown',
        roastLevel: 'medium',
        roastAge: expect.any(Number),
      });
    });

    it('should throw error when shot not found', async () => {
      // Arrange
      const shotId = 'non-existent-shot';
      mockShotRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(predictionService.extractFeatures(shotId)).rejects.toThrow(
        `Shot not found: ${shotId}`
      );
    });
  });

  describe('predictParameters', () => {
    it('should call python service with extracted features', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const mockFeatures = {
        shotId,
        doseGrams: 18.5,
        burrSetting: 15,
        sideHopper: 2,
        waterTempC: 92,
        extractionTimeSeconds: 25,
        yieldGrams: 36,
        pressureBars: 9,
        extractionRatio: 1.95,
        machineModel: 'La Marzocco',
        grinderModel: 'Fellow Ode',
        grinderManufacturer: 'Fellow',
        beanName: 'Test Bean',
        beanRoaster: 'Test Roaster',
        roastLevel: 'medium',
        roastAge: 30,
      };

      const mockPrediction = {
        burrSetting: 14,
        sideHopper: 1,
        waterTempC: 93,
        extractionTimeSeconds: 24,
        pressureBars: 8.5,
        uncertainty: 0.1,
        yieldGrams: 35,
      };

      // Mock extractFeatures method
      jest.spyOn(predictionService, 'extractFeatures').mockResolvedValue(mockFeatures);
      
      // Mock the private callPythonService method
      const mockCallPythonService = jest.spyOn(
        predictionService as any,
        'callPythonService'
      );
      mockCallPythonService.mockResolvedValue(mockPrediction);

      // Act
      const result = await predictionService.predictParameters(shotId);

      // Assert
      expect(predictionService.extractFeatures).toHaveBeenCalledWith(shotId);
      expect(mockCallPythonService).toHaveBeenCalledWith('predict_parameters', {
        shot_id: shotId,
        dose_grams: 18.5,
        burr_setting: 15,
        side_hopper: 2,
        water_temp_c: 92,
        extraction_time_seconds: 25,
        yield_grams: 36,
        pressure_bars: 9,
        machine_model: 'La Marzocco',
        grinder_model: 'Fellow Ode',
        grinder_manufacturer: 'Fellow',
        bean_name: 'Test Bean',
        bean_roaster: 'Test Roaster',
        roast_level: 'medium',
      });
      expect(result).toEqual(mockPrediction);
    });

    it('should handle prediction errors', async () => {
      // Arrange
      const shotId = 'test-shot-id';
      const error = new Error('Python service failed');

      jest.spyOn(predictionService, 'extractFeatures').mockRejectedValue(error);

      // Act & Assert
      await expect(predictionService.predictParameters(shotId)).rejects.toThrow(
        'Parameter prediction failed: Python service failed'
      );
    });
  });

  describe('getFeatureImportance', () => {
    it('should return default feature importance values', async () => {
      // Act
      const result = await predictionService.getFeatureImportance();

      // Assert
      expect(result).toEqual({
        doseGrams: 0.25,
        grindSetting: 0.2,
        waterTempC: 0.15,
        extractionTimeSeconds: 0.15,
        pressureBars: 0.1,
        machineModel: 0.05,
        grinderModel: 0.05,
        beanName: 0.03,
        roastLevel: 0.02,
      });
    });
  });

  describe('getModelMetrics', () => {
    it('should return default model metrics', async () => {
      // Act
      const result = await predictionService.getModelMetrics();

      // Assert
      expect(result).toEqual({
        accuracy: 0.85,
        meanSquaredError: 0.12,
        trainingDataPoints: 1000,
        lastTrainingDate: expect.any(Date),
        modelVersion: '1.0.0',
      });
    });
  });

  describe('saveFeaturesToDatabase', () => {
    it('should log features to console', async () => {
      // Arrange
      const mockFeatures = {
        shotId: 'test-shot-id',
        doseGrams: 18.5,
        burrSetting: 15,
        sideHopper: 2,
        waterTempC: 92,
        extractionTimeSeconds: 25,
        yieldGrams: 36,
        pressureBars: 9,
        extractionRatio: 1.95,
        machineModel: 'La Marzocco',
        grinderModel: 'Fellow Ode',
        grinderManufacturer: 'Fellow',
        beanName: 'Test Bean',
        beanRoaster: 'Test Roaster',
        roastLevel: 'medium',
        roastAge: 30,
      };

      // Mock console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await predictionService.saveFeaturesToDatabase(mockFeatures);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Saving features to database:', 'test-shot-id');
      
      // Cleanup
      consoleSpy.mockRestore();
    });
  });
});