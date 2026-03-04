import { DataSource } from 'typeorm';
import { ShotService } from '../../../services/ShotService';
import { Shot } from '../../../entities/Shot';
import { BeanBatch } from '../../../entities/BeanBatch';
import { Machine } from '../../../entities/Machine';
import { Bean } from '../../../entities/Bean';
import {
  initializeTestDataSource,
  getTestDataSource,
  createTestMachine,
  createTestBean,
  createTestBeanBatch,
} from '../../setup.integration.main';

describe('ShotService', () => {
  let shotService: ShotService;
  let machine: Machine;
  let bean: Bean;
  let beanBatch: BeanBatch;
  let testDataSource: DataSource;

  beforeAll(async () => {
    await initializeTestDataSource();
    testDataSource = getTestDataSource();
    shotService = new ShotService(testDataSource);
  });

  beforeEach(async () => {
    // Create test data for each test using helper functions
    machine = await createTestMachine();
    bean = await createTestBean();
    beanBatch = await createTestBeanBatch(bean);
  });

  describe('createShot', () => {
    it('should create a basic shot successfully', async () => {
      const shotData = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        pulled_at: new Date(),
        success: true,
        notes: 'Test shot',
      };

      const result = await shotService.createShot(shotData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.shot_type).toBe('normale');
      expect(result.success).toBe(true);
      expect(result.notes).toBe('Test shot');
      expect(result.machine.id).toBe(machine.id);
      expect(result.beanBatch.id).toBe(beanBatch.id);
    });

    it('should create a shot with all related entities', async () => {
      const shotData = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'ristretto' as const,
        pulled_at: new Date(),
        success: true,
        notes: 'Complete test shot',
        preparation: {
          grind_setting: 15,
          dose_grams: 18.0,
          basket_type: 'double',
        },
        extraction: {
          dose_grams: 18.0,
          yield_grams: 36.0,
          extraction_time_seconds: 25,
          temperature_celsius: 93.0,
          pressure_bars: 9.0,
        },
        environment: {
          ambient_temp_c: 22.5,
          humidity_percent: 60.0,
          water_source: 'filtered',
          estimated_water_hardness_ppm: 150,
          machine_warmup_minutes: 15,
          shots_since_clean: 5,
        },
        feedback: {
          overall_score: 8.5,
          acidity: 7.0,
          sweetness: 8.0,
          bitterness: 3.0,
          body: 7.5,
          extraction_assessment: 'Balanced extraction',
          notes: 'Good balance',
        },
      };

      const result = await shotService.createShot(shotData);

      expect(result).toBeDefined();
      expect(result.preparation).toBeDefined();
      expect(result.extraction).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.feedback).toBeDefined();

      // Verify preparation data
      expect(result.preparation?.grind_setting).toBe(15);
      expect(result.preparation?.dose_grams).toBe('18.00');
      expect(result.preparation?.basket_type).toBe('double');

      // Verify extraction data
      expect(result.extraction?.dose_grams).toBe('18.00');
      expect(result.extraction?.yield_grams).toBe('36.00');
      expect(result.extraction?.extraction_time_seconds).toBe(25);

      // Verify environment data
      expect(result.environment?.ambient_temp_c).toBe('22.5');
      expect(result.environment?.humidity_percent).toBe('60.0');
      expect(result.environment?.water_source).toBe('filtered');
      expect(result.environment?.estimated_water_hardness_ppm).toBe(150);
      expect(result.environment?.machine_warmup_minutes).toBe(15);
      expect(result.environment?.shots_since_clean).toBe(5);

      // Verify feedback data
      expect(result.feedback?.overall_score).toBe('8.5');
      expect(result.feedback?.acidity).toBe('7.0');
      expect(result.feedback?.sweetness).toBe('8.0');
      expect(result.feedback?.bitterness).toBe('3.0');
      expect(result.feedback?.body).toBe('7.5');
      expect(result.feedback?.extraction_assessment).toBe('Balanced extraction');
      expect(result.feedback?.notes).toBe('Good balance');
    });

    it('should throw error when machine does not exist', async () => {
      const shotData = {
        machineId: '550e8400-e29b-41d4-a716-446655440014',
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
      };

      await expect(shotService.createShot(shotData)).rejects.toThrow(
        'Machine with ID 550e8400-e29b-41d4-a716-446655440014 not found'
      );
    });

    it('should throw error when bean batch does not exist', async () => {
      const shotData = {
        machineId: machine.id,
        beanBatchId: '550e8400-e29b-41d4-a716-446655440015',
        shot_type: 'normale' as const,
      };

      await expect(shotService.createShot(shotData)).rejects.toThrow(
        'BeanBatch with ID 550e8400-e29b-41d4-a716-446655440015 not found'
      );
    });

    it('should use current date when pulled_at is not provided', async () => {
      const shotData = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
      };

      const beforeCreate = new Date();
      const result = await shotService.createShot(shotData);
      const afterCreate = new Date();

      expect(result.pulled_at).toBeDefined();
      expect(result.pulled_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.pulled_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('getShotById', () => {
    let createdShot: Shot;

    beforeEach(async () => {
      const shotData = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        success: true,
      };
      createdShot = await shotService.createShot(shotData);
    });

    it('should return shot with all relations', async () => {
      const result = await shotService.getShotById(createdShot.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdShot.id);
      expect(result.machine).toBeDefined();
      expect(result.beanBatch).toBeDefined();
      expect(result.machine.id).toBe(machine.id);
      expect(result.beanBatch.id).toBe(beanBatch.id);
    });

    it('should throw error when shot does not exist', async () => {
      await expect(shotService.getShotById('550e8400-e29b-41d4-a716-446655440010')).rejects.toThrow(
        'Shot with ID 550e8400-e29b-41d4-a716-446655440010 not found'
      );
    });
  });

  describe('getShots', () => {
    beforeEach(async () => {
      // Create multiple test shots
      const shotData1 = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        success: true,
        pulled_at: new Date('2024-01-01T10:00:00Z'),
      };

      const shotData2 = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'ristretto' as const,
        success: false,
        pulled_at: new Date('2024-01-01T11:00:00Z'),
      };

      await shotService.createShot(shotData1);
      await shotService.createShot(shotData2);
    });

    it('should return paginated shots', async () => {
      const result = await shotService.getShots({ page: 1, limit: 10 });

      expect(result.shots).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by machine ID', async () => {
      const result = await shotService.getShots({ machineId: machine.id });

      expect(result.shots).toHaveLength(2);
      result.shots.forEach(shot => {
        expect(shot.machine.id).toBe(machine.id);
      });
    });

    it('should filter by bean batch ID', async () => {
      const result = await shotService.getShots({ beanBatchId: beanBatch.id });

      expect(result.shots).toHaveLength(2);
      result.shots.forEach(shot => {
        expect(shot.beanBatch.id).toBe(beanBatch.id);
      });
    });

    it('should filter by shot type', async () => {
      const result = await shotService.getShots({ shot_type: 'normale' });

      expect(result.shots).toHaveLength(1);
      expect(result.shots[0].shot_type).toBe('normale');
    });

    it('should filter by success status', async () => {
      const result = await shotService.getShots({ success: true });

      expect(result.shots).toHaveLength(1);
      expect(result.shots[0].success).toBe(true);
    });

    it('should filter by date range', async () => {
      const result = await shotService.getShots({
        dateFrom: new Date('2024-01-01T10:30:00Z'),
        dateTo: new Date('2024-01-01T11:30:00Z'),
      });

      expect(result.shots).toHaveLength(1);
      expect(result.shots[0].shot_type).toBe('ristretto');
    });

    it('should sort by pulled_at descending by default', async () => {
      const result = await shotService.getShots();

      expect(result.shots).toHaveLength(2);
      expect(result.shots[0].pulled_at.getTime()).toBeGreaterThan(
        result.shots[1].pulled_at.getTime()
      );
    });

    it('should sort by specified field and order', async () => {
      const result = await shotService.getShots({
        sortBy: 'shot_type',
        sortOrder: 'ASC',
      });

      expect(result.shots).toHaveLength(2);
      expect(result.shots[0].shot_type).toBe('normale');
      expect(result.shots[1].shot_type).toBe('ristretto');
    });

    it('should handle pagination correctly', async () => {
      const page1 = await shotService.getShots({ page: 1, limit: 1 });
      const page2 = await shotService.getShots({ page: 2, limit: 1 });

      expect(page1.shots).toHaveLength(1);
      expect(page2.shots).toHaveLength(1);
      expect(page1.total).toBe(2);
      expect(page2.total).toBe(2);
      expect(page1.totalPages).toBe(2);
      expect(page2.totalPages).toBe(2);
    });
  });

  describe('updateShot', () => {
    let createdShot: Shot;

    beforeEach(async () => {
      const shotData = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        success: true,
        notes: 'Original notes',
      };
      createdShot = await shotService.createShot(shotData);
    });

    it('should update basic shot fields', async () => {
      const updateData = {
        shot_type: 'ristretto' as const,
        success: false,
        notes: 'Updated notes',
      };

      const result = await shotService.updateShot(createdShot.id, updateData);

      expect(result.shot_type).toBe('ristretto');
      expect(result.success).toBe(false);
      expect(result.notes).toBe('Updated notes');
    });

    it('should update related entities', async () => {
      const updateData = {
        preparation: {
          grind_setting: 20,
          dose_grams: 20.0,
        },
        extraction: {
          yield_grams: 40.0,
          extraction_time_seconds: 30,
        },
      };

      const result = await shotService.updateShot(createdShot.id, updateData);

      expect(result.preparation).toBeDefined();
      expect(result.preparation?.grind_setting).toBe(20);
      expect(result.preparation?.dose_grams).toBe('20.00');
      expect(result.extraction?.yield_grams).toBe('40.00');
      expect(result.extraction?.extraction_time_seconds).toBe(30);
    });

    it('should create new related entities if they do not exist', async () => {
      const updateData = {
        environment: {
          ambient_temp_c: 25.0,
          humidity_percent: 55.0,
        },
        feedback: {
          overall_score: 9.0,
          acidity: 8.0,
        },
      };

      const result = await shotService.updateShot(createdShot.id, updateData);

      expect(result.environment).toBeDefined();
      expect(result.environment?.ambient_temp_c).toBe('25.0');
      expect(result.feedback).toBeDefined();
      expect(result.feedback?.overall_score).toBe('9.0');
    });

    it('should throw error when updating non-existent shot', async () => {
      const updateData = { success: false };

      await expect(
        shotService.updateShot('550e8400-e29b-41d4-a716-446655440011', updateData)
      ).rejects.toThrow('Shot with ID 550e8400-e29b-41d4-a716-446655440011 not found');
    });
  });

  describe('softDeleteShot', () => {
    let createdShot: Shot;

    beforeEach(async () => {
      const shotData = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
      };
      createdShot = await shotService.createShot(shotData);
    });

    it('should soft delete a shot', async () => {
      const result = await shotService.softDeleteShot(createdShot.id);

      expect(result).toBe(true);

      // Shot should not be found in regular queries
      await expect(shotService.getShotById(createdShot.id)).rejects.toThrow();
    });

    it('should return false when deleting non-existent shot', async () => {
      const result = await shotService.softDeleteShot('550e8400-e29b-41d4-a716-446655440012');

      expect(result).toBe(false);
    });
  });

  describe('hardDeleteShot', () => {
    let createdShot: Shot;

    beforeEach(async () => {
      const shotData = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
        preparation: {
          grind_setting: 15,
        },
        extraction: {
          dose_grams: 18.0,
        },
        environment: {
          ambient_temp_c: 22.0,
        },
        feedback: {
          overall_score: 8.0,
        },
      };
      createdShot = await shotService.createShot(shotData);
    });

    it('should permanently delete shot and all related entities', async () => {
      const result = await shotService.hardDeleteShot(createdShot.id);

      expect(result).toBe(true);

      // Verify shot is deleted
      await expect(shotService.getShotById(createdShot.id)).rejects.toThrow();
    });

    it('should return false when deleting non-existent shot', async () => {
      const result = await shotService.hardDeleteShot('550e8400-e29b-41d4-a716-446655440013');

      expect(result).toBe(false);
    });
  });

  describe('restoreShot', () => {
    let createdShot: Shot;

    beforeEach(async () => {
      const shotData = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
      };
      createdShot = await shotService.createShot(shotData);
    });

    it('should restore a soft-deleted shot', async () => {
      // Soft delete first
      await shotService.softDeleteShot(createdShot.id);

      // Restore the shot
      const result = await shotService.restoreShot(createdShot.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdShot.id);

      // Verify shot can be found again
      const foundShot = await shotService.getShotById(createdShot.id);
      expect(foundShot.id).toBe(createdShot.id);
    });

    it('should throw error when restoring non-existent shot', async () => {
      await expect(shotService.restoreShot('550e8400-e29b-41d4-a716-446655440099')).rejects.toThrow(
        'Shot with ID 550e8400-e29b-41d4-a716-446655440099 not found or not deleted'
      );
    });
  });

  describe('getShotStatistics', () => {
    beforeEach(async () => {
      // Create test shots with different success rates
      await shotService.createShot({
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale',
        success: true,
      });

      await shotService.createShot({
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'ristretto',
        success: true,
      });

      await shotService.createShot({
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'lungo',
        success: false,
      });
    });

    it('should return correct statistics', async () => {
      const result = await shotService.getShotStatistics();

      expect(result.total).toBe(3);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.successRate).toBeCloseTo(66.67, 1);
    });

    it('should filter statistics by machine', async () => {
      const result = await shotService.getShotStatistics({ machineId: machine.id });

      expect(result.total).toBe(3);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should handle empty results', async () => {
      // Use synchronize to drop and recreate all tables to ensure clean state
      await testDataSource.synchronize(true);

      const result = await shotService.getShotStatistics();

      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.successRate).toBe(0);
    });
  });

  describe('Transaction Management', () => {
    it('should rollback on creation failure', async () => {
      // Mock a failure by using invalid machine ID
      const shotData = {
        machineId: 'invalid-machine-id',
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
      };

      await expect(shotService.createShot(shotData)).rejects.toThrow();

      // Verify no partial data was created
      const shotRepository = testDataSource.getRepository(Shot);
      const shots = await shotRepository.find();
      expect(shots).toHaveLength(0);
    });

    it('should rollback on update failure', async () => {
      const shotData = {
        machineId: machine.id,
        beanBatchId: beanBatch.id,
        shot_type: 'normale' as const,
      };
      const createdShot = await shotService.createShot(shotData);

      // Try to update with invalid machine ID
      const updateData = {
        machineId: 'invalid-machine-id',
      };

      await expect(shotService.updateShot(createdShot.id, updateData)).rejects.toThrow();

      // Verify original data is intact
      const originalShot = await shotService.getShotById(createdShot.id);
      expect(originalShot.machine.id).toBe(machine.id);
    });
  });
});
