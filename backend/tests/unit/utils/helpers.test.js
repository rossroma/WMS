const { generateRandomString, buildTree } = require('../../../src/utils/helpers');

describe('Helpers Utils', () => {
  describe('generateRandomString', () => {
    it('应该生成指定长度的随机字符串', () => {
      const length = 10;
      const result = generateRandomString(length);
      
      expect(result).toHaveLength(length);
      expect(typeof result).toBe('string');
    });

    it('应该生成默认长度为8的随机字符串', () => {
      const result = generateRandomString();
      
      expect(result).toHaveLength(8);
      expect(typeof result).toBe('string');
    });

    it('应该只包含字母和数字', () => {
      const result = generateRandomString(20);
      const regex = /^[A-Za-z0-9]+$/;
      
      expect(regex.test(result)).toBe(true);
    });

    it('每次调用应该生成不同的字符串', () => {
      const result1 = generateRandomString(10);
      const result2 = generateRandomString(10);
      
      expect(result1).not.toBe(result2);
    });

    it('应该处理长度为0的情况', () => {
      const result = generateRandomString(0);
      
      expect(result).toBe('');
    });
  });

  describe('buildTree', () => {
    it('应该构建正确的树形结构', () => {
      const data = [
        { id: 1, name: '根节点1', parentId: null },
        { id: 2, name: '子节点1', parentId: 1 },
        { id: 3, name: '子节点2', parentId: 1 },
        { id: 4, name: '根节点2', parentId: null },
        { id: 5, name: '孙节点1', parentId: 2 }
      ];

      const result = buildTree(data);

      expect(result).toHaveLength(2); // 两个根节点
      expect(result[0].children).toHaveLength(2); // 根节点1有两个子节点
      expect(result[0].children[0].children).toHaveLength(1); // 子节点1有一个孙节点
      expect(result[1].children).toHaveLength(0); // 根节点2没有子节点
    });

    it('应该使用自定义字段名', () => {
      const data = [
        { code: 'A', title: '节点A', pid: null },
        { code: 'B', title: '节点B', pid: 'A' },
        { code: 'C', title: '节点C', pid: 'A' }
      ];

      const result = buildTree(data, 'code', 'pid', 'items');

      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(2);
      expect(result[0].items[0].title).toBe('节点B');
      expect(result[0].items[1].title).toBe('节点C');
    });

    it('应该处理空数组', () => {
      const result = buildTree([]);

      expect(result).toEqual([]);
    });

    it('应该处理没有父子关系的数据', () => {
      const data = [
        { id: 1, name: '节点1', parentId: null },
        { id: 2, name: '节点2', parentId: null },
        { id: 3, name: '节点3', parentId: null }
      ];

      const result = buildTree(data);

      expect(result).toHaveLength(3);
      result.forEach(node => {
        expect(node.children).toHaveLength(0);
      });
    });

    it('应该处理循环引用的情况', () => {
      const data = [
        { id: 1, name: '节点1', parentId: 2 },
        { id: 2, name: '节点2', parentId: 1 }
      ];

      const result = buildTree(data);

      expect(result).toHaveLength(0); // 没有根节点
    });

    it('应该保留原始数据的其他属性', () => {
      const data = [
        { id: 1, name: '根节点', parentId: null, type: 'root', level: 1 },
        { id: 2, name: '子节点', parentId: 1, type: 'child', level: 2 }
      ];

      const result = buildTree(data);

      expect(result[0].type).toBe('root');
      expect(result[0].level).toBe(1);
      expect(result[0].children[0].type).toBe('child');
      expect(result[0].children[0].level).toBe(2);
    });
  });
}); 