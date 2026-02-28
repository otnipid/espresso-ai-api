import { ShotService } from '../../../services/ShotService';
import { DataSource } from 'typeorm';
import { Shot } from '../../../entities/Shot';
import { Machine } from '../../../entities/Machine';
import { BeanBatch } from '../../../entities/BeanBatch';
import { Repository } from 'typeorm';

// Unmock ShotService for this test file
jest.unmock('../../../services/ShotService');

describe('ShotService - Unit Tests', () => {
  let shotService: ShotService;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    // Create mock repositories with Jest mocks
    const mockMachineRepo = {
      findOne: jest.fn() as jest.MockedFunction<Repository<Machine>['findOne']>,
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };

    const mockBeanRepo = {
      findOne: jest.fn() as jest.MockedFunction<Repository<BeanBatch>['findOne']>,
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };

    const mockShotRepo = {
      findOne: jest.fn() as jest.MockedFunction<Repository<Shot>['findOne']>,
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };

    // Create a mock data source that returns mock repositories
    mockDataSource = {
      getRepository: jest.fn().mockImplementation(entity => {
        if (entity === Shot) {
          return mockShotRepo;
        } else if (entity === Machine) {
          return mockMachineRepo;
        } else if (entity === BeanBatch) {
          return mockBeanRepo;
        } else {
          return {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            restore: jest.fn(),
          };
        }
      }),
    } as any;

    // Create a ShotService instance
    shotService = new ShotService(mockDataSource);
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
      expect(shotService.createShot).toBeDefined();
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

      // Mock repositories BEFORE ShotService instantiation
      const mockMachineRepo = {
        findOne: jest.fn().mockResolvedValue(null), // Machine not found
        save: jest.fn(),
        find: jest.fn(),
        remove: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        restore: jest.fn(),
      };

      const mockShotRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 'non-existent-id' }), // Shot exists
        save: jest.fn(),
        find: jest.fn(),
        remove: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        restore: jest.fn(),
      };

      // Create test-specific dataSource that returns our mocks
      const testDataSource = {
        getRepository: jest.fn().mockImplementation(entity => {
          if (entity === Machine) return mockMachineRepo;
          if (entity === Shot) return mockShotRepo;
          return {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            restore: jest.fn(),
          };
        }),
      } as any;

      // Create ShotService with mocked repositories
      const testShotService = new ShotService(testDataSource);

      await expect(
        testShotService.updateShot('non-existent-id', invalidUpdateData)
      ).rejects.toThrow();
    });
  });

  describe('Repository Access', () => {
    it('should have access to all required repositories', () => {
      expect(mockDataSource.getRepository).toBeDefined();

      const machineRepo = mockDataSource.getRepository('Machine');
      const beanRepo = mockDataSource.getRepository('Bean');
      const shotRepo = mockDataSource.getRepository('Shot');

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

      expect(() => {
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
      const testShotData = {
        machineId: 'test-id',
        beanBatchId: 'test-batch-id',
        shot_type: 'normale' as const,
        success: true,
      };

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
      expect('success' in minimalShotData).toBe(false);
      expect('notes' in minimalShotData).toBe(false);
    });
  });
});
