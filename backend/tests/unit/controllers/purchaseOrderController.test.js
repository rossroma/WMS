// Mock all model dependencies first
jest.mock('../../../src/models/Product', () => ({}));
jest.mock('../../../src/models/Category', () => ({}));
jest.mock('../../../src/models/Supplier', () => ({}));
jest.mock('../../../src/models/User', () => ({}));
jest.mock('../../../src/models/Inventory', () => ({}));
jest.mock('../../../src/models/OrderItem', () => ({}));

jest.mock('../../../src/models/PurchaseOrder', () => ({
  PurchaseOrder: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  PurchaseOrderItem: {
    create: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn()
  }
}));

jest.mock('../../../src/services/logService', () => ({
  createLog: jest.fn()
}));

jest.mock('../../../src/middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
}));

const { createPurchaseOrder } = require('../../../src/controllers/purchaseOrderController');
const { PurchaseOrder, PurchaseOrderItem } = require('../../../src/models/PurchaseOrder');

describe('PurchaseOrderController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: { username: 'testuser' },
      ip: '127.0.0.1'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createPurchaseOrder', () => {
    it('应该成功创建采购订单但不包含paymentStatus字段', async () => {
      // Arrange
      const orderData = {
        supplierId: 1,
        orderDate: '2024-01-01',
        expectedArrivalDate: '2024-01-05',
        paymentMethod: '现金',
        operator: 'testuser',
        remark: '测试订单',
        items: [
          {
            productId: 1,
            quantity: 10,
            unitPrice: 100,
            totalPrice: 1000
          }
        ]
      };

      req.body = orderData;

      const createdOrder = {
        id: 1,
        orderNo: 'PO20240101001',
        supplierId: 1,
        status: 'PENDING',
        totalAmount: 1000,
        totalQuantity: 10,
        paymentMethod: '现金',
        operator: 'testuser',
        // 注意：不包含 paymentStatus 字段
      };

      PurchaseOrder.create.mockResolvedValue(createdOrder);
      PurchaseOrderItem.bulkCreate.mockResolvedValue([{}]);

      // Act
      await createPurchaseOrder(req, res, next);

      // Assert
      expect(PurchaseOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: 1,
          orderDate: '2024-01-01',
          expectedArrivalDate: '2024-01-05',
          status: 'PENDING',
          paymentMethod: '现金',
          operator: 'testuser',
          remark: '测试订单',
          totalAmount: 1000,
          totalQuantity: 10
        }),
        expect.objectContaining({
          transaction: expect.any(Object)
        })
      );

      // 验证不包含 paymentStatus 字段
      const createCallArgs = PurchaseOrder.create.mock.calls[0][0];
      expect(createCallArgs).not.toHaveProperty('paymentStatus');
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: '采购订单创建成功',
        data: expect.objectContaining({
          purchaseOrder: expect.objectContaining({
            id: 1,
            orderNo: 'PO20240101001',
            supplierId: 1,
            status: 'PENDING',
            totalAmount: 1000,
            totalQuantity: 10,
            paymentMethod: '现金',
            operator: 'testuser'
          }),
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: 1,
              quantity: 10,
              unitPrice: 100,
              totalPrice: 1000
            })
          ])
        })
      });
    });

    it('应该正确处理包含paymentMethod的订单创建', async () => {
      // Arrange
      const orderData = {
        supplierId: 1,
        paymentMethod: '银行转账',
        operator: 'testuser',
        items: [
          {
            productId: 1,
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100
          }
        ]
      };

      req.body = orderData;
      PurchaseOrder.create.mockResolvedValue({ id: 1 });
      PurchaseOrderItem.bulkCreate.mockResolvedValue([{}]);

      // Act
      await createPurchaseOrder(req, res, next);

      // Assert
      const createCallArgs = PurchaseOrder.create.mock.calls[0][0];
      expect(createCallArgs.paymentMethod).toBe('银行转账');
      expect(createCallArgs).not.toHaveProperty('paymentStatus');
    });

    it('应该处理创建失败的情况', async () => {
      // Arrange
      req.body = {
        supplierId: 1,
        items: []
      };

      // Act
      await createPurchaseOrder(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: '采购商品明细不能为空'
      }));
    });
  });
}); 