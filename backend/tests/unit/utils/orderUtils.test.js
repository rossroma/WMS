const {
  generateOrderNo,
  generatePurchaseOrderNo,
  generateInboundOrderNo,
  generateOutboundOrderNo,
  generateStocktakingOrderNo,
  OrderNoPrefix
} = require('../../../src/utils/orderUtils');

describe('OrderUtils', () => {
  describe('generateOrderNo', () => {
    it('应该生成包含正确前缀的订单号', () => {
      const prefix = 'TEST';
      const orderNo = generateOrderNo(prefix);
      
      expect(orderNo).toMatch(/^TEST\d{14}$/);
      expect(orderNo.startsWith(prefix)).toBe(true);
    });

    it('应该生成包含当前日期的订单号', () => {
      const prefix = 'TEST';
      const orderNo = generateOrderNo(prefix);
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const expectedDatePart = `${year}${month}${day}`;
      
      expect(orderNo).toContain(expectedDatePart);
    });

    it('应该包含时间戳用于唯一性', () => {
      const prefix = 'TEST';
      const orderNo = generateOrderNo(prefix);
      
      // 验证订单号格式：前缀 + 8位日期 + 6位时间戳
      expect(orderNo).toMatch(/^TEST\d{14}$/);
      
      // 验证时间戳部分存在（最后6位）
      const timestamp = orderNo.slice(-6);
      expect(timestamp).toMatch(/^\d{6}$/);
      expect(parseInt(timestamp)).toBeGreaterThan(0);
    });

    it('应该处理空前缀', () => {
      const orderNo = generateOrderNo('');
      
      expect(orderNo).toMatch(/^\d{14}$/);
    });

    it('应该处理特殊字符前缀', () => {
      const prefix = 'ORD-';
      const orderNo = generateOrderNo(prefix);
      
      expect(orderNo.startsWith(prefix)).toBe(true);
      expect(orderNo).toMatch(/^ORD-\d{14}$/);
    });
  });

  describe('generatePurchaseOrderNo', () => {
    it('应该生成以PO开头的采购订单号', () => {
      const orderNo = generatePurchaseOrderNo();
      
      expect(orderNo.startsWith('PO')).toBe(true);
      expect(orderNo).toMatch(/^PO\d{14}$/);
    });


  });

  describe('generateInboundOrderNo', () => {
    it('应该生成以IN开头的入库单号', () => {
      const orderNo = generateInboundOrderNo();
      
      expect(orderNo.startsWith('IN')).toBe(true);
      expect(orderNo).toMatch(/^IN\d{14}$/);
    });


  });

  describe('generateOutboundOrderNo', () => {
    it('应该生成以OUT开头的出库单号', () => {
      const orderNo = generateOutboundOrderNo();
      
      expect(orderNo.startsWith('OUT')).toBe(true);
      expect(orderNo).toMatch(/^OUT\d{14}$/);
    });


  });

  describe('generateStocktakingOrderNo', () => {
    it('应该生成以ST开头的盘点单号', () => {
      const orderNo = generateStocktakingOrderNo();
      
      expect(orderNo.startsWith('ST')).toBe(true);
      expect(orderNo).toMatch(/^ST\d{14}$/);
    });


  });

  describe('OrderNoPrefix', () => {
    it('应该包含所有预定义的前缀', () => {
      expect(OrderNoPrefix.PURCHASE).toBe('PO');
      expect(OrderNoPrefix.INBOUND).toBe('IN');
      expect(OrderNoPrefix.OUTBOUND).toBe('OUT');
      expect(OrderNoPrefix.STOCKTAKING).toBe('ST');
    });

    it('应该与生成方法使用的前缀一致', () => {
      const purchaseOrderNo = generatePurchaseOrderNo();
      const inboundOrderNo = generateInboundOrderNo();
      const outboundOrderNo = generateOutboundOrderNo();
      const stocktakingOrderNo = generateStocktakingOrderNo();

      expect(purchaseOrderNo.startsWith(OrderNoPrefix.PURCHASE)).toBe(true);
      expect(inboundOrderNo.startsWith(OrderNoPrefix.INBOUND)).toBe(true);
      expect(outboundOrderNo.startsWith(OrderNoPrefix.OUTBOUND)).toBe(true);
      expect(stocktakingOrderNo.startsWith(OrderNoPrefix.STOCKTAKING)).toBe(true);
    });
  });

  describe('订单号格式验证', () => {
    it('所有订单号应该包含14位数字（YYYYMMDD + 6位时间戳）', () => {
      const orderNos = [
        generatePurchaseOrderNo(),
        generateInboundOrderNo(),
        generateOutboundOrderNo(),
        generateStocktakingOrderNo()
      ];

      orderNos.forEach(orderNo => {
        // 去掉前缀后应该是14位数字
        const numberPart = orderNo.replace(/^[A-Z]+/, '');
        expect(numberPart).toMatch(/^\d{14}$/);
        expect(numberPart).toHaveLength(14);
      });
    });

    it('不同类型订单号应该有不同前缀', () => {
      const purchaseOrderNo = generatePurchaseOrderNo();
      const inboundOrderNo = generateInboundOrderNo();
      const outboundOrderNo = generateOutboundOrderNo();
      const stocktakingOrderNo = generateStocktakingOrderNo();
      
      expect(purchaseOrderNo.startsWith('PO')).toBe(true);
      expect(inboundOrderNo.startsWith('IN')).toBe(true);
      expect(outboundOrderNo.startsWith('OUT')).toBe(true);
      expect(stocktakingOrderNo.startsWith('ST')).toBe(true);
      
      // 验证都包含相同的日期部分（8位）
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      
      expect(purchaseOrderNo).toContain(dateStr);
      expect(inboundOrderNo).toContain(dateStr);
      expect(outboundOrderNo).toContain(dateStr);
      expect(stocktakingOrderNo).toContain(dateStr);
    });

    it('订单号中的日期部分应该有效', () => {
      const orderNo = generatePurchaseOrderNo();
      const numberPart = orderNo.replace(/^PO/, '');
      const datePart = numberPart.substring(0, 8); // YYYYMMDD
      
      const year = parseInt(datePart.substring(0, 4));
      const month = parseInt(datePart.substring(4, 6));
      const day = parseInt(datePart.substring(6, 8));
      
      expect(year).toBeGreaterThanOrEqual(2020);
      expect(year).toBeLessThanOrEqual(2100);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });
  });
}); 