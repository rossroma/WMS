// Mock所有依赖的模型
jest.mock('../../../src/models/InboundOrder', () => ({
  InboundOrder: {
    create: jest.fn(),
    findByPk: jest.fn()
  },
  InboundType: {
    STOCK_IN: 'STOCK_IN',
    PURCHASE: 'PURCHASE',
    RETURN: 'RETURN'
  }
}));

jest.mock('../../../src/models/OrderItem', () => ({
  OrderItem: {
    bulkCreate: jest.fn()
  },
  OrderItemType: {
    INBOUND: 'INBOUND'
  }
}));

jest.mock('../../../src/models/Inventory', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
}));

jest.mock('../../../src/models/InventoryLog', () => ({
  create: jest.fn()
}));

jest.mock('../../../src/utils/orderUtils', () => ({
  generateInboundOrderNo: jest.fn(() => 'IN202401010001')
}));

jest.mock('../../../src/services/loggerService', () => ({
  error: jest.fn()
}));

const { createInboundOrderService, deleteInboundOrderService } = require('../../../src/services/inboundOrderService');
const { InboundOrder, InboundType } = require('../../../src/models/InboundOrder');
const { OrderItem, OrderItemType } = require('../../../src/models/OrderItem');
const Inventory = require('../../../src/models/Inventory');
const InventoryLog = require('../../../src/models/InventoryLog');
const sequelize = require('../../../src/config/database');

