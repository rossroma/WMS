const MessageService = require('../services/messageService');
const { AppError } = require('../middleware/errorHandler');

// 获取消息列表
exports.getMessages = async (req, res, next) => {
  try {
    // 从认证中间件获取当前用户ID
    const currentUserId = req.user?.id;
    const result = await MessageService.getMessages(req.query, currentUserId);
    
    res.status(200).json({
      status: 'success',
      message: '获取消息列表成功',
      data: result
    });
  } catch (error) {
    next(new AppError('获取消息列表失败', 500));
  }
};

// 获取未读消息列表
exports.getUnreadMessages = async (req, res, next) => {
  try {
    // 从认证中间件获取当前用户ID
    const currentUserId = req.user?.id;
    const messages = await MessageService.getUnreadMessages(currentUserId);
    
    res.status(200).json({
      status: 'success',
      message: '获取未读消息成功',
      data: messages
    });
  } catch (error) {
    next(new AppError('获取未读消息失败', 500));
  }
};

// 获取未读消息数量
exports.getUnreadCount = async (req, res, next) => {
  try {
    // 从认证中间件获取当前用户ID
    const currentUserId = req.user?.id;
    const count = await MessageService.getUnreadCount(currentUserId);
    
    res.status(200).json({
      status: 'success',
      message: '获取未读消息数量成功',
      data: { count }
    });
  } catch (error) {
    next(new AppError('获取未读消息数量失败', 500));
  }
};

// 标记消息为已读
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    // 从认证中间件获取当前用户ID
    const currentUserId = req.user?.id;
    
    const success = await MessageService.markAsRead(id, currentUserId);
    
    if (!success) {
      return next(new AppError('消息不存在或已读', 404));
    }
    
    res.status(200).json({
      status: 'success',
      message: '消息已标记为已读'
    });
  } catch (error) {
    next(new AppError('标记消息已读失败', 500));
  }
};

// 标记所有消息为已读
exports.markAllAsRead = async (req, res, next) => {
  try {
    // 从认证中间件获取当前用户ID
    const currentUserId = req.user?.id;
    const affectedRows = await MessageService.markAllAsRead(currentUserId);
    
    res.status(200).json({
      status: 'success',
      message: `已标记 ${affectedRows} 条消息为已读`
    });
  } catch (error) {
    next(new AppError('标记所有消息已读失败', 500));
  }
}; 