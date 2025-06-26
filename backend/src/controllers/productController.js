const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../services/loggerService');

// 创建商品
exports.createProduct = async (req, res, next) => {
  try {
    // 自动设置创建人为当前登录用户
    const productData = {
      ...req.body,
      createdBy: req.user ? req.user.username : 'system'
    };
    
    const product = await Product.create(productData);
    res.status(201).json({
      status: 'success',
      message: '商品创建成功',
      data: product
    });
  } catch (error) {
    logger.error('创建商品失败:', error);
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
    logger.error('获取商品列表失败:', error);
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
    logger.error('获取商品失败:', error);
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
    logger.error('更新商品失败:', error);
    next(new AppError('更新商品失败', 400));
  }
};

// 获取商品选择列表（包含库存信息，用于入库单、出库单、采购单等场景）
exports.getProductsForSelect = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      productName, // 兼容前端传入的参数名
      name,
      brand, 
      code,
      categoryId,
      supplierId
    } = req.query;

    // 构建查询条件
    const where = {};
    
    // 商品名称搜索（兼容productName和name两种参数）
    const searchName = productName || name;
    if (searchName) {
      where.name = { [Op.like]: `%${searchName}%` };
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

    // 查询商品列表和总数，左连接库存表获取库存信息
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
        },
        {
          model: Inventory,
          required: false, // 左连接，即使没有库存记录也返回商品
          attributes: ['quantity']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 处理返回数据，将库存信息合并到商品信息中
    const productList = rows.map(product => {
      const productData = product.toJSON();
      return {
        id: productData.id,
        code: productData.code,
        name: productData.name,
        brand: productData.brand,
        specification: productData.specification,
        unit: productData.unit,
        purchasePrice: productData.purchasePrice,
        retailPrice: productData.retailPrice,
        currentStock: productData.Inventory ? productData.Inventory.quantity : 0, // 如果没有库存记录，默认为0
        supplierId: productData.supplierId,
        categoryId: productData.categoryId,
        Supplier: productData.Supplier,
        Category: productData.Category
      };
    });

    // 返回分页数据
    res.status(200).json({
      status: 'success',
      message: '获取商品选择列表成功',
      data: {
        list: productList,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('获取商品选择列表失败:', error);
    next(new AppError('获取商品选择列表失败', 500));
  }
};

// 删除商品
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return next(new AppError('商品不存在', 404));
    }
    
    // 检查是否存在出入库记录
    const { OrderItem } = require('../models/OrderItem');
    const { PurchaseOrderItem } = require('../models/PurchaseOrder');
    
    // 检查出入库单明细
    const orderItemCount = await OrderItem.count({
      where: { productId: req.params.id }
    });
    
    // 检查采购订单明细
    const purchaseOrderItemCount = await PurchaseOrderItem.count({
      where: { productId: req.params.id }
    });
    
    if (orderItemCount > 0 || purchaseOrderItemCount > 0) {
      return next(new AppError('该商品存在出入库记录，不允许删除', 400));
    }
    
    await product.destroy();
    res.status(200).json({
      status: 'success',
      message: '商品删除成功'
    });
  } catch (error) {
    logger.error('删除商品失败:', error);
    next(new AppError('删除商品失败', 500));
  }
}; 