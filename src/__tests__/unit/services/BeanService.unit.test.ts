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
      await expect(beanService.createBean(invalidData)).rejects.toThrow('Bean name is required');
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

    it('should set altitude to null when invalid string provided', async () => {
      // Arrange
      const beanDataWithInvalidAltitude = {
        ...mockBeanData,
        altitude_m: 'invalid-number',
      };
      const expectedBean = { ...mockBeanData, altitude_m: null };
      mockBeanRepository.create.mockReturnValue(expectedBean);
      mockBeanRepository.save.mockResolvedValue(expectedBean);

      // Act
      const result = await beanService.createBean(beanDataWithInvalidAltitude);

      // Assert
      expect(mockBeanRepository.create).toHaveBeenCalledWith(expectedBean);
      expect(result.altitude_m).toBeNull();
    });

    it('should handle null altitude_m correctly', async () => {
      // Arrange
      const beanDataWithNullAltitude = {
        ...mockBeanData,
        altitude_m: null,
      };
      const expectedBean = { ...mockBeanData, altitude_m: null };
      mockBeanRepository.create.mockReturnValue(expectedBean);
      mockBeanRepository.save.mockResolvedValue(expectedBean);

      // Act
      const result = await beanService.createBean(beanDataWithNullAltitude);

      // Assert
      expect(mockBeanRepository.create).toHaveBeenCalledWith(expectedBean);
      expect(result.altitude_m).toBeNull();
    });

    it('should handle undefined altitude_m correctly', async () => {
      // Arrange
      const beanDataWithUndefinedAltitude = {
        ...mockBeanData,
        altitude_m: undefined,
      };
      const expectedBean = { ...mockBeanData, altitude_m: null }; // Service converts undefined to null
      mockBeanRepository.create.mockReturnValue(expectedBean);
      mockBeanRepository.save.mockResolvedValue(expectedBean);

      // Act
      const result = await beanService.createBean(beanDataWithUndefinedAltitude);

      // Assert
      expect(mockBeanRepository.create).toHaveBeenCalledWith(expectedBean);
      expect(result.altitude_m).toBeNull(); // Service converts undefined to null
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

    it('should handle altitude conversion in update with invalid string', async () => {
      // Arrange
      const beanId = 'test-id';
      const existingBean = {
        id: beanId,
        name: 'Test Bean',
        altitude_m: 1500,
      };
      const updateData = { altitude_m: 'invalid-number' };
      const updatedBean = { ...existingBean, altitude_m: null };

      mockBeanRepository.findOne.mockResolvedValue(existingBean);
      mockBeanRepository.save.mockResolvedValue(updatedBean);

      // Act
      const result = await beanService.updateBean(beanId, updateData);

      // Assert
      expect(result.altitude_m).toBeNull();
    });

    it('should handle altitude conversion in update with valid string', async () => {
      // Arrange
      const beanId = 'test-id';
      const existingBean = {
        id: beanId,
        name: 'Test Bean',
        altitude_m: 1500,
      };
      const updateData = { altitude_m: '1800' };
      const updatedBean = { ...existingBean, altitude_m: 1800 };

      mockBeanRepository.findOne.mockResolvedValue(existingBean);
      mockBeanRepository.save.mockResolvedValue(updatedBean);

      // Act
      const result = await beanService.updateBean(beanId, updateData);

      // Assert
      expect(result.altitude_m).toBe(1800);
    });

    it('should not update altitude when not provided in update data', async () => {
      // Arrange
      const beanId = 'test-id';
      const existingBean = {
        id: beanId,
        name: 'Test Bean',
        altitude_m: 1500,
      };
      const updateData = { name: 'Updated Name' };
      const updatedBean = { ...existingBean, name: 'Updated Name' };

      mockBeanRepository.findOne.mockResolvedValue(existingBean);
      mockBeanRepository.save.mockResolvedValue(updatedBean);

      // Act
      const result = await beanService.updateBean(beanId, updateData);

      // Assert
      expect(result.altitude_m).toBe(1500); // Should remain unchanged
    });

    it('should handle each field update individually', async () => {
      // Test name field
      const beanId = 'test-id';
      const existingBean = {
        id: beanId,
        name: 'Original Name',
        roaster: 'Original Roaster',
        country: 'Original Country',
        region: 'Original Region',
        farm: 'Original Farm',
        varietal: 'Original Varietal',
        processing_method: 'Original Process',
        density_category: 'Original Density',
      };

      mockBeanRepository.findOne.mockResolvedValue(existingBean);

      // Test name update
      const nameUpdate = { name: '  Updated Name  ' }; // With whitespace
      const nameUpdatedBean = { ...existingBean, name: 'Updated Name' };
      mockBeanRepository.save.mockResolvedValue(nameUpdatedBean);
      let result = await beanService.updateBean(beanId, nameUpdate);
      expect(result.name).toBe('Updated Name');

      // Test roaster update
      const roasterUpdate = { roaster: '  Updated Roaster  ' };
      const roasterUpdatedBean = { ...existingBean, roaster: 'Updated Roaster' };
      mockBeanRepository.save.mockResolvedValue(roasterUpdatedBean);
      result = await beanService.updateBean(beanId, roasterUpdate);
      expect(result.roaster).toBe('Updated Roaster');

      // Test country update
      const countryUpdate = { country: '  Updated Country  ' };
      const countryUpdatedBean = { ...existingBean, country: 'Updated Country' };
      mockBeanRepository.save.mockResolvedValue(countryUpdatedBean);
      result = await beanService.updateBean(beanId, countryUpdate);
      expect(result.country).toBe('Updated Country');

      // Test region update
      const regionUpdate = { region: '  Updated Region  ' };
      const regionUpdatedBean = { ...existingBean, region: 'Updated Region' };
      mockBeanRepository.save.mockResolvedValue(regionUpdatedBean);
      result = await beanService.updateBean(beanId, regionUpdate);
      expect(result.region).toBe('Updated Region');

      // Test farm update
      const farmUpdate = { farm: '  Updated Farm  ' };
      const farmUpdatedBean = { ...existingBean, farm: 'Updated Farm' };
      mockBeanRepository.save.mockResolvedValue(farmUpdatedBean);
      result = await beanService.updateBean(beanId, farmUpdate);
      expect(result.farm).toBe('Updated Farm');

      // Test varietal update
      const varietalUpdate = { varietal: '  Updated Varietal  ' };
      const varietalUpdatedBean = { ...existingBean, varietal: 'Updated Varietal' };
      mockBeanRepository.save.mockResolvedValue(varietalUpdatedBean);
      result = await beanService.updateBean(beanId, varietalUpdate);
      expect(result.varietal).toBe('Updated Varietal');

      // Test processing_method update
      const processUpdate = { processing_method: '  Updated Process  ' };
      const processUpdatedBean = { ...existingBean, processing_method: 'Updated Process' };
      mockBeanRepository.save.mockResolvedValue(processUpdatedBean);
      result = await beanService.updateBean(beanId, processUpdate);
      expect(result.processing_method).toBe('Updated Process');

      // Test density_category update
      const densityUpdate = { density_category: '  Updated Density  ' };
      const densityUpdatedBean = { ...existingBean, density_category: 'Updated Density' };
      mockBeanRepository.save.mockResolvedValue(densityUpdatedBean);
      result = await beanService.updateBean(beanId, densityUpdate);
      expect(result.density_category).toBe('Updated Density');
    });

    it('should handle empty string updates by keeping original values', async () => {
      // Arrange
      const beanId = 'test-id';
      const existingBean = {
        id: beanId,
        name: 'Original Name',
        roaster: 'Original Roaster',
      };

      mockBeanRepository.findOne.mockResolvedValue(existingBean);

      // Test name with empty string
      const nameUpdate = { name: '' };
      const nameUpdatedBean = { ...existingBean, name: 'Original Name' }; // Should keep original
      mockBeanRepository.save.mockResolvedValue(nameUpdatedBean);
      let result = await beanService.updateBean(beanId, nameUpdate);
      expect(result.name).toBe('Original Name');

      // Test roaster with empty string
      const roasterUpdate = { roaster: '' };
      const roasterUpdatedBean = { ...existingBean, roaster: 'Original Roaster' }; // Should keep original
      mockBeanRepository.save.mockResolvedValue(roasterUpdatedBean);
      result = await beanService.updateBean(beanId, roasterUpdate);
      expect(result.roaster).toBe('Original Roaster');
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
