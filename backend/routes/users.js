const express = require('express');
const router = express.Router();
// FIX: import uploadAvatar controller (was missing from destructure)
const { getProfile, uploadAvatar, setPresetAvatar, removeAvatar } = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar: multerAvatar } = require('../middleware/upload');

router.get('/profile', authenticate, getProfile);

// FIX: Add the missing POST /avatar route for file upload.
//      Without this, uploaded avatars never worked even though the
//      controller + multer middleware were fully implemented.
router.post('/avatar', authenticate, multerAvatar.single('avatar'), uploadAvatar);

router.post('/avatar/preset', authenticate, setPresetAvatar);
router.delete('/avatar', authenticate, removeAvatar);

module.exports = router;