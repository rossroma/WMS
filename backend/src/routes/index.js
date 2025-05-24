const express = require('express');
const router = express.Router();

// 示例路由
router.get('/status', (req, res) => {
  res.json({ status: 'API is running' });
});

module.exports = router; 