const express = require('express');
const router = express.Router();
const { getProfile, uploadAvatar, setPresetAvatar, removeAvatar } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar: multerAvatar } = require('../middleware/upload');

router.get('/profile', authenticate, getProfile);
router.post('/avatar/upload', authenticate, multerAvatar.single('avatar'), uploadAvatar);
router.post('/avatar/preset', authenticate, setPresetAvatar);
router.delete('/avatar', authenticate, removeAvatar);

module.exports = router;
