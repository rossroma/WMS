const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/errorHandler');

// 创建商品
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      status: 'success',
      message: '商品创建成功',
      data: product
    });
  } catch (error) {
    console.error('创建商品失败:', error);
    next(new AppError('创建商品失败', 400));
  }
};

// 获取所有商品（支持分页和搜索）
exports.getAllProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      name, 
      brand, 
      code,
      categoryId,
      supplierId
    } = req.query;

    // 构建查询条件
    const where = {};
    
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    
    if (brand) {
      where.brand = { [Op.like]: `%${brand}%` };
    }
    
    if (code) {
      where.code = { [Op.like]: `%${code}%` };
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (supplierId) {
      where.supplierId = supplierId;
    }
    
    // 计算分页参数
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 查询商品列表和总数
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        {
          model: Supplier,
          attributes: ['id', 'name']
        },
        {
          model: Category,
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 返回分页数据
    res.status(200).json({
      status: 'success',
      message: '获取商品列表成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    next(new AppError('获取商品列表失败', 500));
  }
};

// 获取单个商品
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return next(new AppError('商品不存在', 404));
    }
    
    res.status(200).json({
      status: 'success',
      message: '获取商品成功',
      data: product
    });
  } catch (error) {
    console.error('获取商品失败:', error);
    next(new AppError('获取商品失败', 500));
  }
};

// 更新商品
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return next(new AppError('商品不存在', 404));
    }
    
    await product.update(req.body);
    res.status(200).json({
      status: 'success',
      message: '商品更新成功',
      data: product
    });
  } catch (error) {
    console.error('更新商品失败:', error);
    next(new AppError('更新商品失败', 400));
  }
};

// 删除商品
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return next(new AppError('商品不存在', 404));
    }
    
    await product.destroy();
    res.status(200).json({
      status: 'success',
      message: '商品删除成功'
    });
  } catch (error) {
    console.error('删除商品失败:', error);
    next(new AppError('删除商品失败', 500));
  }
}; 