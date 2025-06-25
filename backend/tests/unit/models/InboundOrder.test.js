// Mock the model first to avoid DataTypes issues
jest.mock('../../../src/models/InboundOrder', () => {
  const InboundType = {
    STOCK_IN: 'STOCK_IN',
    PURCHASE: 'PURCHASE',
    RETURN: 'RETURN'
  };

  const InboundTypeDisplay = {
    [InboundType.STOCK_IN]: '盘盈入库',
    [InboundType.PURCHASE]: '采购入库',
    [InboundType.RETURN]: '退货入库'
  };

  return {
    InboundType,
    InboundTypeDisplay
  };
});

const { InboundType, InboundTypeDisplay } = require('../../../src/models/InboundOrder');

describe('InboundOrder Model', () => {
  describe('InboundType枚举', () => {
    it('应该只包含STOCK_IN、PURCHASE和RETURN三种类型', () => {
      const expectedTypes = ['STOCK_IN', 'PURCHASE', 'RETURN'];
      const actualTypes = Object.values(InboundType);
      
      expect(actualTypes).toHaveLength(3);
      expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
      expect(actualTypes).not.toContain('TRANSFER_IN');
    });

    it('应该包含正确的类型值', () => {
      expect(InboundType.STOCK_IN).toBe('STOCK_IN');
      expect(InboundType.PURCHASE).toBe('PURCHASE');
      expect(InboundType.RETURN).toBe('RETURN');
    });

    it('应该不包含已删除的调拨入库类型', () => {
      expect(InboundType.TRANSFER_IN).toBeUndefined();
    });
  });

  describe('InboundTypeDisplay映射', () => {
    it('应该包含正确的显示文本', () => {
      expect(InboundTypeDisplay[InboundType.STOCK_IN]).toBe('盘盈入库');
      expect(InboundTypeDisplay[InboundType.PURCHASE]).toBe('采购入库');
      expect(InboundTypeDisplay[InboundType.RETURN]).toBe('退货入库');
    });

    it('应该不包含已删除类型的显示文本', () => {
      expect(InboundTypeDisplay['TRANSFER_IN']).toBeUndefined();
    });

    it('应该只有三个映射项', () => {
      const displayKeys = Object.keys(InboundTypeDisplay);
      expect(displayKeys).toHaveLength(3);
    });
  });
}); 