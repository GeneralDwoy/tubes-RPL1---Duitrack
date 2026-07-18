const express = require('express');

const {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} = require('../controllers/category-controller');

const authenticate = require('../middleware/auth-middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', listCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;