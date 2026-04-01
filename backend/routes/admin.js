const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadAttachment } = require('../middleware/upload');
const {
  getStats, getUsers, banUser, resetUser, deleteUser,
  getChallenges, createChallenge, updateChallenge, deleteChallenge,
  getCategories, createCategory, deleteCategory,
  getActivity, getEvents, createEvent, createAdminUser
} = require('../controllers/adminController');

router.use(authenticate, requireAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/ban', banUser);
router.post('/users/:id/reset', resetUser);
router.delete('/users/:id', deleteUser);
router.post('/users/admin', createAdminUser);

router.get('/challenges', getChallenges);
router.post('/challenges', uploadAttachment.single('attachment'), createChallenge);
router.put('/challenges/:id', uploadAttachment.single('attachment'), updateChallenge);
router.delete('/challenges/:id', deleteChallenge);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/activity', getActivity);
router.get('/events', getEvents);
router.post('/events', createEvent);

module.exports = router;
