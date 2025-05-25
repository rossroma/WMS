const { Message, MessageType } = require('../models/Message');
const { Op } = require('sequelize');
const logger = require('./loggerService');

class MessageService {
  /**
   * 创建消息
   * @param {Object} messageData 消息数据
   * @returns {Promise<Object>} 创建的消息
   */
  async createMessage(messageData) {
    try {
      const {
        content,
        type,
        userId,
        relatedId = null
      } = messageData;

      const message = await Message.create({
        content,
        type,
        userId,
        relatedId,
        isRead: false
      });

      logger.info(`消息创建成功: ${message.id}`);
      return message;
    } catch (error) {
      logger.error('创建消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取消息列表
   * @param {Object} params 查询参数
   * @param {number} currentUserId 当前登录用户ID
   * @returns {Promise<Object>} 分页消息列表
   */
  async getMessages(params, currentUserId) {
    try {
      const {
        page = 1,
        pageSize = 20,
        type = null,
        isRead = null,
        startDate = null,
        endDate = null
      } = params;

      const whereClause = {};

      // 添加当前用户ID筛选条件
      if (currentUserId) {
        whereClause.userId = currentUserId;
      }

      // 添加其他筛选条件
      if (type) whereClause.type = type;
      if (isRead !== null && isRead !== '' && isRead !== undefined) {
        whereClause.isRead = isRead === 'true';
      }
      
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const offset = (page - 1) * pageSize;
      const { count, rows } = await Message.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: parseInt(pageSize),
        offset: offset
      });

      return {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      logger.error('获取消息列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取未读消息列表
   * @param {number} currentUserId 当前登录用户ID
   * @returns {Promise<Array>} 未读消息列表
   */
  async getUnreadMessages(currentUserId) {
    try {
      const whereClause = { isRead: false };
      
      // 添加当前用户ID筛选条件
      if (currentUserId) {
        whereClause.userId = currentUserId;
      }

      const messages = await Message.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      return messages;
    } catch (error) {
      logger.error('获取未读消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取未读消息数量
   * @param {number} currentUserId 当前登录用户ID
   * @returns {Promise<number>} 未读消息数量
   */
  async getUnreadCount(currentUserId) {
    try {
      const whereClause = { isRead: false };
      
      // 添加当前用户ID筛选条件
      if (currentUserId) {
        whereClause.userId = currentUserId;
      }

      const count = await Message.count({
        where: whereClause
      });

      return count;
    } catch (error) {
      logger.error('获取未读消息数量失败:', error);
      throw error;
    }
  }

  /**
   * 标记消息为已读
   * @param {number} messageId 消息ID
   * @param {number} currentUserId 当前登录用户ID
   * @returns {Promise<boolean>} 操作结果
   */
  async markAsRead(messageId, currentUserId) {
    try {
      const whereClause = {
        id: messageId,
        isRead: false
      };

      // 添加当前用户ID筛选条件
      if (currentUserId) {
        whereClause.userId = currentUserId;
      }

      const [affectedRows] = await Message.update(
        { isRead: true },
        { where: whereClause }
      );

      return affectedRows > 0;
    } catch (error) {
      logger.error('标记消息已读失败:', error);
      throw error;
    }
  }

  /**
   * 标记所有消息为已读
   * @param {number} currentUserId 当前登录用户ID
   * @returns {Promise<number>} 影响的行数
   */
  async markAllAsRead(currentUserId) {
    try {
      const whereClause = { isRead: false };
      
      // 添加当前用户ID筛选条件
      if (currentUserId) {
        whereClause.userId = currentUserId;
      }

      const [affectedRows] = await Message.update(
        { isRead: true },
        { where: whereClause }
      );

      return affectedRows;
    } catch (error) {
      logger.error('标记所有消息已读失败:', error);
      throw error;
    }
  }

  /**
   * 创建库存预警消息
   * @param {Object} inventory 库存对象
   * @param {Object} product 商品对象
   * @param {number} userId 用户ID
   * @param {string} relatedNo 关联单据编号（可选）
   */
  async createInventoryAlert(inventory, product, userId, relatedNo = null) {
    const finalRelatedNo = relatedNo || `INV-${String(inventory.id).padStart(6, '0')}`;
    await this.createMessage({
      content: `库存预警：商品"${product.name}"库存不足，当前库存：${inventory.quantity}，预警阈值：${product.stockAlertQuantity}`,
      type: MessageType.INVENTORY_ALERT,
      userId: userId,
      relatedId: finalRelatedNo
    });
  }

  /**
   * 创建盘盈入库消息
   * @param {Object} stocktaking 盘点对象
   * @param {Object} product 商品对象
   * @param {number} userId 用户ID
   * @param {string} inboundOrderNo 入库单号
   */
  async createStockInMessage(stocktaking, product, userId, inboundOrderNo) {
    const gainQuantity = stocktaking.actualQuantity - stocktaking.recordedQuantity;
    await this.createMessage({
      content: `盘盈入库：商品"${product.name}"盘点发现盈余${gainQuantity}件，已自动入库`,
      type: MessageType.STOCK_IN,
      userId: userId,
      relatedId: inboundOrderNo
    });
  }

  /**
   * 创建盘亏出库消息
   * @param {Object} stocktaking 盘点对象
   * @param {Object} product 商品对象
   * @param {number} userId 用户ID
   * @param {string} outboundOrderNo 出库单号
   */
  async createStockOutMessage(stocktaking, product, userId, outboundOrderNo) {
    const lossQuantity = stocktaking.recordedQuantity - stocktaking.actualQuantity;
    await this.createMessage({
      content: `盘亏出库：商品"${product.name}"盘点发现亏损${lossQuantity}件，已自动出库`,
      type: MessageType.STOCK_OUT,
      userId: userId,
      relatedId: outboundOrderNo
    });
  }

  /**
   * 清理历史消息
   * @param {number} retentionDays 保留天数
   * @returns {Promise<number>} 清理的消息数量
   */
  async cleanOldMessages(retentionDays = 90) {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - retentionDays);

      const result = await Message.destroy({
        where: {
          createdAt: {
            [Op.lt]: retentionDate
          },
          isRead: true
        }
      });

      logger.info(`清理历史消息: ${result} 条`);
      return result;
    } catch (error) {
      logger.error('清理历史消息失败:', error);
      throw error;
    }
  }
}

module.exports = new MessageService(); 