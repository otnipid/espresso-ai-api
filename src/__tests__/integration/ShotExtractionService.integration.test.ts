import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { ShotExtractionService } from '../../services/ShotExtractionService';
import { ShotExtraction } from '../../entities/ShotExtraction';
import { Shot } from '../../entities/Shot';
import { Repository } from 'typeorm';

// This is crucial: tell Vitest to replace the real '../../data-source' module
// with our mock, so we can control what getDataSource() returns in tests.
vi.mock('../../data-source');

describe('ShotExtractionService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let shotExtractionService: ShotExtractionService;
  let shotRepository: Repository<Shot>;
  let shotExtractionRepository: Repository<ShotExtraction>;

  // Start single container ONCE before all tests in this file
  beforeAll(async () => {
    await containerManager.initialize();
  }, 60000); // Increase timeout for container init

  // Stop single container ONCE after all tests in this file are done
  afterAll(async () => {
    await containerManager.teardown();
  }, 60000); // Increase timeout for container teardown

  // Restore snapshot and get a fresh DB connection BEFORE EACH test
  beforeEach(async () => {
    testDb = await containerManager.setupTestDatabase();

    // Point mocked getDataSource function to return our test database DataSource
    vi.mocked(getDataSource).mockReturnValue(testDb.dataSource);

    // Initialize service with mocked DataSource
    shotExtractionService = new ShotExtractionService(testDb.dataSource);

    // Get repositories for test data setup
    shotRepository = testDb.dataSource.getRepository(Shot);
    shotExtractionRepository = testDb.dataSource.getRepository(ShotExtraction);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  describe('createShotExtraction', () => {
    it('should create a shot extraction with all fields', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      // Act: Call service method
      const result = await shotExtractionService.createShotExtraction(extractionData);

      // Assert: Verify extraction was created
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.yield_grams).toBe(36.5); // Service returns number for create
      expect(result.shot_time_seconds).toBe(25.5); // Service returns number for create
      expect(result.avg_pressure_bar).toBe(9.2); // Service returns number for create
      expect(result.water_temp_c).toBe(92.5); // Service returns number for create
      expect(result.preinfusion_seconds).toBe(4.0); // Service returns number for create
      expect(result.peak_pressure_bar).toBe(10.5); // Service returns number for create
    });

    it('should handle null values correctly', async () => {
      // Arrange: Create test data with null values
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: null,
        shot_time_seconds: null,
        avg_pressure_bar: null,
        water_temp_c: null,
        preinfusion_seconds: null,
        peak_pressure_bar: null,
      };

      // Act: Call service method
      const result = await shotExtractionService.createShotExtraction(extractionData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.yield_grams).toBeNull();
      expect(result.shot_time_seconds).toBeNull();
      expect(result.avg_pressure_bar).toBeNull();
      expect(result.water_temp_c).toBeNull();
      expect(result.preinfusion_seconds).toBeNull();
      expect(result.peak_pressure_bar).toBeNull();
    });

    it('should handle string numeric values correctly', async () => {
      // Arrange: Create test data with string numeric values
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: '38.0',
        shot_time_seconds: '27.0',
        avg_pressure_bar: '9.5',
        water_temp_c: '93.0',
        preinfusion_seconds: '5.0',
        peak_pressure_bar: '11.0',
      };

      // Act: Call service method
      const result = await shotExtractionService.createShotExtraction(extractionData);

      // Assert: Verify string numeric values are converted to numbers
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.yield_grams).toBe(38.0);
      expect(result.shot_time_seconds).toBe(27.0);
      expect(result.avg_pressure_bar).toBe(9.5);
      expect(result.water_temp_c).toBe(93.0);
      expect(result.preinfusion_seconds).toBe(5.0);
      expect(result.peak_pressure_bar).toBe(11.0);
    });

    it('should handle invalid numeric values by setting them to null', async () => {
      // Arrange: Create test data with invalid numeric values
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: 'invalid-yield',
        shot_time_seconds: 'invalid-time',
        avg_pressure_bar: 'invalid-pressure',
        water_temp_c: 'invalid-temp',
        preinfusion_seconds: 'invalid-preinfusion',
        peak_pressure_bar: 'invalid-peak',
      };

      // Act: Call service method
      const result = await shotExtractionService.createShotExtraction(extractionData);

      // Assert: Verify invalid numeric values are set to null
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.yield_grams).toBeNull();
      expect(result.shot_time_seconds).toBeNull();
      expect(result.avg_pressure_bar).toBeNull();
      expect(result.water_temp_c).toBeNull();
      expect(result.preinfusion_seconds).toBeNull();
      expect(result.peak_pressure_bar).toBeNull();
    });

    it('should throw error when shot does not exist', async () => {
      // Arrange: Create extraction data for non-existent shot
      const extractionData = {
        shot_id: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      // Act & Assert: Should throw error for non-existent shot
      await expect(shotExtractionService.createShotExtraction(extractionData)).rejects.toThrow(
        'Shot with ID 550e8400-e29b-41d4-a716-446655440001 not found'
      );
    });

    it('should throw error when shot ID is missing', async () => {
      // Arrange: Create extraction data with missing shot ID
      const extractionData = {
        shot_id: '', // Empty shot ID
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      // Act & Assert: Should throw error for missing shot ID
      await expect(shotExtractionService.createShotExtraction(extractionData)).rejects.toThrow(
        'Shot ID is required'
      );
    });
  });

  describe('getShotExtractionById', () => {
    it('should return shot extraction when found', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      const extraction = await shotExtractionService.createShotExtraction(extractionData);

      // Act: Get extraction by ID
      const result = await shotExtractionService.getShotExtractionById(extraction.shot_id);

      // Assert: Verify extraction is returned
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(extraction.shot_id);
      expect(result.yield_grams).toBe('36.50'); // Service returns string for read
      expect(result.shot_time_seconds).toBe('25.50'); // Service returns string for read
      expect(result.avg_pressure_bar).toBe('9.20'); // Service returns string for read
      expect(result.water_temp_c).toBe('92.5'); // Service returns string for read
      expect(result.preinfusion_seconds).toBe('4.0'); // Service returns string for read
      expect(result.peak_pressure_bar).toBe('10.50'); // Service returns string for read
    });

    it('should throw error when extraction not found', async () => {
      // Act & Assert: Should throw error for non-existent extraction
      await expect(
        shotExtractionService.getShotExtractionById('550e8400-e29b-41d4-a716-446655440002')
      ).rejects.toThrow('Shot extraction with ID 550e8400-e29b-41d4-a716-446655440002 not found');
    });
  });

  describe('getAllShotExtractions', () => {
    it('should return all shot extractions', async () => {
      // Arrange: Create test data with multiple extractions
      const shot1 = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot1 = await shotRepository.save(shot1);

      const shot2 = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot2 = await shotRepository.save(shot2);

      const extraction1Data = {
        shot_id: savedShot1.id,
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      const extraction2Data = {
        shot_id: savedShot2.id,
        yield_grams: 38.0,
        shot_time_seconds: 27.0,
        avg_pressure_bar: 9.5,
        water_temp_c: 93.0,
        preinfusion_seconds: 5.0,
        peak_pressure_bar: 11.0,
      };

      const extraction1 = await shotExtractionService.createShotExtraction(extraction1Data);
      const extraction2 = await shotExtractionService.createShotExtraction(extraction2Data);

      // Act: Get all extractions
      const result = await shotExtractionService.getAllShotExtractions();

      // Assert: Verify all extractions are returned
      expect(result).toHaveLength(2);
      expect(result[0].shot_id).toBe(extraction1.shot_id);
      expect(result[1].shot_id).toBe(extraction2.shot_id);
      expect(result[0].yield_grams).toBe('36.50'); // Service returns string for read
      expect(result[1].yield_grams).toBe('38.00'); // Service returns string for read
    });

    it('should return empty array when no extractions exist', async () => {
      // Act: Get all extractions
      const result = await shotExtractionService.getAllShotExtractions();

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateShotExtraction', () => {
    it('should update existing extraction', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      const extraction = await shotExtractionService.createShotExtraction(extractionData);

      const updateData = {
        yield_grams: 38.0,
        shot_time_seconds: 27.0,
        avg_pressure_bar: 9.5,
      };

      // Act: Update extraction
      const result = await shotExtractionService.updateShotExtraction(
        extraction.shot_id,
        updateData
      );

      // Assert: Verify extraction was updated
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(extraction.shot_id);
      expect(result.yield_grams).toBe(38.0);
      expect(result.shot_time_seconds).toBe(27.0);
      expect(result.avg_pressure_bar).toBe(9.5);
      expect(result.water_temp_c).toBe('92.5'); // Service returns string for read // Should remain unchanged
      expect(result.preinfusion_seconds).toBe('4.0'); // Service returns string for read // Should remain unchanged
      expect(result.peak_pressure_bar).toBe('10.50'); // Service returns string for read // Should remain unchanged
    });

    it('should handle partial updates correctly', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      const extraction = await shotExtractionService.createShotExtraction(extractionData);

      const updateData = {
        yield_grams: 40.0,
      };

      // Act: Update extraction partially
      const result = await shotExtractionService.updateShotExtraction(
        extraction.shot_id,
        updateData
      );

      // Assert: Verify only specified fields were updated
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(extraction.shot_id);
      expect(result.yield_grams).toBe(40.0);
      expect(result.shot_time_seconds).toBe('25.50'); // Service returns string for read // Should remain unchanged
      expect(result.avg_pressure_bar).toBe('9.20'); // Service returns string for read // Should remain unchanged
      expect(result.water_temp_c).toBe('92.5'); // Service returns string for read // Should remain unchanged
      expect(result.preinfusion_seconds).toBe('4.0'); // Service returns string for read // Should remain unchanged
      expect(result.peak_pressure_bar).toBe('10.50'); // Service returns string for read // Should remain unchanged
    });

    it('should handle null values in updates', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      const extraction = await shotExtractionService.createShotExtraction(extractionData);

      const updateData = {
        yield_grams: null,
        shot_time_seconds: null,
        avg_pressure_bar: null,
        water_temp_c: null,
        preinfusion_seconds: null,
        peak_pressure_bar: null,
      };

      // Act: Update extraction with null values
      const result = await shotExtractionService.updateShotExtraction(
        extraction.shot_id,
        updateData
      );

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(extraction.shot_id);
      expect(result.yield_grams).toBeNull();
      expect(result.shot_time_seconds).toBeNull();
      expect(result.avg_pressure_bar).toBeNull();
      expect(result.water_temp_c).toBeNull();
      expect(result.preinfusion_seconds).toBeNull();
      expect(result.peak_pressure_bar).toBeNull();
    });

    it('should handle string numeric values in updates', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      const extraction = await shotExtractionService.createShotExtraction(extractionData);

      const updateData = {
        yield_grams: '42.0',
        shot_time_seconds: '30.0',
        avg_pressure_bar: '10.0',
        water_temp_c: '95.0',
        preinfusion_seconds: '6.0',
        peak_pressure_bar: '12.0',
      };

      // Act: Update extraction with string numeric values
      const result = await shotExtractionService.updateShotExtraction(
        extraction.shot_id,
        updateData
      );

      // Assert: Verify string numeric values are converted to numbers
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(extraction.shot_id);
      expect(result.yield_grams).toBe(42.0);
      expect(result.shot_time_seconds).toBe(30.0);
      expect(result.avg_pressure_bar).toBe(10.0);
      expect(result.water_temp_c).toBe(95.0);
      expect(result.preinfusion_seconds).toBe(6.0);
      expect(result.peak_pressure_bar).toBe(12.0);
    });

    it('should handle invalid numeric values in updates by setting them to null', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      const extraction = await shotExtractionService.createShotExtraction(extractionData);

      const updateData = {
        yield_grams: 'invalid-yield',
        shot_time_seconds: 'invalid-time',
        avg_pressure_bar: 'invalid-pressure',
      };

      // Act: Update extraction with invalid numeric values
      const result = await shotExtractionService.updateShotExtraction(
        extraction.shot_id,
        updateData
      );

      // Assert: Verify invalid numeric values are set to null
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(extraction.shot_id);
      expect(result.yield_grams).toBeNull();
      expect(result.shot_time_seconds).toBeNull();
      expect(result.avg_pressure_bar).toBeNull();
      expect(result.water_temp_c).toBe('92.5'); // Service returns string for read // Should remain unchanged
      expect(result.preinfusion_seconds).toBe('4.0'); // Service returns string for read // Should remain unchanged
      expect(result.peak_pressure_bar).toBe('10.50'); // Service returns string for read // Should remain unchanged
    });

    it('should throw error when updating non-existent extraction', async () => {
      // Act & Assert: Should throw error for non-existent extraction
      const updateData = {
        yield_grams: 38.0,
      };
      await expect(
        shotExtractionService.updateShotExtraction(
          '550e8400-e29b-41d4-a716-446655440003',
          updateData
        )
      ).rejects.toThrow('Shot extraction with ID 550e8400-e29b-41d4-a716-446655440003 not found');
    });
  });

  describe('deleteShotExtraction', () => {
    it('should delete existing extraction', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const extractionData = {
        shot_id: savedShot.id,
        yield_grams: 36.5,
        shot_time_seconds: 25.5,
        avg_pressure_bar: 9.2,
        water_temp_c: 92.5,
        preinfusion_seconds: 4.0,
        peak_pressure_bar: 10.5,
      };

      const extraction = await shotExtractionService.createShotExtraction(extractionData);

      // Act: Delete extraction
      const result = await shotExtractionService.deleteShotExtraction(extraction.shot_id);

      // Assert: Verify deletion was successful
      expect(result).toBe(true);
    });

    it('should throw error when deleting non-existent extraction', async () => {
      // Act & Assert: Should throw error for non-existent extraction
      await expect(
        shotExtractionService.deleteShotExtraction('550e8400-e29b-41d4-a716-446655440004')
      ).rejects.toThrow('Shot extraction with ID 550e8400-e29b-41d4-a716-446655440004 not found');
    });
  });
});
