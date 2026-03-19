const { Achievement, UserAchievement } = require('../models/Achievement');

// GET /achievements — full catalogue with user's unlock status
const getAllAchievements = async (req, res, next) => {
  try {
    const [all, unlocked] = await Promise.all([
      Achievement.find().sort({ category: 1 }),
      UserAchievement.find({ user: req.user._id }).populate('achievement'),
    ]);

    const unlockedMap = new Map(
      unlocked.map((ua) => [ua.achievement._id.toString(), ua]),
    );

    const result = all.map((a) => {
      const ua = unlockedMap.get(a._id.toString());
      return {
        ...a.toJSON(),
        status: ua ? 'unlocked' : 'locked',
        unlockedAt: ua?.unlockedAt ?? null,
        progress: ua?.progress ?? 0,
      };
    });

    res.json({ achievements: result });
  } catch (err) {
    next(err);
  }
};

// GET /achievements/me — only what the caller has unlocked
const getMyAchievements = async (req, res, next) => {
  try {
    const unlocked = await UserAchievement.find({ user: req.user._id })
      .populate('achievement')
      .sort({ unlockedAt: -1 });

    res.json({ achievements: unlocked });
  } catch (err) {
    next(err);
  }
};

// GET /achievements/:userId — a friend's unlocked achievements
const getUserAchievements = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // const isFriend = req.user.friends.map(f => f.toString()).includes(userId);
    // if (!isFriend && userId !== req.user._id.toString()) {
    //   return res.status(403).json({ message: 'Not a friend' });
    // }

    const [all, unlocked] = await Promise.all([
      Achievement.find().sort({ category: 1 }),
      UserAchievement.find({ user: userId }).populate('achievement'),
    ]);

    const unlockedMap = new Map(
      unlocked.map((ua) => [ua.achievement._id.toString(), ua]),
    );

    const result = all.map((a) => {
      const ua = unlockedMap.get(a._id.toString());
      return {
        ...a.toJSON(),
        status: ua ? 'unlocked' : 'locked',
        unlockedAt: ua?.unlockedAt ?? null,
      };
    });

    res.json({ achievements: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllAchievements, getMyAchievements, getUserAchievements };
