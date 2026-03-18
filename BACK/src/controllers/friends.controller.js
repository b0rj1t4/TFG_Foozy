const User = require('../models/User');
const Challenge = require('../models/Challenge');

const getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'friends',
      'name email avatarInitials avatarColor avatarUrl stepsToday totalSteps',
    );

    res.json({ friends: user.friends });
  } catch (err) {
    next(err);
  }
};

const addFriend = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself' });
    }

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const alreadyFriend = req.user.friends
      .map((f) => f.toString())
      .includes(id);
    if (alreadyFriend) {
      return res.status(409).json({ message: 'Already friends' });
    }

    // Mutual friendship
    req.user.friends.push(id);
    target.friends.push(req.user._id);

    await Promise.all([
      req.user.save({ validateBeforeSave: false }),
      target.save({ validateBeforeSave: false }),
    ]);

    res.json({ message: 'Friend added' });
  } catch (err) {
    next(err);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const { id } = req.params;

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    req.user.friends = req.user.friends.filter((f) => f.toString() !== id);
    target.friends = target.friends.filter(
      (f) => f.toString() !== req.user._id.toString(),
    );

    await Promise.all([
      req.user.save({ validateBeforeSave: false }),
      target.save({ validateBeforeSave: false }),
    ]);

    res.json({ message: 'Friend removed' });
  } catch (err) {
    next(err);
  }
};

const getFriendProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isFriend = req.user.friends.map((f) => f.toString()).includes(id);
    if (!isFriend) return res.status(403).json({ message: 'Not a friend' });

    const friend = await User.findById(id).select(
      'name email avatarInitials avatarColor avatarUrl stepsToday totalSteps',
    );

    if (!friend) return res.status(404).json({ message: 'User not found' });

    // Shared challenges
    const shared = await Challenge.find({
      'participants.user': { $all: [req.user._id, friend._id] },
    }).select('title targetSteps startDate endDate status participants');

    const sharedFormatted = shared.map((c) => {
      const me = c.participants.find(
        (p) => p.user.toString() === req.user._id.toString(),
      );
      const them = c.participants.find((p) => p.user.toString() === id);
      return {
        id: c._id,
        title: c.title,
        targetSteps: c.targetSteps,
        status: c.status,
        endDate: c.endDate,
        startDate: c.startDate,
        mySteps: me?.steps ?? 0,
        friendSteps: them?.steps ?? 0,
      };
    });

    const friendPayload = {
      ...friend.toObject(),
      isFriend,
    };

    res.json({
      friend: friendPayload,
      sharedChallenges: sharedFormatted,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFriends, addFriend, removeFriend, getFriendProfile };
