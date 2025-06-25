// Mock所有依赖的模型
jest.mock('../../../src/models/OutboundOrder', () => ({
  OutboundOrder: {
    create: jest.fn(),
    findByPk: jest.fn()
  },
  OutboundType: {
    STOCK_OUT: 'STOCK_OUT'
  }
}));

jest.mock('../../../src/models/OrderItem', () => ({
  OrderItem: {
    bulkCreate: jest.fn()
  },
  OrderItemType: {
    OUTBOUND: 'OUTBOUND'
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

jest.mock('../../../src/models/Product', () => ({
  findByPk: jest.fn()
}));

jest.mock('../../../src/utils/orderUtils', () => ({
  generateOutboundOrderNo: jest.fn(() => 'OUT202401010001')
}));

jest.mock('../../../src/services/loggerService', () => ({
  error: jest.fn()
}));

jest.mock('../../../src/services/messageService', () => ({
  createInventoryAlert: jest.fn()
}));

const { createOutboundOrderService, deleteOutboundOrderService } = require('../../../src/services/outboundOrderService');
const { OutboundOrder, OutboundType } = require('../../../src/models/OutboundOrder');
const { OrderItem, OrderItemType } = require('../../../src/models/OrderItem');
const Inventory = require('../../../src/models/Inventory');
const InventoryLog = require('../../../src/models/InventoryLog');
const sequelize = require('../../../src/config/database');

describe('OutboundOrderService', () => {
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

  describe('createOutboundOrderService', () => {
    beforeEach(() => {
      // Mock模型方法
      OutboundOrder.create = jest.fn();
      OrderItem.bulkCreate = jest.fn();
      Inventory.findOne = jest.fn();
      Inventory.update = jest.fn();
      InventoryLog.create = jest.fn();
    });

    it('应该成功创建出库单', async () => {
      const mockInventory = {
        quantity: 100,
        update: jest.fn().mockResolvedValue(true)
      };
      
      const mockOrder = {
        id: 1,
        orderNo: 'OUT202401010001'
      };

      const mockOrderItems = [
        { id: 1, productId: 1, quantity: 10 }
      ];

      // 设置Mock返回值
      Inventory.findOne.mockResolvedValue(mockInventory);
      OutboundOrder.create.mockResolvedValue(mockOrder);
      OrderItem.bulkCreate.mockResolvedValue(mockOrderItems);
      InventoryLog.create.mockResolvedValue({});

      const params = {
        type: OutboundType.STOCK_OUT,
        operator: 'testuser',
        remark: '测试出库',
        items: [
          {
            productId: 1,
            quantity: 10,
            unitPrice: 100,
            unit: '个'
          }
        ],
        orderDate: new Date('2024-01-01'),
        enableStockAlert: true
      };

      const result = await createOutboundOrderService(params, transaction);

      // 验证返回结果
      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('updatedInventories');
      expect(result.order).toBe(mockOrder);
      expect(result.items).toHaveLength(1);
      expect(result.updatedInventories).toHaveLength(1);

      // 验证调用了正确的方法
      expect(OutboundOrder.create).toHaveBeenCalledWith({
        orderNo: 'OUT202401010001',
        type: OutboundType.STOCK_OUT,
        totalAmount: 1000,
        totalQuantity: 10,
        operator: 'testuser',
        remark: '测试出库',
        orderDate: new Date('2024-01-01'),
        relatedOrderId: null
      }, { transaction });

      expect(OrderItem.bulkCreate).toHaveBeenCalledWith([{
        orderType: OrderItemType.OUTBOUND,
        orderId: 1,
        productId: 1,
        quantity: 10,
        unitPrice: 100,
        totalPrice: 1000,
        unit: '个'
      }], { transaction });

      expect(mockInventory.update).toHaveBeenCalledWith({
        quantity: 90 // 100 - 10
      }, { transaction });

      expect(InventoryLog.create).toHaveBeenCalledWith({
        orderItemId: 1,
        changeQuantity: -10,
        type: '出库',
        relatedDocument: 'OUT202401010001',
        operator: 'testuser'
      }, { transaction });
    });

    it('当商品明细为空时应该抛出错误', async () => {
      const params = {
        type: OutboundType.STOCK_OUT,
        operator: 'testuser',
        remark: '测试出库',
        items: [],
        orderDate: new Date('2024-01-01')
      };

      await expect(createOutboundOrderService(params, transaction))
        .rejects.toThrow('出库商品明细不能为空');
    });

    it('当库存不足时应该抛出错误', async () => {
      const mockInventory = {
        quantity: 5
      };

      Inventory.findOne.mockResolvedValue(mockInventory);

      const params = {
        type: OutboundType.STOCK_OUT,
        operator: 'testuser',
        remark: '测试出库',
        items: [
          {
            productId: 1,
            quantity: 10,
            unitPrice: 100,
            unit: '个'
          }
        ],
        orderDate: new Date('2024-01-01')
      };

      await expect(createOutboundOrderService(params, transaction))
        .rejects.toThrow('商品ID 1 库存不足，当前库存：5，需要出库：10');
    });

    it('当库存记录不存在时应该抛出错误', async () => {
      Inventory.findOne.mockResolvedValue(null);

      const params = {
        type: OutboundType.STOCK_OUT,
        operator: 'testuser',
        remark: '测试出库',
        items: [
          {
            productId: 1,
            quantity: 10,
            unitPrice: 100,
            unit: '个'
          }
        ],
        orderDate: new Date('2024-01-01')
      };

      await expect(createOutboundOrderService(params, transaction))
        .rejects.toThrow('商品ID 1 的库存记录不存在');
    });
  });

  describe('deleteOutboundOrderService', () => {
    beforeEach(() => {
      // Mock模型方法
      OutboundOrder.findByPk = jest.fn();
      Inventory.findOne = jest.fn();
      Inventory.update = jest.fn();
    });

    it('应该成功删除出库单并恢复库存', async () => {
      const mockInventory = {
        quantity: 90,
        update: jest.fn().mockResolvedValue(true)
      };

      const mockOrder = {
        id: 1,
        orderNo: 'OUT202401010001',
        items: [
          { productId: 1, quantity: 10 }
        ],
        destroy: jest.fn().mockResolvedValue(true)
      };

      OutboundOrder.findByPk.mockResolvedValue(mockOrder);
      Inventory.findOne.mockResolvedValue(mockInventory);

      const result = await deleteOutboundOrderService(1, transaction);

      expect(result).toBe(true);
      expect(mockInventory.update).toHaveBeenCalledWith({
        quantity: 100 // 90 + 10
      }, { transaction });
      expect(mockOrder.destroy).toHaveBeenCalledWith({ transaction });
    });

    it('当出库单不存在时应该抛出错误', async () => {
      OutboundOrder.findByPk.mockResolvedValue(null);

      await expect(deleteOutboundOrderService(999, transaction))
        .rejects.toThrow('出库单不存在');
    });
  });
}); 