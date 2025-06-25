// Mock dependencies first
jest.mock('../../../src/models/Inventory', () => ({
  findAndCountAll: jest.fn()
}));

jest.mock('../../../src/models/Product', () => ({}));
jest.mock('../../../src/models/Category', () => ({}));
jest.mock('../../../src/models/Supplier', () => ({}));

jest.mock('../../../src/middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
}));

const { getInventory } = require('../../../src/controllers/inventoryController');
const Inventory = require('../../../src/models/Inventory');

describe('InventoryController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getInventory', () => {
    it('应该支持按供应商ID筛选商品', async () => {
      // Arrange
      req.query = {
        page: 1,
        pageSize: 10,
        supplierId: 1
      };

      const mockInventoryData = {
        count: 5,
        rows: [
          {
            id: 1,
            quantity: 100,
            Product: {
              id: 1,
              name: '测试商品1',
              supplierId: 1
            }
          }
        ]
      };

      Inventory.findAndCountAll.mockResolvedValue(mockInventoryData);

      // Act
      await getInventory(req, res, next);

      // Assert
      expect(Inventory.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              where: expect.objectContaining({
                supplierId: 1
              })
            })
          ])
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: '获取库存信息成功',
        data: {
          list: mockInventoryData.rows,
          total: mockInventoryData.count,
          page: 1,
          pageSize: 10,
          totalPages: 1
        }
      });
    });

    it('应该同时支持商品名称和供应商ID筛选', async () => {
      // Arrange
      req.query = {
        page: 1,
        pageSize: 10,
        productName: '测试',
        supplierId: 1
      };

      const mockInventoryData = {
        count: 2,
        rows: []
      };

      Inventory.findAndCountAll.mockResolvedValue(mockInventoryData);

      // Act
      await getInventory(req, res, next);

      // Assert
      expect(Inventory.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              where: expect.objectContaining({
                name: expect.objectContaining({
                  like: '%测试%'
                }),
                supplierId: 1
              })
            })
          ])
        })
      );
    });

    it('应该在没有供应商ID时正常工作', async () => {
      // Arrange
      req.query = {
        page: 1,
        pageSize: 10,
        productName: '测试'
      };

      const mockInventoryData = {
        count: 10,
        rows: []
      };

      Inventory.findAndCountAll.mockResolvedValue(mockInventoryData);

      // Act
      await getInventory(req, res, next);

      // Assert
      const includeClause = Inventory.findAndCountAll.mock.calls[0][0].include[0];
      expect(includeClause.where).toHaveProperty('name');
      expect(includeClause.where).not.toHaveProperty('supplierId');
    });

    it('应该处理查询错误', async () => {
      // Arrange
      req.query = { page: 1, pageSize: 10 };
      
      const error = new Error('Database error');
      Inventory.findAndCountAll.mockRejectedValue(error);

      // Act
      await getInventory(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: '获取库存信息失败'
      }));
    });
  });
}); 