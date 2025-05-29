// Mock dependencies first, before any imports
jest.mock('../../../src/models/Message', () => ({
  Message: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  MessageType: {
    INVENTORY_ALERT: 'inventory_alert',
    STOCK_IN: 'stock_in',
    STOCK_OUT: 'stock_out'
  }
}));
jest.mock('../../../src/services/loggerService', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const MessageService = require('../../../src/services/messageService');
const { Message } = require('../../../src/models/Message');
const logger = require('../../../src/services/loggerService');

describe('MessageService', () => {
  let messageService;

  beforeEach(() => {
    messageService = MessageService; // 直接使用单例，不需要new
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('应该成功创建消息', async () => {
      // Arrange
      const messageData = {
        content: 'Test message',
        type: 'info',
        userId: 1,
        relatedId: 123
      };

      const createdMessage = {
        id: 1,
        content: 'Test message',
        type: 'info',
        userId: 1,
        relatedId: 123,
        isRead: false
      };

      Message.create.mockResolvedValue(createdMessage);

      // Act
      const result = await messageService.createMessage(messageData);

      // Assert
      expect(Message.create).toHaveBeenCalledWith({
        content: 'Test message',
        type: 'info',
        userId: 1,
        relatedId: 123,
        isRead: false
      });
      expect(result).toEqual(createdMessage);
      expect(logger.info).toHaveBeenCalledWith('消息创建成功: 1');
    });

    it('应该处理创建消息失败的情况', async () => {
      // Arrange
      const messageData = {
        content: 'Test message',
        type: 'info',
        userId: 1
      };

      const error = new Error('Database error');
      Message.create.mockRejectedValue(error);

      // Act & Assert
      await expect(messageService.createMessage(messageData)).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith('创建消息失败:', error);
    });
  });

  describe('getMessages', () => {
    it('应该返回分页的消息列表', async () => {
      // Arrange
      const params = {
        page: 1,
        pageSize: 10,
        type: 'info'
      };
      const currentUserId = 1;

      const mockMessages = [
        { id: 1, content: 'Message 1', type: 'info', userId: 1 },
        { id: 2, content: 'Message 2', type: 'info', userId: 1 }
      ];

      Message.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockMessages
      });

      // Act
      const result = await messageService.getMessages(params, currentUserId);

      // Assert
      expect(Message.findAndCountAll).toHaveBeenCalledWith({
        where: { userId: 1, type: 'info' },
        order: [['createdAt', 'DESC']],
        limit: 10,
        offset: 0
      });
      expect(result).toEqual({
        list: mockMessages,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1
      });
    });

    it('应该处理日期范围筛选', async () => {
      // Arrange
      const params = {
        page: 1,
        pageSize: 10,
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };
      const currentUserId = 1;

      Message.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      // Act
      await messageService.getMessages(params, currentUserId);

      // Assert
      expect(Message.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            createdAt: expect.any(Object)
          }),
          order: [['createdAt', 'DESC']],
          limit: 10,
          offset: 0
        })
      );
    });
  });

  describe('getUnreadMessages', () => {
    it('应该返回未读消息列表', async () => {
      // Arrange
      const currentUserId = 1;
      const mockUnreadMessages = [
        { id: 1, content: 'Unread message 1', isRead: false, userId: 1 },
        { id: 2, content: 'Unread message 2', isRead: false, userId: 1 }
      ];

      Message.findAll.mockResolvedValue(mockUnreadMessages);

      // Act
      const result = await messageService.getUnreadMessages(currentUserId);

      // Assert
      expect(Message.findAll).toHaveBeenCalledWith({
        where: { isRead: false, userId: 1 },
        order: [['createdAt', 'DESC']]
      });
      expect(result).toEqual(mockUnreadMessages);
    });
  });

  describe('getUnreadCount', () => {
    it('应该返回未读消息数量', async () => {
      // Arrange
      const currentUserId = 1;
      Message.count.mockResolvedValue(5);

      // Act
      const result = await messageService.getUnreadCount(currentUserId);

      // Assert
      expect(Message.count).toHaveBeenCalledWith({
        where: { isRead: false, userId: 1 }
      });
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('应该成功标记消息为已读', async () => {
      // Arrange
      const messageId = 1;
      const currentUserId = 1;
      Message.update.mockResolvedValue([1]);

      // Act
      const result = await messageService.markAsRead(messageId, currentUserId);

      // Assert
      expect(Message.update).toHaveBeenCalledWith(
        { isRead: true },
        { where: { id: 1, isRead: false, userId: 1 } }
      );
      expect(result).toBe(true);
    });

    it('应该返回false当没有消息被更新时', async () => {
      // Arrange
      const messageId = 999;
      const currentUserId = 1;
      Message.update.mockResolvedValue([0]);

      // Act
      const result = await messageService.markAsRead(messageId, currentUserId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('应该标记所有未读消息为已读', async () => {
      // Arrange
      const currentUserId = 1;
      Message.update.mockResolvedValue([3]);

      // Act
      const result = await messageService.markAllAsRead(currentUserId);

      // Assert
      expect(Message.update).toHaveBeenCalledWith(
        { isRead: true },
        { where: { isRead: false, userId: 1 } }
      );
      expect(result).toBe(3);
    });
  });
}); 