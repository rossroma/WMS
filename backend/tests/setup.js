// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.LOG_LEVEL = 'error'; // 减少测试时的日志输出

// Mock Sequelize DataTypes
jest.mock('sequelize', () => {
  const mockModel = {
    init: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    sync: jest.fn()
  };

  return {
    Sequelize: jest.fn(),
    DataTypes: {
      INTEGER: 'INTEGER',
      STRING: jest.fn((length) => `STRING(${length || ''})`),
      TEXT: 'TEXT',
      BOOLEAN: 'BOOLEAN',
      DATE: 'DATE',
      FLOAT: 'FLOAT',
      DECIMAL: jest.fn((precision, scale) => `DECIMAL(${precision || ''},${scale || ''})`),
      ENUM: jest.fn((...values) => `ENUM(${values.join(',')})`),
      NOW: 'NOW'
    },
    Op: {
      between: 'between',
      gt: 'gt',
      gte: 'gte',
      lt: 'lt',
      lte: 'lte',
      eq: 'eq',
      ne: 'ne',
      in: 'in',
      notIn: 'notIn',
      like: 'like',
      notLike: 'notLike',
      and: 'and',
      or: 'or'
    },
    Model: mockModel
  };
});

// Mock数据库配置，避免在单元测试中连接真实数据库
jest.mock('../src/config/database', () => {
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true)
  };
  
  const mockSequelize = {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    transaction: jest.fn().mockResolvedValue(mockTransaction),
    define: jest.fn().mockReturnValue({
      init: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    }),
    models: {},
    query: jest.fn().mockResolvedValue([])
  };
  return mockSequelize;
});

// Mock logger服务
jest.mock('../src/services/loggerService', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

module.exports = {}; 