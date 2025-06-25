const { createLog } = require('../../../src/services/logService');

// Mock Log model
jest.mock('../../../src/models/Log', () => ({
  create: jest.fn()
}));

// Mock logger service
jest.mock('../../../src/services/loggerService', () => ({
  error: jest.fn()
}));

const Log = require('../../../src/models/Log');
const logger = require('../../../src/services/loggerService');

describe('LogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLog', () => {
    it('应该成功创建日志记录', async () => {
      // Arrange
      const logData = {
        userId: 1,
        username: 'testuser',
        actionType: 'LOGIN',
        module: 'AUTH',
        details: 'User logged in successfully',
        ipAddress: '127.0.0.1'
      };

      Log.create.mockResolvedValue(logData);

      // Act
      await createLog(logData);

      // Assert
      expect(Log.create).toHaveBeenCalledWith({
        userId: 1,
        username: 'testuser',
        actionType: 'LOGIN',
        module: 'AUTH',
        details: 'User logged in successfully',
        ipAddress: '127.0.0.1'
      });
    });

    it('应该处理对象类型的details', async () => {
      // Arrange
      const logData = {
        userId: 1,
        username: 'testuser',
        actionType: 'CREATE',
        module: 'PRODUCT',
        details: { productId: 123, name: 'Test Product' },
        ipAddress: '127.0.0.1'
      };

      Log.create.mockResolvedValue({});

      // Act
      await createLog(logData);

      // Assert
      expect(Log.create).toHaveBeenCalledWith({
        userId: 1,
        username: 'testuser',
        actionType: 'CREATE',
        module: 'PRODUCT',
        details: JSON.stringify({ productId: 123, name: 'Test Product' }),
        ipAddress: '127.0.0.1'
      });
    });

    it('应该处理创建日志失败的情况', async () => {
      // Arrange
      const logData = {
        userId: 1,
        username: 'testuser',
        actionType: 'LOGIN',
        module: 'AUTH'
      };

      Log.create.mockRejectedValue(new Error('Database error'));

      // Act
      await createLog(logData);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Failed to create log:', expect.any(Error));
    });

    it('应该处理缺少必要字段的情况', async () => {
      // Arrange
      const logData = {
        actionType: 'LOGIN',
        module: 'AUTH'
      };

      Log.create.mockResolvedValue({});

      // Act
      await createLog(logData);

      // Assert
      expect(Log.create).toHaveBeenCalledWith({
        userId: undefined,
        username: undefined,
        actionType: 'LOGIN',
        module: 'AUTH',
        details: undefined,
        ipAddress: undefined
      });
    });
  });
}); 