const express = require('express');

const {
  login,
  me,
  register,
  updatePassword,
  updateProfile,
} = require('../controllers/auth-controller');

const authenticate = require('../middleware/auth-middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/me', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);

module.exports = router;
