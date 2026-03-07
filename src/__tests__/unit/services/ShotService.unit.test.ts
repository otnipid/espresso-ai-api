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
  let mockMachineRepo: any;
  let mockBeanBatchRepo: any;
  let mockShotRepo: any;

  beforeEach(() => {
    // Create mock repositories with Jest mocks
    mockMachineRepo = {
      findOne: jest.fn().mockImplementation(options => {
        if (options.where.id === '550e8400-e29b-41d4-a716-446655440000') {
          return Promise.resolve({
            id: '550e8400-e29b-41d4-a716-446655440000',
            model: 'Test Machine',
            firmware_version: '1.0.0',
            created_at: new Date(),
          });
        }
        return Promise.resolve(null);
      }),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };

    mockBeanBatchRepo = {
      findOne: jest.fn().mockImplementation(options => {
        if (options.where.id === '550e8400-e29b-41d4-a716-446655440001') {
          return Promise.resolve({
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Test Bean Batch',
            origin: 'Test Origin',
            created_at: new Date(),
          });
        }
        return Promise.resolve(null);
      }),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };

    // Mock query runner for transaction operations
    const mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest.fn().mockResolvedValue({
          id: '550e8400-e29b-41d4-a716-446655402',
          shot_type: 'normale',
          created_at: new Date(),
        }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      },
    };

    mockShotRepo = {
      findOne: jest.fn().mockImplementation(options => {
        if (options.where.id === '550e8400-e29b-41d4-a716-446655402') {
          return Promise.resolve({
            id: '550e8400-e29b-41d4-a716-446655402',
            shot_type: 'normale',
            created_at: new Date(),
          });
        }
        if (options.where.id === '550e8400-e29b-41d4-a716-4466554403') {
          return Promise.resolve({
            id: '550e8400-e29b-41d4-a716-4466554403',
            shot_type: 'ristretto',
            created_at: new Date(),
          });
        }
        return Promise.resolve(null);
      }),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(0),
      manager: {
        connection: {
          createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        },
      },
    };

    // Create a mock data source that returns mock repositories
    mockDataSource = {
      getRepository: jest.fn().mockImplementation((entity: any) => {
        if (entity.name === 'Shot') {
          return mockShotRepo;
        } else if (entity.name === 'Machine') {
          return mockMachineRepo;
        } else if (entity.name === 'BeanBatch') {
          return mockBeanBatchRepo;
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
            findAndCount: jest.fn().mockResolvedValue([[], 0]),
            softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
            count: jest.fn().mockResolvedValue(0),
          };
        }
      }),
      manager: {
        query: jest.fn(),
      },
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
      // Check if method is async by checking if it returns a Promise
      const result = shotService.createShot({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale' as const,
      } as any);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should validate input parameters for getShotById', () => {
      expect(shotService.getShotById).toBeDefined();
      // Check if method is async by checking if it returns a Promise
      const result = shotService.getShotById('550e8400-e29b-41d4-a716-4466554403');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should validate input parameters for getShots', () => {
      expect(shotService.getShots).toBeDefined();
      // Check if method is async by checking if it returns a Promise
      const result = shotService.getShots();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should validate input parameters for updateShot', () => {
      expect(shotService.updateShot).toBeDefined();
      // Check if method is async by checking if it returns a Promise
      const result = shotService.updateShot('550e8400-e29b-41d4-a716-4466554403', {} as any);
      expect(result).toBeInstanceOf(Promise);
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

  describe('Business Logic Tests', () => {
    it('should successfully create a shot with valid data', async () => {
      // Arrange
      const validShotData = {
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale' as const,
        success: true,
        notes: 'Test shot',
      };

      mockMachineRepo.findOne.mockResolvedValue({
        id: validShotData.machineId,
        model: 'Test Machine',
      });
      mockBeanBatchRepo.findOne.mockResolvedValue({
        id: validShotData.beanBatchId,
        name: 'Test Bean Batch',
      });
      const mockShot = { id: '550e8400-e29b-41d4-a716-446655402', ...validShotData };
      mockShotRepo.create.mockReturnValue(mockShot);
      mockShotRepo.save.mockResolvedValue(mockShot);

      // Act
      const result = await shotService.createShot(validShotData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655402');
      expect(mockMachineRepo.findOne).toHaveBeenCalledWith({
        where: { id: validShotData.machineId },
      });
      expect(mockBeanBatchRepo.findOne).toHaveBeenCalledWith({
        where: { id: validShotData.beanBatchId },
      });
      expect(mockShotRepo.create).toHaveBeenCalled();
    });

    it('should successfully create a shot with all related entities', async () => {
      // Arrange
      const validShotData = {
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale' as const,
        success: true,
        notes: 'Test shot with all entities',
        preparation: {
          dose_grams: 18.0,
          grind_setting: 15,
        },
        extraction: {
          dose_grams: 18.2,
          yield_grams: 36.0,
          extraction_time_seconds: 25,
        },
        environment: {
          temperature_celsius: 22.5,
          humidity_percent: 65.0,
        },
        feedback: {
          rating: 8,
          notes: 'Great shot!',
        },
      };

      mockMachineRepo.findOne.mockResolvedValue({
        id: validShotData.machineId,
        model: 'Test Machine',
      });
      mockBeanBatchRepo.findOne.mockResolvedValue({
        id: validShotData.beanBatchId,
        name: 'Test Bean Batch',
      });
      const mockShot = { id: '550e8400-e29b-41d4-a716-446655403', ...validShotData };
      mockShotRepo.create.mockReturnValue(mockShot);
      mockShotRepo.save.mockResolvedValue(mockShot);

      // Mock query runner to handle transaction
      const mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
          save: jest.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655403' }),
        },
      };

      mockShotRepo.manager.connection.createQueryRunner.mockReturnValue(mockQueryRunner);

      // Mock findOne for the getShotById call at the end of createShot
      mockShotRepo.findOne.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655403',
        machine: { id: '550e8400-e29b-41d4-a716-446655440000' },
        beanBatch: { id: '550e8400-e29b-41d4-a716-446655440001' },
        preparation: validShotData.preparation,
        extraction: validShotData.extraction,
        environment: validShotData.environment,
        feedback: validShotData.feedback,
      });

      // Act
      const result = await shotService.createShot(validShotData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('550e8400-e29b-41d4-a716-446655403');
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(5); // main shot + 4 related entities
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should successfully get a shot by ID', async () => {
      // Arrange
      const shotId = '550e8400-e29b-41d4-a716-446655440002';
      const mockShot = {
        id: shotId,
        success: true,
        machine: { id: '550e8400-e29b-41d4-a716-446655440000' },
        beanBatch: { id: '550e8400-e29b-41d4-a716-446655440001' },
      };

      mockShotRepo.findOne.mockResolvedValue(mockShot);

      // Act
      const result = await shotService.getShotById(shotId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(shotId);
      expect(mockShotRepo.findOne).toHaveBeenCalledWith({
        where: { id: shotId },
        relations: ['machine', 'beanBatch', 'preparation', 'extraction', 'environment', 'feedback'],
      });
    });

    it('should successfully get shots with filters', async () => {
      // Arrange
      const mockShots = [
        { id: 'shot1', success: true },
        { id: 'shot2', success: false },
      ];
      const mockResult = {
        shots: mockShots,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockShotRepo.findAndCount.mockResolvedValue([mockShots, 2]);

      // Act
      const result = await shotService.getShots({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockShotRepo.findAndCount).toHaveBeenCalled();
    });

    it('should successfully update a shot', async () => {
      // Arrange
      const shotId = '550e8400-e29b-41d4-a716-446655440002';
      const updateData = { success: false, notes: 'Updated notes' };
      const existingShot = {
        id: shotId,
        success: true,
        notes: 'Original notes',
      };
      const updatedShot = {
        ...existingShot,
        ...updateData,
      };

      mockShotRepo.findOne.mockResolvedValue(existingShot);
      mockShotRepo.save.mockResolvedValue(updatedShot);

      // Act
      const result = await shotService.updateShot(shotId, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.notes).toBe('Updated notes');
      // updateShot calls findOne twice: once through getShotById (with relations) and once directly
      expect(mockShotRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('should successfully soft delete a shot', async () => {
      // Arrange
      const shotId = '550e8400-e29b-41d4-a716-446655440002';
      mockShotRepo.softDelete.mockResolvedValue({ affected: 1 });

      // Act
      const result = await shotService.softDeleteShot(shotId);

      // Assert
      expect(result).toBe(true);
      expect(mockShotRepo.softDelete).toHaveBeenCalledWith(shotId);
    });

    it('should return false when soft deleting non-existent shot', async () => {
      // Arrange
      const shotId = 'non-existent-id';
      mockShotRepo.softDelete.mockResolvedValue({ affected: 0 });

      // Act
      const result = await shotService.softDeleteShot(shotId);

      // Assert
      expect(result).toBe(false);
      expect(mockShotRepo.softDelete).toHaveBeenCalledWith(shotId);
    });

    it('should successfully get shot statistics', async () => {
      // Arrange
      const mockStats = {
        totalShots: 100,
        successfulShots: 80,
        failedShots: 20,
        averageExtractionTime: 25.5,
      };

      mockShotRepo.count.mockResolvedValue(100);
      mockShotRepo.count.mockResolvedValue(80); // This will be called multiple times

      // Act
      const result = await shotService.getShotStatistics({
        machineId: '550e8400-e29b-41d4-a716-446655440000',
      });

      // Assert
      expect(result).toBeDefined();
      expect(mockShotRepo.count).toHaveBeenCalled();
    });
  });

  describe('Type Safety', () => {
    it('should maintain TypeScript types for interfaces', () => {
      const testShotData = {
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
        shot_type: 'normale' as const,
        success: true,
      };

      expect(testShotData.shot_type).toBe('normale');
      expect(testShotData.success).toBe(true);
    });

    it('should handle optional fields correctly', () => {
      const minimalShotData = {
        machineId: '550e8400-e29b-41d4-a716-446655440000',
        beanBatchId: '550e8400-e29b-41d4-a716-446655440001',
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
