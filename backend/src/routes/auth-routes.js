const express = require('express');

const {
  deleteProfilePhoto,
  login,
  me,
  register,
  updatePassword,
  updateProfile,
  updateProfilePhoto,
} = require('../controllers/auth-controller');

const authenticate = require('../middleware/auth-middleware');
const uploadProfilePhoto = require('../middleware/upload-middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.put('/me', authenticate, updateProfile);
router.put('/photo', authenticate, uploadProfilePhoto, updateProfilePhoto);
router.delete('/photo', authenticate, deleteProfilePhoto);
router.put('/password', authenticate, updatePassword);

module.exports = router;
