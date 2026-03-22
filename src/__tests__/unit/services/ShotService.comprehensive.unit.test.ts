import { ShotService, CreateShotData, UpdateShotData } from '../../../services/ShotService';
import { DataSource } from 'typeorm';

// Unmock ShotService for this test file
jest.unmock('../../../services/ShotService');

describe('ShotService - Comprehensive Unit Tests', () => {
  let shotService: ShotService;
  let mockDataSource: any;
  let mockShotRepo: any;
  let mockMachineRepo: any;
  let mockBeanBatchRepo: any;
  let mockUserRepo: any;
  let mockGrinderRepo: any;
  let mockQueryRunner: any;

  beforeEach(() => {
    // Create mock query runner
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest.fn(),
        remove: jest.fn(),
        softDelete: jest.fn(),
        restore: jest.fn(),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn(),
      },
    };

    // Create mock repositories
    mockShotRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      manager: {
        connection: {
          createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        },
        delete: jest.fn(),
      },
    };

    mockMachineRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
    };

    mockBeanBatchRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
    };

    mockGrinderRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
    };

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockImplementation((entity: any) => {
        if (entity.name === 'Shot') return mockShotRepo;
        if (entity.name === 'Machine') return mockMachineRepo;
        if (entity.name === 'BeanBatch') return mockBeanBatchRepo;
        if (entity.name === 'User') return mockUserRepo;
        if (entity.name === 'Grinder') return mockGrinderRepo;
        return mockShotRepo;
      }),
    };

    shotService = new ShotService(mockDataSource);
  });

  describe('createShot', () => {
    it('should create a shot successfully', async () => {
      const shotData: CreateShotData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        machineId: 'machine-1',
        beanBatchId: 'batch-1',
        grinderId: 'grinder-1',
        shot_type: 'normale',
        success: true,
      };

      const mockMachine = { id: 'machine-1', model: 'Test Machine' };
      const mockBatch = { id: 'batch-1', name: 'Test Batch' };
      const mockUser = { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test User' };
      const mockGrinder = { id: 'grinder-1', model: 'Test Grinder' };
      const mockShot = { id: 'shot-1', machine: mockMachine, beanBatch: mockBatch, user: mockUser, grinder: mockGrinder };

      mockMachineRepo.findOne.mockResolvedValue(mockMachine);
      mockBeanBatchRepo.findOne.mockResolvedValue(mockBatch);
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockGrinderRepo.findOne.mockResolvedValue(mockGrinder);
      mockQueryRunner.manager.save.mockResolvedValue(mockShot);
      mockQueryRunner.manager.findOne.mockResolvedValue(mockShot);
      mockShotRepo.findOne.mockResolvedValue(mockShot);

      const result = await shotService.createShot(shotData);

      expect(mockMachineRepo.findOne).toHaveBeenCalledWith({ where: { id: 'machine-1' } });
      expect(mockBeanBatchRepo.findOne).toHaveBeenCalledWith({ where: { id: 'batch-1' } });
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error when machine not found', async () => {
      const shotData: CreateShotData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        machineId: 'invalid-machine',
        beanBatchId: 'batch-1',
        grinderId: 'grinder-1',
        shot_type: 'normale',
      };

      mockMachineRepo.findOne.mockResolvedValue(null);

      await expect(shotService.createShot(shotData)).rejects.toThrow();
    });

    it('should throw error when bean batch not found', async () => {
      const shotData: CreateShotData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        machineId: 'machine-1',
        beanBatchId: 'invalid-batch',
        grinderId: 'grinder-1',
        shot_type: 'normale',
      };

      mockMachineRepo.findOne.mockResolvedValue({ id: 'machine-1' });
      mockBeanBatchRepo.findOne.mockResolvedValue(null);

      await expect(shotService.createShot(shotData)).rejects.toThrow();
    });

    it('should handle transaction rollback on error', async () => {
      const shotData: CreateShotData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        machineId: 'machine-1',
        beanBatchId: 'batch-1',
        grinderId: 'grinder-1',
        shot_type: 'normale',
      };

      mockMachineRepo.findOne.mockResolvedValue({ id: 'machine-1' });
      mockBeanBatchRepo.findOne.mockResolvedValue({ id: 'batch-1' });
      mockUserRepo.findOne.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test User' });
      mockGrinderRepo.findOne.mockResolvedValue({ id: 'grinder-1', model: 'Test Grinder' });
      mockQueryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(shotService.createShot(shotData)).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('getShotById', () => {
    it('should return shot with all relations', async () => {
      const mockShot = {
        id: 'shot-1',
        machine: { id: 'machine-1' },
        beanBatch: { id: 'batch-1' },
      };

      mockShotRepo.findOne.mockResolvedValue(mockShot);

      const result = await shotService.getShotById('shot-1');

      expect(mockShotRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'shot-1' },
        relations: ['user', 'machine', 'beanBatch', 'grinder', 'preparation', 'extraction', 'environment', 'feedback'],
      });
      expect(result).toEqual(mockShot);
    });

    it('should throw error when shot not found', async () => {
      mockShotRepo.findOne.mockResolvedValue(null);

      await expect(shotService.getShotById('invalid-shot')).rejects.toThrow();
    });
  });

  describe('getShots', () => {
    it('should return paginated shots with filters', async () => {
      const mockShots = [
        { id: 'shot-1', machine: { id: 'machine-1' } },
        { id: 'shot-2', machine: { id: 'machine-2' } },
      ];

      mockShotRepo.findAndCount.mockResolvedValue([mockShots, 2]);

      const result = await shotService.getShots({
        machineId: 'machine-1',
        shot_type: 'normale',
        success: true,
        page: 1,
        limit: 10,
      });

      expect(mockShotRepo.findAndCount).toHaveBeenCalledWith({
        where: {
          machine: { id: 'machine-1' },
          shot_type: 'normale',
          success: true,
        },
        relations: ['user', 'machine', 'beanBatch', 'grinder', 'preparation', 'extraction', 'environment', 'feedback'],
        order: { pulled_at: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.shots).toEqual(mockShots);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return all shots when no filters provided', async () => {
      const mockShots = [{ id: 'shot-1' }];

      mockShotRepo.findAndCount.mockResolvedValue([mockShots, 1]);

      const result = await shotService.getShots();

      expect(mockShotRepo.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: ['user', 'machine', 'beanBatch', 'grinder', 'preparation', 'extraction', 'environment', 'feedback'],
        order: { pulled_at: 'DESC' },
        skip: 0,
        take: 20,
      });
      expect(result.shots).toEqual(mockShots);
    });
  });

  describe('updateShot', () => {
    it('should update shot successfully', async () => {
      const updateData: UpdateShotData = {
        success: false,
      };

      const existingShot = {
        id: 'shot-1',
        machine: { id: 'machine-1' },
        beanBatch: { id: 'batch-1' },
        success: true,
        notes: 'Original shot',
      };

      const updatedShot = { ...existingShot, ...updateData };

      mockShotRepo.findOne.mockResolvedValueOnce(existingShot).mockResolvedValueOnce(updatedShot);
      mockQueryRunner.manager.save.mockResolvedValue(updatedShot);

      const result = await shotService.updateShot('shot-1', updateData);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(updatedShot);
    });

    it('should throw error when shot not found for update', async () => {
      mockShotRepo.findOne.mockResolvedValue(null);

      await expect(shotService.updateShot('invalid-shot', {})).rejects.toThrow();
    });

    it('should validate machine ID when updating machine', async () => {
      const updateData: UpdateShotData = {
        machineId: 'invalid-machine',
      };

      const existingShot = { id: 'shot-1', machine: { id: 'machine-1' } };

      mockShotRepo.findOne.mockResolvedValueOnce(existingShot);
      mockMachineRepo.findOne.mockResolvedValue(null);

      await expect(shotService.updateShot('shot-1', updateData)).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('softDeleteShot', () => {
    it('should soft delete shot successfully', async () => {
      mockShotRepo.softDelete.mockResolvedValue({ affected: 1 });

      const result = await shotService.softDeleteShot('shot-1');

      expect(mockShotRepo.softDelete).toHaveBeenCalledWith('shot-1');
      expect(result).toBe(true);
    });

    it('should return false when shot not found for soft delete', async () => {
      mockShotRepo.softDelete.mockResolvedValue({ affected: 0 });

      const result = await shotService.softDeleteShot('invalid-shot');

      expect(result).toBe(false);
    });
  });

  describe('hardDeleteShot', () => {
    it('should hard delete shot successfully', async () => {
      const mockShot = {
        id: 'shot-1',
        preparation: { id: 'prep-1' },
        extraction: { id: 'extr-1' },
      };

      mockShotRepo.findOne.mockResolvedValue(mockShot);
      mockQueryRunner.manager.remove.mockResolvedValue(mockShot);

      const result = await shotService.hardDeleteShot('shot-1');

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when shot not found for hard delete', async () => {
      mockShotRepo.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.delete.mockResolvedValue({ affected: 0 });

      const result = await shotService.hardDeleteShot('invalid-shot');

      expect(result).toBe(false);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('restoreShot', () => {
    it('should restore shot successfully', async () => {
      const mockShot = { id: 'shot-1', machine: { id: 'machine-1' } };

      mockShotRepo.restore.mockResolvedValue({ affected: 1 });
      mockShotRepo.findOne.mockResolvedValue(mockShot);

      const result = await shotService.restoreShot('shot-1');

      expect(mockShotRepo.restore).toHaveBeenCalledWith('shot-1');
      expect(result).toEqual(mockShot);
    });

    it('should throw error when shot not found for restore', async () => {
      mockShotRepo.restore.mockResolvedValue({ affected: 0 });

      await expect(shotService.restoreShot('invalid-shot')).rejects.toThrow();
    });
  });

  describe('getShotStatistics', () => {
    it('should return statistics for filtered shots', async () => {
      mockShotRepo.count
        .mockResolvedValueOnce(100) // totalShots
        .mockResolvedValueOnce(85); // successfulShots

      const result = await shotService.getShotStatistics({
        machineId: 'machine-1',
        success: true,
      });

      expect(mockShotRepo.count).toHaveBeenCalledWith({ where: expect.any(Object) });
      expect(mockShotRepo.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ success: true }),
      });
      expect(result).toEqual({
        total: 100,
        successful: 85,
        failed: 15,
        successRate: 85,
      });
    });

    it('should return overall statistics when no filters provided', async () => {
      mockShotRepo.count
        .mockResolvedValueOnce(200) // totalShots
        .mockResolvedValueOnce(170); // successfulShots

      const result = await shotService.getShotStatistics();

      expect(result).toEqual({
        total: 200,
        successful: 170,
        failed: 30,
        successRate: 85,
      });
    });
  });
});
