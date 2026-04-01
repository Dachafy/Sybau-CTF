const AdminModel = require('../models/AdminModel');

const getStats = async (req, res) => {
  try {
    const stats = await AdminModel.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await AdminModel.getAllUsers(req.query.search);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id)
      return res.status(400).json({ error: 'Cannot ban yourself' });
    const user = await AdminModel.findUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newBan = user.is_banned ? 0 : 1;
    await AdminModel.toggleBanUser(id, newBan);
    res.json({ message: newBan ? 'User banned' : 'User unbanned', is_banned: newBan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

const resetUser = async (req, res) => {
  try {
    await AdminModel.resetUserProgress(req.params.id);
    res.json({ message: 'User progress reset' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id)
      return res.status(400).json({ error: 'Cannot delete yourself' });
    await AdminModel.removeUser(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields required' });
    const id = await AdminModel.createAdminUser(username, email, password);
    res.status(201).json({ message: 'Admin created', id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'User already exists' });
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

const getChallenges = async (req, res) => {
  try {
    const challenges = await AdminModel.getAllChallenges();
    res.json({ challenges });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
};

const createChallenge = async (req, res) => {
  try {
    const { title, description, category_id, difficulty, points, flag, hint } = req.body;
    if (!title || !description || !category_id || !difficulty || !points || !flag)
      return res.status(400).json({ error: 'title, description, category, difficulty, points, flag all required' });
    const attachment_url  = req.file ? `/uploads/attachments/${req.file.filename}` : null;
    const attachment_name = req.file ? req.file.originalname : null;
    const id = await AdminModel.insertChallenge({ title, description, category_id, difficulty, points, flag, hint, attachment_url, attachment_name });
    res.status(201).json({ message: 'Challenge created', id });
  } catch (err) {
    console.error('[Admin] Create challenge:', err);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
};

const updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, difficulty, points, flag, hint, is_active } = req.body;
    const fields = [], vals = [];
    if (title)               { fields.push('title=?');       vals.push(title); }
    if (description)         { fields.push('description=?'); vals.push(description); }
    if (category_id)         { fields.push('category_id=?'); vals.push(category_id); }
    if (difficulty)          { fields.push('difficulty=?');  vals.push(difficulty); }
    if (points)              { fields.push('points=?');      vals.push(parseInt(points)); }
    if (flag)                { fields.push('flag=?');        vals.push(flag); }
    if (hint !== undefined)  { fields.push('hint=?');        vals.push(hint); }
    if (is_active !== undefined) { fields.push('is_active=?'); vals.push(is_active ? 1 : 0); }
    if (req.file) {
      fields.push('attachment_url=?', 'attachment_name=?');
      vals.push(`/uploads/attachments/${req.file.filename}`, req.file.originalname);
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    await AdminModel.updateChallenge(id, fields, vals);
    res.json({ message: 'Challenge updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update challenge' });
  }
};

const deleteChallenge = async (req, res) => {
  try {
    await AdminModel.removeChallenge(req.params.id);
    res.json({ message: 'Challenge deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await AdminModel.getAllCategories(req.query.search);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { title, icon, color, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const id = await AdminModel.insertCategory(title, icon, color, description);
    res.status(201).json({ message: 'Category created', id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Category exists' });
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await AdminModel.removeCategory(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Cannot delete — may have challenges attached' });
  }
};

const getActivity = async (req, res) => {
  try {
    const activity = await AdminModel.getRecentActivity();
    res.json({ activity });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

const getEvents = async (req, res) => {
  try {
    const events = await AdminModel.getAllEvents();
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, start_time, end_time } = req.body;
    if (!title || !start_time || !end_time)
      return res.status(400).json({ error: 'title, start_time, end_time required' });
    const id = await AdminModel.insertEvent(title, description, start_time, end_time);
    res.status(201).json({ message: 'Event created', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
};

module.exports = {
  getStats,
  getUsers, banUser, resetUser, deleteUser, createAdminUser,
  getChallenges, createChallenge, updateChallenge, deleteChallenge,
  getCategories, createCategory, deleteCategory,
  getActivity, getEvents, createEvent,
};
