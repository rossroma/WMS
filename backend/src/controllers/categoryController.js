const Category = require('../models/Category');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// 获取分类树
exports.getCategoryTree = async (req, res, next) => {
  try {
    console.log('开始获取分类树...');
    const categories = await Category.findAll({
      order: [
        ['sort', 'ASC'],
        ['id', 'ASC']
      ]
    });

    // 构建分类树
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          id: item.id,
          name: item.name,
          parentId: item.parentId,
          sort: item.sort,
          children: buildTree(items, item.id)
        }));
    };

    const tree = buildTree(categories);
    
    res.json({ 
      status: 'success',
      message: '获取分类树成功',
      data: tree 
    });
  } catch (error) {
    console.error('getCategoryTree 详细错误:', error);
    console.error('错误堆栈:', error.stack);
    console.error('错误名称:', error.name);
    console.error('错误消息:', error.message);
    if (error.sql) {
      console.error('SQL 错误:', error.sql);
    }
    next(new AppError('获取分类失败', 500));
  }
};

// 创建分类
exports.createCategory = async (req, res, next) => {
  try {
    const { name, parentId } = req.body;

    // 如果指定了父分类，检查父分类的层级
    let level = 1;
    if (parentId) {
      const parentCategory = await Category.findByPk(parentId);
      if (!parentCategory) {
        return next(new AppError('父分类不存在', 400));
      }
      if (parentCategory.level >= 3) {
        return next(new AppError('最多只能创建三级分类', 400));
      }
      level = parentCategory.level + 1;
    }

    // 自动计算排序值：同级分类的最大排序值 + 1
    const maxSort = await Category.max('sort', {
      where: {
        parentId: parentId || null
      }
    });
    const sort = (maxSort || 0) + 1;

    const category = await Category.create({
      name,
      parentId,
      level,
      sort
    });

    res.status(201).json({
      status: 'success',
      message: '分类创建成功',
      data: category
    });
  } catch (error) {
    console.error('createCategory 详细错误:', error);
    next(new AppError('创建分类失败', 500));
  }
};

// 更新分类
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return next(new AppError('分类名称不能为空', 400));
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return next(new AppError('分类不存在', 404));
    }

    await category.update({ name });
    res.json({
      status: 'success',
      message: '分类更新成功',
      data: category
    });
  } catch (error) {
    console.error('updateCategory 详细错误:', error);
    next(new AppError('更新分类失败', 500));
  }
};

// 删除分类
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 检查是否有子分类
    const hasChildren = await Category.findOne({
      where: { parentId: id }
    });

    if (hasChildren) {
      return next(new AppError('请先删除子分类', 400));
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return next(new AppError('分类不存在', 404));
    }

    await category.destroy();
    res.status(200).json({
      status: 'success',
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('deleteCategory 详细错误:', error);
    next(new AppError('删除分类失败', 500));
  }
};

// 批量更新分类排序
exports.batchUpdateSort = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      await t.rollback();
      return next(new AppError('无效的请求数据', 400));
    }

    // 批量更新排序
    for (const item of items) {
      await Category.update(
        { sort: item.sort },
        { 
          where: { id: item.id },
          transaction: t
        }
      );
    }

    await t.commit();
    res.json({ 
      status: 'success',
      message: '排序更新成功' 
    });
  } catch (error) {
    console.error('batchUpdateSort 详细错误:', error);
    await t.rollback();
    next(new AppError('批量更新排序失败', 500));
  }
};

// 获取分类列表（扁平结构）
exports.getCategoryList = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    
    const where = {};
    if (keyword) {
      where.name = {
        [Op.like]: `%${keyword}%`
      };
    }

    const categories = await Category.findAll({
      where,
      order: [
        ['sort', 'ASC'],
        ['id', 'ASC']
      ]
    });

    res.json({
      status: 'success',
      message: '获取分类列表成功',
      data: categories
    });
  } catch (error) {
    console.error('getCategoryList 详细错误:', error);
    next(new AppError('获取分类列表失败', 500));
  }
}; 