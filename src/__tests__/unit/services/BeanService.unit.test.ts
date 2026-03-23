import { BeanService } from '../../../services/BeanService';
import { Bean } from '../../../entities/Bean';
import { DataSource } from 'typeorm';
import { createMockDataSource } from '../../__mocks__/data-source.mock';

// Mock data
const mockBeanData = {
  name: 'Test Bean',
  roaster: 'Test Roaster',
  country: 'Colombia',
  region: 'Huila',
  farm: 'Test Farm',
  varietal: 'Caturra',
  processing_method: 'Washed',
  altitude_m: 1500,
  density_category: 'Medium',
};

describe('BeanService', () => {
  let beanService: BeanService;
  let mockDataSource: DataSource;
  let mockBeanRepository: any;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    mockBeanRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    
    mockDataSource.getRepository = jest.fn().mockReturnValue(mockBeanRepository);
    beanService = new BeanService(mockDataSource);
  });

  describe('getAllBeans', () => {
    it('should return all beans with relations', async () => {
      // Arrange
      const expectedBeans = [
        { id: '1', name: 'Bean 1', beanBatches: [] },
        { id: '2', name: 'Bean 2', beanBatches: [] },
      ];
      mockBeanRepository.find.mockResolvedValue(expectedBeans);

      // Act
      const result = await beanService.getAllBeans();

      // Assert
      expect(mockBeanRepository.find).toHaveBeenCalledWith({
        relations: ['beanBatches'],
      });
      expect(result).toEqual(expectedBeans);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockBeanRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(beanService.getAllBeans()).rejects.toThrow('Database error');
    });
  });

  describe('getBeanById', () => {
    it('should return bean by ID with relations', async () => {
      // Arrange
      const beanId = 'test-id';
      const expectedBean = { id: beanId, name: 'Test Bean', beanBatches: [] };
      mockBeanRepository.findOne.mockResolvedValue(expectedBean);

      // Act
      const result = await beanService.getBeanById(beanId);

      // Assert
      expect(mockBeanRepository.findOne).toHaveBeenCalledWith({
        where: { id: beanId },
        relations: ['beanBatches'],
      });
      expect(result).toEqual(expectedBean);
    });

    it('should throw error when bean not found', async () => {
      // Arrange
      const beanId = 'non-existent-id';
      mockBeanRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(beanService.getBeanById(beanId)).rejects.toThrow(
        `Bean with ID ${beanId} not found`
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const beanId = 'test-id';
      const error = new Error('Database error');
      mockBeanRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(beanService.getBeanById(beanId)).rejects.toThrow('Database error');
    });
  });

  describe('createBean', () => {
    it('should create bean with valid data', async () => {
      // Arrange
      const expectedBean = { id: 'new-id', ...mockBeanData };
      mockBeanRepository.create.mockReturnValue(mockBeanData);
      mockBeanRepository.save.mockResolvedValue(expectedBean);

      // Act
      const result = await beanService.createBean(mockBeanData);

      // Assert
      expect(mockBeanRepository.create).toHaveBeenCalledWith(mockBeanData);
      expect(mockBeanRepository.save).toHaveBeenCalledWith(mockBeanData);
      expect(result).toEqual(expectedBean);
    });

    it('should throw error when name is missing', async () => {
      // Arrange
      const invalidData = { ...mockBeanData, name: '' };

      // Act & Assert
      await expect(beanService.createBean(invalidData)).rejects.toThrow(
        'Bean name is required'
      );
    });

    it('should convert altitude_m to number when provided as string', async () => {
      // Arrange
      const beanDataWithStringAltitude = {
        ...mockBeanData,
        altitude_m: '1500',
      };
      const expectedBean = { ...mockBeanData, altitude_m: 1500 };
      mockBeanRepository.create.mockReturnValue(expectedBean);
      mockBeanRepository.save.mockResolvedValue(expectedBean);

      // Act
      const result = await beanService.createBean(beanDataWithStringAltitude);

      // Assert
      expect(mockBeanRepository.create).toHaveBeenCalledWith(expectedBean);
      expect(result).toEqual(expectedBean);
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const error = new Error('Database error');
      mockBeanRepository.create.mockReturnValue(mockBeanData);
      mockBeanRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(beanService.createBean(mockBeanData)).rejects.toThrow('Database error');
    });
  });

  describe('updateBean', () => {
    it('should update existing bean', async () => {
      // Arrange
      const beanId = 'test-id';
      const existingBean = { id: beanId, name: 'Old Name' };
      const updateData = { name: 'New Name' };
      const updatedBean = { ...existingBean, ...updateData };
      
      mockBeanRepository.findOne.mockResolvedValue(existingBean);
      mockBeanRepository.save.mockResolvedValue(updatedBean);

      // Act
      const result = await beanService.updateBean(beanId, updateData);

      // Assert
      expect(mockBeanRepository.findOne).toHaveBeenCalledWith({
        where: { id: beanId },
      });
      expect(mockBeanRepository.save).toHaveBeenCalledWith(updatedBean);
      expect(result).toEqual(updatedBean);
    });

    it('should throw error when bean not found for update', async () => {
      // Arrange
      const beanId = 'non-existent-id';
      const updateData = { name: 'New Name' };
      mockBeanRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(beanService.updateBean(beanId, updateData)).rejects.toThrow(
        `Bean with ID ${beanId} not found`
      );
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const beanId = 'test-id';
      const existingBean = {
        id: beanId,
        name: 'Original Name',
        roaster: 'Original Roaster',
        country: 'Original Country',
      };
      const partialUpdate = { name: 'Updated Name' }; // Only updating name
      const updatedBean = { ...existingBean, name: 'Updated Name' };
      
      mockBeanRepository.findOne.mockResolvedValue(existingBean);
      mockBeanRepository.save.mockResolvedValue(updatedBean);

      // Act
      const result = await beanService.updateBean(beanId, partialUpdate);

      // Assert
      expect(result.name).toBe('Updated Name');
      expect(result.roaster).toBe('Original Roaster'); // Should remain unchanged
      expect(result.country).toBe('Original Country'); // Should remain unchanged
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const beanId = 'test-id';
      const updateData = { name: 'New Name' };
      const error = new Error('Database error');
      mockBeanRepository.findOne.mockResolvedValue({ id: beanId });
      mockBeanRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(beanService.updateBean(beanId, updateData)).rejects.toThrow('Database error');
    });
  });

  describe('deleteBean', () => {
    it('should delete existing bean', async () => {
      // Arrange
      const beanId = 'test-id';
      const existingBean = { id: beanId, name: 'Test Bean' };
      mockBeanRepository.findOne.mockResolvedValue(existingBean);
      mockBeanRepository.remove.mockResolvedValue(existingBean);

      // Act
      const result = await beanService.deleteBean(beanId);

      // Assert
      expect(mockBeanRepository.findOne).toHaveBeenCalledWith({
        where: { id: beanId },
      });
      expect(mockBeanRepository.remove).toHaveBeenCalledWith(existingBean);
      expect(result).toBe(true);
    });

    it('should throw error when bean not found for deletion', async () => {
      // Arrange
      const beanId = 'non-existent-id';
      mockBeanRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(beanService.deleteBean(beanId)).rejects.toThrow(
        `Bean with ID ${beanId} not found`
      );
    });

    it('should handle repository errors during deletion', async () => {
      // Arrange
      const beanId = 'test-id';
      const error = new Error('Database error');
      mockBeanRepository.findOne.mockResolvedValue({ id: beanId });
      mockBeanRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(beanService.deleteBean(beanId)).rejects.toThrow('Database error');
    });
  });
});
