const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');
const { getDateRangeCondition } = require('../utils/helpers');
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
    next(new AppError('获取日志筛选选项失败', 500));
  }
};

// 导出日志
exports.exportLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, level } = req.query;
    const logDir = path.dirname(config.logging.file);
    
    // 读取日志目录
    const files = await fs.readdir(logDir);
    
    // 过滤日志文件
    const logFiles = files.filter(file => {
      if (level === 'error') {
        return file.startsWith('error-');
      }
      return file.startsWith('app-');
    });

    // 按日期范围过滤
    const filteredFiles = logFiles.filter(file => {
      const date = file.match(/\d{4}-\d{2}-\d{2}/)?.[0];
      if (!date) return false;
      
      if (startDate && new Date(date) < new Date(startDate)) return false;
      if (endDate && new Date(date) > new Date(endDate)) return false;
      
      return true;
    });

    // 创建临时目录
    const tempDir = path.join(logDir, 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    // 复制日志文件到临时目录
    await Promise.all(
      filteredFiles.map(file => 
        fs.copyFile(
          path.join(logDir, file),
          path.join(tempDir, file)
        )
      )
    );

    // 设置响应头
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.zip');

    // 创建zip文件并发送
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(res);
    archive.directory(tempDir, false);
    await archive.finalize();

    // 清理临时目录
    await fs.rm(tempDir, { recursive: true });
  } catch (error) {
    next(new AppError('导出日志失败', 500));
  }
}; 