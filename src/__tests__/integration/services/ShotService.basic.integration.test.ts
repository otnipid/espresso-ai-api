import { DataSource } from 'typeorm';
import { ShotService } from '../../../services/ShotService';
import {
  initializeTestDataSource,
  getTestDataSource,
  createTestMachine,
  createTestBean,
  createTestBeanBatch,
} from '../../setup.integration.basic';

describe('ShotService - Basic Tests', () => {
  let shotService: ShotService;
  let testDataSource: DataSource;

  beforeAll(async () => {
    await initializeTestDataSource();
    testDataSource = getTestDataSource();
    shotService = new ShotService(testDataSource);
  });

  describe('Service Initialization', () => {
    it('should initialize ShotService successfully', () => {
      expect(shotService).toBeDefined();
      expect(shotService).toBeInstanceOf(ShotService);
    });

    it('should have all required repositories initialized', () => {
      // Test that the service has the expected methods
      expect(typeof shotService.createShot).toBe('function');
      expect(typeof shotService.getShotById).toBe('function');
      expect(typeof shotService.getShots).toBe('function');
      expect(typeof shotService.updateShot).toBe('function');
      expect(typeof shotService.softDeleteShot).toBe('function');
      expect(typeof shotService.hardDeleteShot).toBe('function');
      expect(typeof shotService.restoreShot).toBe('function');
      expect(typeof shotService.getShotStatistics).toBe('function');
    });
  });

  describe('Basic CRUD Operations', () => {
    it('should create and retrieve a basic shot', async () => {
      // Create test data
      const machine = await createTestMachine();
      const bean = await createTestBean();
      const beanBatch = await createTestBeanBatch(bean);

      // Create shot data
      const shotData = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        pulled_at: new Date(),
        success: true,
        notes: 'Test shot',
      };

      // Create the shot
      const createdShot = await shotService.createShot(shotData);

      // Verify the shot was created
      expect(createdShot).toBeDefined();
      expect(createdShot.id).toBeDefined();
      expect(createdShot.shot_type).toBe('normale');
      expect(createdShot.success).toBe(true);
      expect(createdShot.notes).toBe('Test shot');

      // Retrieve the shot
      const retrievedShot = await shotService.getShotById(createdShot.id);

      // Verify the retrieved shot matches
      expect(retrievedShot.id).toBe(createdShot.id);
      expect(retrievedShot.shot_type).toBe('normale');
      expect(retrievedShot.success).toBe(true);
      expect(retrievedShot.notes).toBe('Test shot');
    });

    it('should handle pagination correctly', async () => {
      // Create test data
      const machine = await createTestMachine();
      const bean = await createTestBean();
      const beanBatch = await createTestBeanBatch(bean);

      // Create multiple shots
      for (let i = 0; i < 5; i++) {
        await shotService.createShot({
          machineId: machine.id,
          beanBatchId: beanBatch.id,
          shot_type: 'normale' as const,
          success: i % 2 === 0, // Alternate success
        });
      }

      // Test pagination
      const page1 = await shotService.getShots({ page: 1, limit: 2 });
      const page2 = await shotService.getShots({ page: 2, limit: 2 });
      const page3 = await shotService.getShots({ page: 3, limit: 2 });

      // Verify pagination results
      expect(page1.shots).toHaveLength(2);
      expect(page2.shots).toHaveLength(2);
      expect(page3.shots).toHaveLength(1);
      expect(page1.total).toBe(5);
      expect(page2.total).toBe(5);
      expect(page3.total).toBe(5);
      expect(page1.totalPages).toBe(3);
      expect(page2.totalPages).toBe(3);
      expect(page3.totalPages).toBe(3);
    });

    it('should filter shots by success status', async () => {
      // Create test data
      const machine = await createTestMachine();
      const bean = await createTestBean();
      const beanBatch = await createTestBeanBatch(bean);

      // Create shots with different success statuses
      await shotService.createShot({
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        success: true,
      });

      await shotService.createShot({
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        success: false,
      });

      // Test filtering
      const successfulShots = await shotService.getShots({ success: true });
      const failedShots = await shotService.getShots({ success: false });

      // Verify filtering results
      expect(successfulShots.shots).toHaveLength(1);
      expect(successfulShots.shots[0].success).toBe(true);
      expect(failedShots.shots).toHaveLength(1);
      expect(failedShots.shots[0].success).toBe(false);
    });

    it('should update a shot successfully', async () => {
      // Create test data
      const machine = await createTestMachine();
      const bean = await createTestBean();
      const beanBatch = await createTestBeanBatch(bean);

      // Create a shot
      const createdShot = await shotService.createShot({
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        success: true,
        notes: 'Original notes',
      });

      // Update the shot
      const updatedShot = await shotService.updateShot(createdShot.id, {
        success: false,
        notes: 'Updated notes',
      });

      // Verify the update
      expect(updatedShot.id).toBe(createdShot.id);
      expect(updatedShot.success).toBe(false);
      expect(updatedShot.notes).toBe('Updated notes');
    });

    it('should handle soft delete and restore', async () => {
      // Create test data
      const machine = await createTestMachine();
      const bean = await createTestBean();
      const beanBatch = await createTestBeanBatch(bean);

      // Create a shot
      const createdShot = await shotService.createShot({
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        success: true,
      });

      // Soft delete the shot
      const deleteResult = await shotService.softDeleteShot(createdShot.id);
      expect(deleteResult).toBe(true);

      // Verify shot is not found in regular queries
      await expect(shotService.getShotById(createdShot.id)).rejects.toThrow();

      // Restore the shot
      const restoredShot = await shotService.restoreShot(createdShot.id);
      expect(restoredShot.id).toBe(createdShot.id);

      // Verify shot can be found again
      const foundShot = await shotService.getShotById(createdShot.id);
      expect(foundShot.id).toBe(createdShot.id);
    });

    it('should calculate statistics correctly', async () => {
      // Create test data
      const machine = await createTestMachine();
      const bean = await createTestBean();
      const beanBatch = await createTestBeanBatch(bean);

      // Create shots with known success rates
      await shotService.createShot({
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        success: true,
      });

      await shotService.createShot({
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        success: true,
      });

      await shotService.createShot({
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        success: false,
      });

      // Get statistics
      const stats = await shotService.getShotStatistics();

      // Verify statistics
      expect(stats.total).toBe(3);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when creating shot with invalid machine', async () => {
      const bean = await createTestBean();
      const beanBatch = await createTestBeanBatch(bean);

      const shotData = {
        machineId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format but doesn't exist
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
      };

      await expect(shotService.createShot(shotData)).rejects.toThrow(
        'Machine with ID 550e8400-e29b-41d4-a716-446655440000 not found'
      );
    });

    it('should throw error when creating shot with invalid bean batch', async () => {
      const machine = await createTestMachine();

      const shotData = {
        machineId: machine.id,
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID format but doesn't exist
        shot_type: 'normale' as const,
      };

      await expect(shotService.createShot(shotData)).rejects.toThrow(
        'BeanBatch with ID 550e8400-e29b-41d4-a716-446655440001 not found'
      );
    });

    it('should throw error when getting non-existent shot', async () => {
      await expect(shotService.getShotById('550e8400-e29b-41d4-a716-446655440002')).rejects.toThrow(
        'Shot with ID 550e8400-e29b-41d4-a716-446655440002 not found'
      );
    });

    it('should throw error when updating non-existent shot', async () => {
      await expect(
        shotService.updateShot('550e8400-e29b-41d4-a716-446655440003', {})
      ).rejects.toThrow('Shot with ID 550e8400-e29b-41d4-a716-446655440003 not found');
    });

    it('should return false when soft deleting non-existent shot', async () => {
      const result = await shotService.softDeleteShot('550e8400-e29b-41d4-a716-446655440004');
      expect(result).toBe(false);
    });

    it('should return false when hard deleting non-existent shot', async () => {
      const result = await shotService.hardDeleteShot('550e8400-e29b-41d4-a716-446655440005');
      expect(result).toBe(false);
    });

    it('should throw error when restoring non-existent shot', async () => {
      await expect(shotService.restoreShot('550e8400-e29b-41d4-a716-446655440006')).rejects.toThrow(
        'Shot with ID 550e8400-e29b-41d4-a716-446655440006 not found'
      );
    });
  });
});
