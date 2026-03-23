import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostgresContainerManager, type TestDatabase } from '../setup.integration';
import { getDataSource } from '../../data-source';
import { ShotFeedbackService } from '../../services/ShotFeedbackService';
import { ShotFeedback } from '../../entities/shotFeedback';
import { Shot } from '../../entities/Shot';
import { Repository } from 'typeorm';

// This is crucial: tell Vitest to replace the real '../../data-source' module
// with our mock, so we can control what getDataSource() returns in tests.
vi.mock('../../data-source');

describe('ShotFeedbackService Integration Tests', () => {
  const containerManager = PostgresContainerManager.getInstance();
  let testDb: TestDatabase;
  let shotFeedbackService: ShotFeedbackService;
  let shotRepository: Repository<Shot>;
  let shotFeedbackRepository: Repository<ShotFeedback>;

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
    shotFeedbackService = new ShotFeedbackService(testDb.dataSource);

    // Get repositories for test data setup
    shotRepository = testDb.dataSource.getRepository(Shot);
    shotFeedbackRepository = testDb.dataSource.getRepository(ShotFeedback);
  });

  // Clean up the test database connection AFTER EACH test
  afterEach(async () => {
    await testDb.cleanup(); // Release DataSource
    vi.clearAllMocks(); // Reset mocks between tests
  });

  describe('createShotFeedback', () => {
    it('should create a shot feedback with all fields', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      // Act: Call service method
      const result = await shotFeedbackService.createShotFeedback(feedbackData);

      // Assert: Verify feedback was created
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.overall_score).toBe(8);
      expect(result.acidity).toBe(7);
      expect(result.sweetness).toBe(8);
      expect(result.bitterness).toBe(6);
      expect(result.body).toBe(7);
      expect(result.extraction_assessment).toBe('Well balanced extraction');
      expect(result.notes).toBe('Good crema, pleasant aroma');
    });

    it('should handle null values correctly', async () => {
      // Arrange: Create test data with null values
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: null,
        acidity: null,
        sweetness: null,
        bitterness: null,
        body: null,
        extraction_assessment: null,
        notes: null,
      };

      // Act: Call service method
      const result = await shotFeedbackService.createShotFeedback(feedbackData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.overall_score).toBeNull();
      expect(result.acidity).toBeNull();
      expect(result.sweetness).toBeNull();
      expect(result.bitterness).toBeNull();
      expect(result.body).toBeNull();
      expect(result.extraction_assessment).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should handle string numeric values correctly', async () => {
      // Arrange: Create test data with string numeric values
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: '9',
        acidity: '8',
        sweetness: '9',
        bitterness: '7',
        body: '8',
        extraction_assessment: 'Excellent extraction',
        notes: 'Perfect balance',
      };

      // Act: Call service method
      const result = await shotFeedbackService.createShotFeedback(feedbackData);

      // Assert: Verify string numeric values are converted to numbers
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.overall_score).toBe(9);
      expect(result.acidity).toBe(8);
      expect(result.sweetness).toBe(9);
      expect(result.bitterness).toBe(7);
      expect(result.body).toBe(8);
      expect(result.extraction_assessment).toBe('Excellent extraction');
      expect(result.notes).toBe('Perfect balance');
    });

    it('should handle invalid numeric values by setting them to null', async () => {
      // Arrange: Create test data with invalid numeric values
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 'invalid-score',
        acidity: 'invalid-acidity',
        sweetness: 'invalid-sweetness',
        bitterness: 'invalid-bitterness',
        body: 'invalid-body',
        extraction_assessment: 'Test assessment',
        notes: 'Test notes',
      };

      // Act: Call service method
      const result = await shotFeedbackService.createShotFeedback(feedbackData);

      // Assert: Verify invalid numeric values are set to null
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.overall_score).toBeNull();
      expect(result.acidity).toBeNull();
      expect(result.sweetness).toBeNull();
      expect(result.bitterness).toBeNull();
      expect(result.body).toBeNull();
      expect(result.extraction_assessment).toBe('Test assessment');
      expect(result.notes).toBe('Test notes');
    });

    it('should trim whitespace from string fields', async () => {
      // Arrange: Create test data with extra whitespace
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: '  Well balanced extraction  ',
        notes: '  Good crema, pleasant aroma  ',
      };

      // Act: Call service method
      const result = await shotFeedbackService.createShotFeedback(feedbackData);

      // Assert: Verify whitespace is trimmed
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.extraction_assessment).toBe('Well balanced extraction');
      expect(result.notes).toBe('Good crema, pleasant aroma');
    });

    it('should handle empty string fields by setting them to null', async () => {
      // Arrange: Create test data with empty strings
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: '', // Empty string
        notes: '', // Empty string
      };

      // Act: Call service method
      const result = await shotFeedbackService.createShotFeedback(feedbackData);

      // Assert: Verify empty strings are set to null
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(savedShot.id);
      expect(result.extraction_assessment).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should throw error when shot does not exist', async () => {
      // Arrange: Create feedback data for non-existent shot
      const feedbackData = {
        shot_id: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      // Act & Assert: Should throw error for non-existent shot
      await expect(shotFeedbackService.createShotFeedback(feedbackData)).rejects.toThrow(
        'Shot with ID 550e8400-e29b-41d4-a716-446655440001 not found'
      );
    });

    it('should throw error when shot ID is missing', async () => {
      // Arrange: Create feedback data with missing shot ID
      const feedbackData = {
        shot_id: '', // Empty shot ID
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      // Act & Assert: Should throw error for missing shot ID
      await expect(shotFeedbackService.createShotFeedback(feedbackData)).rejects.toThrow(
        'Shot ID is required'
      );
    });
  });

  describe('getShotFeedbackById', () => {
    it('should return shot feedback when found', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback = await shotFeedbackService.createShotFeedback(feedbackData);

      // Act: Get feedback by ID
      const result = await shotFeedbackService.getShotFeedbackById(feedback.shot_id);

      // Assert: Verify feedback is returned
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(feedback.shot_id);
      expect(result.overall_score).toBe(8);
      expect(result.acidity).toBe(7);
      expect(result.sweetness).toBe(8);
      expect(result.bitterness).toBe(6);
      expect(result.body).toBe(7);
      expect(result.extraction_assessment).toBe('Well balanced extraction');
      expect(result.notes).toBe('Good crema, pleasant aroma');
    });

    it('should throw error when feedback not found', async () => {
      // Act & Assert: Should throw error for non-existent feedback
      await expect(
        shotFeedbackService.getShotFeedbackById('550e8400-e29b-41d4-a716-446655440002')
      ).rejects.toThrow('Shot feedback with ID 550e8400-e29b-41d4-a716-446655440002 not found');
    });
  });

  describe('getAllShotFeedbacks', () => {
    it('should return all shot feedbacks', async () => {
      // Arrange: Create test data with multiple feedbacks
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

      const feedback1Data = {
        shot_id: savedShot1.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback2Data = {
        shot_id: savedShot2.id,
        overall_score: 9,
        acidity: 8,
        sweetness: 9,
        bitterness: 7,
        body: 8,
        extraction_assessment: 'Excellent extraction',
        notes: 'Perfect balance',
      };

      const feedback1 = await shotFeedbackService.createShotFeedback(feedback1Data);
      const feedback2 = await shotFeedbackService.createShotFeedback(feedback2Data);

      // Act: Get all feedbacks
      const result = await shotFeedbackService.getAllShotFeedbacks();

      // Assert: Verify all feedbacks are returned
      expect(result).toHaveLength(2);
      expect(result[0].shot_id).toBe(feedback1.shot_id);
      expect(result[1].shot_id).toBe(feedback2.shot_id);
      expect(result[0].overall_score).toBe(8);
      expect(result[1].overall_score).toBe(9);
    });

    it('should return empty array when no feedbacks exist', async () => {
      // Act: Get all feedbacks
      const result = await shotFeedbackService.getAllShotFeedbacks();

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('getShotFeedbacksByScore', () => {
    it('should return feedbacks within score range', async () => {
      // Arrange: Create test data with multiple feedbacks
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

      const shot3 = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot3 = await shotRepository.save(shot3);

      const feedback1Data = {
        shot_id: savedShot1.id,
        overall_score: 7, // Within range
        acidity: 6,
        sweetness: 7,
        bitterness: 5,
        body: 6,
        extraction_assessment: 'Good extraction',
        notes: 'Balanced flavor',
      };

      const feedback2Data = {
        shot_id: savedShot2.id,
        overall_score: 8, // Within range
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback3Data = {
        shot_id: savedShot3.id,
        overall_score: 10, // Outside range
        acidity: 9,
        sweetness: 9,
        bitterness: 8,
        body: 9,
        extraction_assessment: 'Perfect extraction',
        notes: 'Exceptional flavor',
      };

      const feedback1 = await shotFeedbackService.createShotFeedback(feedback1Data);
      const feedback2 = await shotFeedbackService.createShotFeedback(feedback2Data);
      await shotFeedbackService.createShotFeedback(feedback3Data);

      // Act: Get feedbacks by score range
      const result = await shotFeedbackService.getShotFeedbacksByScore(6, 8);

      // Assert: Verify feedbacks within range are returned
      expect(result).toHaveLength(2);
      expect(result[0].shot_id).toBe(feedback1.shot_id);
      expect(result[1].shot_id).toBe(feedback2.shot_id);
      expect(result[0].overall_score).toBe(7);
      expect(result[1].overall_score).toBe(8);
    });

    it('should return empty array when no feedbacks within score range', async () => {
      // Arrange: Create feedbacks with scores outside range
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 10, // Outside range
        acidity: 9,
        sweetness: 9,
        bitterness: 8,
        body: 9,
        extraction_assessment: 'Perfect extraction',
        notes: 'Exceptional flavor',
      };

      await shotFeedbackService.createShotFeedback(feedbackData);

      // Act: Get feedbacks by score range
      const result = await shotFeedbackService.getShotFeedbacksByScore(6, 8);

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no feedbacks exist', async () => {
      // Act: Get feedbacks by score range
      const result = await shotFeedbackService.getShotFeedbacksByScore(6, 8);

      // Assert: Should return empty array
      expect(result).toHaveLength(0);
    });
  });

  describe('updateShotFeedback', () => {
    it('should update existing feedback', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback = await shotFeedbackService.createShotFeedback(feedbackData);

      const updateData = {
        overall_score: 9,
        acidity: 8,
        sweetness: 9,
        extraction_assessment: 'Excellent extraction',
      };

      // Act: Update feedback
      const result = await shotFeedbackService.updateShotFeedback(feedback.shot_id, updateData);

      // Assert: Verify feedback was updated
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(feedback.shot_id);
      expect(result.overall_score).toBe(9);
      expect(result.acidity).toBe(8);
      expect(result.sweetness).toBe(9);
      expect(result.bitterness).toBe(6); // Should remain unchanged
      expect(result.body).toBe(7); // Should remain unchanged
      expect(result.extraction_assessment).toBe('Excellent extraction');
      expect(result.notes).toBe('Good crema, pleasant aroma'); // Should remain unchanged
    });

    it('should handle partial updates correctly', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback = await shotFeedbackService.createShotFeedback(feedbackData);

      const updateData = {
        overall_score: 10,
      };

      // Act: Update feedback partially
      const result = await shotFeedbackService.updateShotFeedback(feedback.shot_id, updateData);

      // Assert: Verify only specified fields were updated
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(feedback.shot_id);
      expect(result.overall_score).toBe(10);
      expect(result.acidity).toBe(7); // Should remain unchanged
      expect(result.sweetness).toBe(8); // Should remain unchanged
      expect(result.bitterness).toBe(6); // Should remain unchanged
      expect(result.body).toBe(7); // Should remain unchanged
      expect(result.extraction_assessment).toBe('Well balanced extraction'); // Should remain unchanged
      expect(result.notes).toBe('Good crema, pleasant aroma'); // Should remain unchanged
    });

    it('should handle null values in updates', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback = await shotFeedbackService.createShotFeedback(feedbackData);

      const updateData = {
        overall_score: null,
        acidity: null,
        sweetness: null,
        bitterness: null,
        body: null,
        extraction_assessment: null,
        notes: null,
      };

      // Act: Update feedback with null values
      const result = await shotFeedbackService.updateShotFeedback(feedback.shot_id, updateData);

      // Assert: Verify null values are handled correctly
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(feedback.shot_id);
      expect(result.overall_score).toBeNull();
      expect(result.acidity).toBeNull();
      expect(result.sweetness).toBeNull();
      expect(result.bitterness).toBeNull();
      expect(result.body).toBeNull();
      expect(result.extraction_assessment).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should handle string numeric values in updates', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback = await shotFeedbackService.createShotFeedback(feedbackData);

      const updateData = {
        overall_score: '9',
        acidity: '8',
        sweetness: '9',
        bitterness: '7',
        body: '8',
      };

      // Act: Update feedback with string numeric values
      const result = await shotFeedbackService.updateShotFeedback(feedback.shot_id, updateData);

      // Assert: Verify string numeric values are converted to numbers
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(feedback.shot_id);
      expect(result.overall_score).toBe(9);
      expect(result.acidity).toBe(8);
      expect(result.sweetness).toBe(9);
      expect(result.bitterness).toBe(7);
      expect(result.body).toBe(8);
      expect(result.extraction_assessment).toBe('Well balanced extraction'); // Should remain unchanged
      expect(result.notes).toBe('Good crema, pleasant aroma'); // Should remain unchanged
    });

    it('should handle invalid numeric values in updates by setting them to null', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback = await shotFeedbackService.createShotFeedback(feedbackData);

      const updateData = {
        overall_score: 'invalid-score',
        acidity: 'invalid-acidity',
        sweetness: 'invalid-sweetness',
      };

      // Act: Update feedback with invalid numeric values
      const result = await shotFeedbackService.updateShotFeedback(feedback.shot_id, updateData);

      // Assert: Verify invalid numeric values are set to null
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(feedback.shot_id);
      expect(result.overall_score).toBeNull();
      expect(result.acidity).toBeNull();
      expect(result.sweetness).toBeNull();
      expect(result.bitterness).toBe(6); // Should remain unchanged
      expect(result.body).toBe(7); // Should remain unchanged
      expect(result.extraction_assessment).toBe('Well balanced extraction'); // Should remain unchanged
      expect(result.notes).toBe('Good crema, pleasant aroma'); // Should remain unchanged
    });

    it('should trim whitespace in updates', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback = await shotFeedbackService.createShotFeedback(feedbackData);

      const updateData = {
        extraction_assessment: '  Excellent extraction  ',
        notes: '  Perfect balance  ',
      };

      // Act: Update feedback with whitespace
      const result = await shotFeedbackService.updateShotFeedback(feedback.shot_id, updateData);

      // Assert: Verify whitespace is trimmed
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(feedback.shot_id);
      expect(result.extraction_assessment).toBe('Excellent extraction');
      expect(result.notes).toBe('Perfect balance');
    });

    it('should handle empty strings in updates by setting them to null', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback = await shotFeedbackService.createShotFeedback(feedbackData);

      const updateData = {
        extraction_assessment: '', // Empty string
        notes: '', // Empty string
      };

      // Act: Update feedback with empty strings
      const result = await shotFeedbackService.updateShotFeedback(feedback.shot_id, updateData);

      // Assert: Verify empty strings are set to null
      expect(result).toBeDefined();
      expect(result.shot_id).toBe(feedback.shot_id);
      expect(result.extraction_assessment).toBeNull();
      expect(result.notes).toBeNull();
    });

    it('should throw error when updating non-existent feedback', async () => {
      // Act & Assert: Should throw error for non-existent feedback
      const updateData = {
        overall_score: 9,
      };
      await expect(
        shotFeedbackService.updateShotFeedback('550e8400-e29b-41d4-a716-446655440003', updateData)
      ).rejects.toThrow('Shot feedback with ID 550e8400-e29b-41d4-a716-446655440003 not found');
    });
  });

  describe('deleteShotFeedback', () => {
    it('should delete existing feedback', async () => {
      // Arrange: Create test data
      const shot = shotRepository.create({
        shot_type: 'normale',
        pulled_at: new Date(),
      });
      const savedShot = await shotRepository.save(shot);

      const feedbackData = {
        shot_id: savedShot.id,
        overall_score: 8,
        acidity: 7,
        sweetness: 8,
        bitterness: 6,
        body: 7,
        extraction_assessment: 'Well balanced extraction',
        notes: 'Good crema, pleasant aroma',
      };

      const feedback = await shotFeedbackService.createShotFeedback(feedbackData);

      // Act: Delete feedback
      const result = await shotFeedbackService.deleteShotFeedback(feedback.shot_id);

      // Assert: Verify deletion was successful
      expect(result).toBe(true);
    });

    it('should throw error when deleting non-existent feedback', async () => {
      // Act & Assert: Should throw error for non-existent feedback
      await expect(
        shotFeedbackService.deleteShotFeedback('550e8400-e29b-41d4-a716-446655440004')
      ).rejects.toThrow('Shot feedback with ID 550e8400-e29b-41d4-a716-446655440004 not found');
    });
  });
});
