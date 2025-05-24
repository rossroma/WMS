const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');
const { getDateRangeCondition } = require('../utils/helpers');

// 获取日志列表
exports.getLogs = async (req, res, next) => {
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

    // 读取日志内容
    const logs = await Promise.all(
      filteredFiles.map(async file => {
        const content = await fs.readFile(path.join(logDir, file), 'utf8');
        return {
          filename: file,
          content: content.split('\n').filter(Boolean).map(line => JSON.parse(line))
        };
      })
    );

    res.json({
      status: 'success',
      data: logs
    });
  } catch (error) {
    next(new AppError('获取日志失败', 500));
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