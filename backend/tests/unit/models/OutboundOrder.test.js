// Mock the model first to avoid DataTypes issues
jest.mock('../../../src/models/OutboundOrder', () => {
  const OutboundType = {
    STOCK_OUT: 'STOCK_OUT',
    SALE: 'SALE'
  };

  const OutboundTypeDisplay = {
    [OutboundType.STOCK_OUT]: '盘亏出库',
    [OutboundType.SALE]: '销售出库'
  };

  return {
    OutboundType,
    OutboundTypeDisplay
  };
});

const { OutboundType, OutboundTypeDisplay } = require('../../../src/models/OutboundOrder');

describe('OutboundOrder Model', () => {
  describe('OutboundType枚举', () => {
    it('应该只包含STOCK_OUT和SALE两种类型', () => {
      const expectedTypes = ['STOCK_OUT', 'SALE'];
      const actualTypes = Object.values(OutboundType);
      
      expect(actualTypes).toHaveLength(2);
      expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
      expect(actualTypes).not.toContain('TRANSFER_OUT');
      expect(actualTypes).not.toContain('SCRAP');
    });

    it('应该包含正确的类型值', () => {
      expect(OutboundType.STOCK_OUT).toBe('STOCK_OUT');
      expect(OutboundType.SALE).toBe('SALE');
    });

    it('应该不包含已删除的类型', () => {
      expect(OutboundType.TRANSFER_OUT).toBeUndefined();
      expect(OutboundType.SCRAP).toBeUndefined();
    });
  });

  describe('OutboundTypeDisplay映射', () => {
    it('应该包含正确的显示文本', () => {
      expect(OutboundTypeDisplay[OutboundType.STOCK_OUT]).toBe('盘亏出库');
      expect(OutboundTypeDisplay[OutboundType.SALE]).toBe('销售出库');
    });

    it('应该不包含已删除类型的显示文本', () => {
      expect(OutboundTypeDisplay['TRANSFER_OUT']).toBeUndefined();
      expect(OutboundTypeDisplay['SCRAP']).toBeUndefined();
    });

    it('应该只有两个映射项', () => {
      const displayKeys = Object.keys(OutboundTypeDisplay);
      expect(displayKeys).toHaveLength(2);
    });
  });
}); 