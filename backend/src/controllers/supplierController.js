const Supplier = require('../models/Supplier');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/errorHandler');

// 创建供应商
exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({
      status: 'success',
      message: '供应商创建成功',
      data: supplier
    });
  } catch (error) {
    next(new AppError('创建供应商失败', 400));
  }
};

// 获取所有供应商（支持分页和搜索）
exports.getAllSuppliers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      name, 
      contactPerson, 
      creditRating 
    } = req.query;

    // 构建查询条件
    const where = {};
    
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    
    if (contactPerson) {
      where.contactPerson = { [Op.like]: `%${contactPerson}%` };
    }
    
    if (creditRating) {
      where.creditRating = creditRating;
    }

    // 计算分页参数
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 查询供应商列表和总数
    const { count, rows } = await Supplier.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // 返回分页数据
    res.status(200).json({
      status: 'success',
      message: '获取供应商列表成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(new AppError('获取供应商列表失败', 500));
  }
};

// 获取单个供应商
exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return next(new AppError('供应商不存在', 404));
    }
    
    res.status(200).json({
      status: 'success',
      message: '获取供应商成功',
      data: supplier
    });
  } catch (error) {
    next(new AppError('获取供应商失败', 500));
  }
};

// 更新供应商
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return next(new AppError('供应商不存在', 404));
    }
    
    await supplier.update(req.body);
    res.status(200).json({
      status: 'success',
      message: '供应商更新成功',
      data: supplier
    });
  } catch (error) {
    next(new AppError('更新供应商失败', 400));
  }
};

// 删除供应商
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return next(new AppError('供应商不存在', 404));
    }
    
    await supplier.destroy();
    res.status(200).json({
      status: 'success',
      message: '供应商删除成功'
    });
  } catch (error) {
    next(new AppError('删除供应商失败', 500));
  }
}; 