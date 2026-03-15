const { validationResult } = require('express-validator');
const User = require('../models/User');

const getMe = (req, res) => {
  res.json({ user: req.user });
};

const updateMe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowed = ['name', 'avatarColor'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    });

    if (req.file) {
      // In production, upload to S3/Cloudinary and store the URL
      req.user.avatarUrl = `/uploads/${req.file.filename}`;
    }

    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters' });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name email avatarInitials avatarColor avatarUrl stepsToday')
      .limit(20);

    // Mark which ones are already friends
    const friendIds = req.user.friends.map(id => id.toString());
    const result = users.map(u => ({
      ...u.toJSON(),
      isFriend: friendIds.includes(u._id.toString()),
    }));

    res.json({ users: result });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email avatarInitials avatarColor avatarUrl stepsToday totalSteps')
      .populate('friends', 'name avatarInitials avatarColor stepsToday');

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isFriend = req.user.friends.map(id => id.toString()).includes(user._id.toString());
    res.json({ user: { ...user.toJSON(), isFriend } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe, searchUsers, getUserById };