describe('InboundOrderService', () => {
  let transaction;

  beforeEach(async () => {
    // 每个测试开始前创建事务
    transaction = await sequelize.transaction();
    
    // 清理Mock
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // 每个测试结束后回滚事务
    if (transaction) {
      await transaction.rollback();
    }
  });

  describe('createInboundOrderService', () => {
    beforeEach(() => {
      // Mock模型方法
      InboundOrder.create = jest.fn();
      OrderItem.bulkCreate = jest.fn();
      Inventory.findOne = jest.fn();
      Inventory.create = jest.fn();
      InventoryLog.create = jest.fn();
    });

    it('应该成功创建手动入库单（不带关联订单ID）', async () => {
      const mockInventory = {
        quantity: 50,
        update: jest.fn().mockResolvedValue(true)
      };
      
      const mockOrder = {
        id: 1,
        orderNo: 'IN202401010001'
      };

      const mockOrderItems = [
        { id: 1, productId: 1, quantity: 10 }
      ];

      // 设置Mock返回值
      Inventory.findOne.mockResolvedValue(mockInventory);
      InboundOrder.create.mockResolvedValue(mockOrder);
      OrderItem.bulkCreate.mockResolvedValue(mockOrderItems);
      InventoryLog.create.mockResolvedValue({});

      const params = {
        type: InboundType.RETURN,
        operator: 'testuser',
        remark: '退货入库',
        items: [
          {
            productId: 1,
            quantity: 10,
            unitPrice: 100,
            unit: '个'
          }
        ],
        orderDate: new Date('2024-01-01'),
        relatedOrderId: null // 手动创建，不关联订单
      };

      const result = await createInboundOrderService(params, transaction);

      // 验证返回结果
      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('items');
      expect(result.order).toBe(mockOrder);
      expect(result.items).toHaveLength(1);

      // 验证调用了正确的方法
      expect(InboundOrder.create).toHaveBeenCalledWith({
        orderNo: 'IN202401010001',
        type: InboundType.RETURN,
        totalAmount: 1000,
        totalQuantity: 10,
        operator: 'testuser',
        remark: '退货入库',
        orderDate: new Date('2024-01-01'),
        relatedOrderId: null // 确认没有关联订单ID
      }, { transaction });

      expect(OrderItem.bulkCreate).toHaveBeenCalledWith([{
        orderType: OrderItemType.INBOUND,
        orderId: 1,
        productId: 1,
        quantity: 10,
        unitPrice: 100,
        totalPrice: 1000,
        unit: '个'
      }], { transaction });

      expect(mockInventory.update).toHaveBeenCalledWith({
        quantity: 60 // 50 + 10
      }, { transaction });

      expect(InventoryLog.create).toHaveBeenCalledWith({
        orderItemId: 1,
        changeQuantity: 10,
        type: '入库',
        relatedDocument: 'IN202401010001',
        operator: 'testuser'
      }, { transaction });
    });

    it('应该成功创建采购入库单（关联采购单ID）', async () => {
      const mockInventory = {
        quantity: 50,
        update: jest.fn().mockResolvedValue(true)
      };
      
      const mockOrder = {
        id: 1,
        orderNo: 'IN202401010001'
      };

      const mockOrderItems = [
        { id: 1, productId: 1, quantity: 20 }
      ];

      // 设置Mock返回值
      Inventory.findOne.mockResolvedValue(mockInventory);
      InboundOrder.create.mockResolvedValue(mockOrder);
      OrderItem.bulkCreate.mockResolvedValue(mockOrderItems);
      InventoryLog.create.mockResolvedValue({});

      const params = {
        type: InboundType.PURCHASE,
        operator: 'testuser',
        remark: '采购订单PO001自动生成的入库单',
        items: [
          {
            productId: 1,
            quantity: 20,
            unitPrice: 95,
            unit: '个'
          }
        ],
        orderDate: new Date('2024-01-01'),
        relatedOrderId: 123 // 关联采购单ID
      };

      const result = await createInboundOrderService(params, transaction);

      // 验证返回结果
      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('items');
      expect(result.order).toBe(mockOrder);
      expect(result.items).toHaveLength(1);

      // 验证调用了正确的方法，包含关联订单ID
      expect(InboundOrder.create).toHaveBeenCalledWith({
        orderNo: 'IN202401010001',
        type: InboundType.PURCHASE,
        totalAmount: 1900,
        totalQuantity: 20,
        operator: 'testuser',
        remark: '采购订单PO001自动生成的入库单',
        orderDate: new Date('2024-01-01'),
        relatedOrderId: 123 // 确认包含关联订单ID
      }, { transaction });
    });

    it('应该成功创建盘盈入库单（关联盘点单ID）', async () => {
      const mockInventory = {
        quantity: 45,
        update: jest.fn().mockResolvedValue(true)
      };
      
      const mockOrder = {
        id: 1,
        orderNo: 'IN202401010001'
      };

      const mockOrderItems = [
        { id: 1, productId: 1, quantity: 5 }
      ];

      // 设置Mock返回值
      Inventory.findOne.mockResolvedValue(mockInventory);
      InboundOrder.create.mockResolvedValue(mockOrder);
      OrderItem.bulkCreate.mockResolvedValue(mockOrderItems);
      InventoryLog.create.mockResolvedValue({});

      const params = {
        type: InboundType.STOCK_IN,
        operator: 'testuser',
        remark: '盘点单ST001自动生成的盘盈入库',
        items: [
          {
            productId: 1,
            quantity: 5,
            unitPrice: 90,
            unit: '个'
          }
        ],
        orderDate: new Date('2024-01-01'),
        relatedOrderId: 456 // 关联盘点单ID
      };

      const result = await createInboundOrderService(params, transaction);

      // 验证返回结果
      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('items');
      expect(result.order).toBe(mockOrder);
      expect(result.items).toHaveLength(1);

      // 验证调用了正确的方法，包含关联订单ID
      expect(InboundOrder.create).toHaveBeenCalledWith({
        orderNo: 'IN202401010001',
        type: InboundType.STOCK_IN,
        totalAmount: 450,
        totalQuantity: 5,
        operator: 'testuser',
        remark: '盘点单ST001自动生成的盘盈入库',
        orderDate: new Date('2024-01-01'),
        relatedOrderId: 456 // 确认包含关联订单ID
      }, { transaction });
    });

    it('当商品明细为空时应该抛出错误', async () => {
      const params = {
        type: InboundType.PURCHASE,
        operator: 'testuser',
        remark: '测试入库',
        items: [],
        orderDate: new Date('2024-01-01')
      };

      await expect(createInboundOrderService(params, transaction))
        .rejects.toThrow('入库商品明细不能为空');
    });
  });

  describe('deleteInboundOrderService', () => {
    beforeEach(() => {
      // Mock模型方法
      InboundOrder.findByPk = jest.fn();
      Inventory.findOne = jest.fn();
      Inventory.create = jest.fn();
    });

    it('应该成功删除入库单并回退库存', async () => {
      const mockInventory = {
        quantity: 70,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockOrder = {
        id: 1,
        orderNo: 'IN202401010001',
        items: [
          { productId: 1, quantity: 10 }
        ],
        destroy: jest.fn().mockResolvedValue(true)
      };

      InboundOrder.findByPk.mockResolvedValue(mockOrder);
      Inventory.findOne.mockResolvedValue(mockInventory);

      const result = await deleteInboundOrderService(1, transaction);

      expect(result).toBe(true);
      expect(mockInventory.update).toHaveBeenCalledWith({
        quantity: 60 // 70 - 10
      }, { transaction });
      expect(mockOrder.destroy).toHaveBeenCalledWith({ transaction });
    });

    it('当入库单不存在时应该抛出错误', async () => {
      InboundOrder.findByPk.mockResolvedValue(null);

      await expect(deleteInboundOrderService(999, transaction))
        .rejects.toThrow('入库单不存在');
    });
  });
}); 