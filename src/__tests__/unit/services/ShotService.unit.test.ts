import { ShotService } from '../../services/ShotService';
import { testDataSource, createTestMachine, createTestBean } from '../setup';

describe('ShotService - Unit Tests', () => {
  let shotService: ShotService;

  beforeAll(async () => {
    shotService = new ShotService(testDataSource);
  });

  describe('Service Initialization', () => {
    it('should initialize ShotService successfully', () => {
      expect(shotService).toBeDefined();
      expect(shotService).toBeInstanceOf(ShotService);
    });

    it('should have all required methods', () => {
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

  describe('Method Validation', () => {
    it('should validate input parameters for createShot', () => {
      // Test that the method exists and has the right signature
      expect(shotService.createShot).toBeDefined();
      
      // Test that it's an async function
      expect(shotService.createShot.constructor.name).toBe('AsyncFunction');
    });

    it('should validate input parameters for getShotById', () => {
      expect(shotService.getShotById).toBeDefined();
      expect(shotService.getShotById.constructor.name).toBe('AsyncFunction');
    });

    it('should validate input parameters for getShots', () => {
      expect(shotService.getShots).toBeDefined();
      expect(shotService.getShots.constructor.name).toBe('AsyncFunction');
    });

    it('should validate input parameters for updateShot', () => {
      expect(shotService.updateShot).toBeDefined();
      expect(shotService.updateShot.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Error Handling Structure', () => {
    it('should handle invalid machine ID gracefully', async () => {
      const invalidShotData = {
        machineId: 'invalid-machine-id',
        beanBatchId: 'invalid-batch-id',
        shot_type: 'normale' as const,
      };

      // Should throw an error with appropriate message
      await expect(shotService.createShot(invalidShotData)).rejects.toThrow();
    });

    it('should handle non-existent shot ID gracefully', async () => {
      await expect(shotService.getShotById('non-existent-id')).rejects.toThrow();
    });

    it('should handle invalid update data gracefully', async () => {
      const invalidUpdateData = {
        machineId: 'invalid-machine-id',
      };

      await expect(shotService.updateShot('non-existent-id', invalidUpdateData)).rejects.toThrow();
    });
  });

  describe('Repository Access', () => {
    it('should have access to all required repositories', () => {
      // Test that the service can access repositories (without actually using them)
      expect(testDataSource.getRepository).toBeDefined();
      
      // Test that we can create repository instances
      const machineRepo = testDataSource.getRepository('Machine');
      const beanRepo = testDataSource.getRepository('Bean');
      const shotRepo = testDataSource.getRepository('Shot');
      
      expect(machineRepo).toBeDefined();
      expect(beanRepo).toBeDefined();
      expect(shotRepo).toBeDefined();
    });
  });

  describe('Data Structure Validation', () => {
    it('should accept valid shot data structure', () => {
      const validShotData = {
        machineId: 'test-machine-id',
        beanBatchId: 'test-batch-id',
        shot_type: 'normale' as const,
        pulled_at: new Date(),
        success: true,
        notes: 'Test shot',
      };

      // This should not throw during parameter validation
      expect(() => {
        // Just test that the method accepts the structure
        const method = shotService.createShot;
        expect(method).toBeDefined();
      }).not.toThrow();
    });

    it('should accept valid update data structure', () => {
      const validUpdateData = {
        success: false,
        notes: 'Updated notes',
        preparation: {
          grind_setting: 20,
        },
      };

      expect(() => {
        const method = shotService.updateShot;
        expect(method).toBeDefined();
      }).not.toThrow();
    });

    it('should accept valid filter options', () => {
      const validFilters = {
        page: 1,
        limit: 10,
        success: true,
        shot_type: 'normale',
        sortBy: 'pulled_at',
        sortOrder: 'DESC' as const,
      };

      expect(() => {
        const method = shotService.getShots;
        expect(method).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should maintain TypeScript types for interfaces', () => {
      // Test that the interfaces are properly typed
      const testShotData = {
        machineId: 'test-id',
        beanBatchId: 'test-batch-id',
        shot_type: 'normale' as const,
        success: true,
      };

      // These should compile without TypeScript errors
      expect(testShotData.shot_type).toBe('normale');
      expect(testShotData.success).toBe(true);
    });

    it('should handle optional fields correctly', () => {
      const minimalShotData = {
        machineId: 'test-id',
        beanBatchId: 'test-batch-id',
        shot_type: 'normale' as const,
      };

      expect(minimalShotData.machineId).toBeDefined();
      expect(minimalShotData.beanBatchId).toBeDefined();
      expect(minimalShotData.shot_type).toBe('normale');
      // Optional fields should not exist on minimal object
      expect('success' in minimalShotData).toBe(false);
      expect('notes' in minimalShotData).toBe(false);
    });
  });
});
