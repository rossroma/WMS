const Supplier = require('../models/Supplier');
const { Op } = require('sequelize');

// 创建供应商
exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 获取所有供应商（支持分页和搜索）
exports.getAllSuppliers = async (req, res) => {
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
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    res.status(500).json({ error: error.message });
  }
};

// 获取单个供应商
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (supplier) {
      res.status(200).json(supplier);
    } else {
      res.status(404).json({ error: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新供应商
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (supplier) {
      await supplier.update(req.body);
      res.status(200).json(supplier);
    } else {
      res.status(404).json({ error: 'Supplier not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 删除供应商
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (supplier) {
      await supplier.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 