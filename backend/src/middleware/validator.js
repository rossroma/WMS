const Joi = require('joi');
const { AppError } = require('./errorHandler');

// 验证请求体
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }
    next();
  };
};

// 验证查询参数
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }
    next();
  };
};

// 验证路径参数
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }
    next();
  };
};

// 通用验证模式
const schemas = {
  id: Joi.number().integer().positive().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().min(1).max(100),
  sort: Joi.string().trim().min(1).max(50),
  order: Joi.string().valid('ASC', 'DESC').default('ASC'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled'),
  type: Joi.string().valid('inbound', 'outbound', 'stocktaking'),
  quantity: Joi.number().integer().min(0),
  price: Joi.number().precision(2).min(0),
  email: Joi.string().email().trim().lowercase(),
  password: Joi.string().min(6).max(50),
  name: Joi.string().trim().min(1).max(100),
  phone: Joi.string().trim().pattern(/^[0-9-+()]{5,20}$/),
  address: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().max(500),
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().required(),
    destination: Joi.string().required(),
    filename: Joi.string().required(),
    path: Joi.string().required()
  })
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  schemas
}; 