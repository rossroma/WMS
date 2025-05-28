const { AppError } = require('../middleware/errorHandler');
const Log = require('../models/Log');
const { Op } = require('sequelize');

// 获取日志列表
exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, startDate, endDate, module, username, actionType } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }
    if (module) {
      whereClause.module = module;
    }
    if (username) {
      whereClause.username = { [Op.like]: `%${username}%` };
    }
    if (actionType) {
      whereClause.actionType = actionType;
    }

    const { count, rows } = await Log.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      status: 'success',
      data: rows,
      total: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('获取日志列表失败:', error);
    next(new AppError('获取日志列表失败', 500));
  }
};

// 获取可筛选的模块列表和操作类型 (可选，用于前端筛选条件的动态生成)
exports.getLogFilterOptions = async (req, res, next) => {
  try {
    const modules = await Log.findAll({
      attributes: ['module'],
      group: ['module'],
    });
    const actionTypes = await Log.findAll({
        attributes: ['actionType'],
        group: ['actionType'],
      });

    res.json({
      status: 'success',
      data: {
        modules: modules.map(item => item.module),
        actionTypes: actionTypes.map(item => item.actionType),
      }
    });
  } catch (error) {
    console.error('获取日志筛选选项失败:', error);
    next(new AppError('获取日志筛选选项失败', 500));
  }
}; 