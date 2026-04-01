const UserModel = require('../models/UserModel');

const VALID_PRESETS = ['hacker1', 'hacker2', 'hacker3', 'hacker4', 'hacker5', 'hacker6', 'default'];

const getProfile = async (req, res) => {
  try {
    const user             = await UserModel.getUserProfile(req.user.id);
    const submissions      = await UserModel.getUserSubmissions(req.user.id);
    const solvedChallenges = await UserModel.getUserSolvedChallenges(req.user.id);
    res.json({ user, submissions, solvedChallenges });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/avatars/${req.file.filename}`;
    await UserModel.setUploadedAvatar(req.user.id, url);
    res.json({ message: 'Avatar updated', avatar_url: url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

const setPresetAvatar = async (req, res) => {
  try {
    const { preset } = req.body;
    if (!VALID_PRESETS.includes(preset))
      return res.status(400).json({ error: 'Invalid preset' });
    await UserModel.setPresetAvatar(req.user.id, preset);
    res.json({ message: 'Avatar updated', avatar_preset: preset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set preset' });
  }
};

const removeAvatar = async (req, res) => {
  try {
    await UserModel.clearAvatar(req.user.id);
    res.json({ message: 'Avatar removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove avatar' });
  }
};

module.exports = { getProfile, uploadAvatar, setPresetAvatar, removeAvatar };
