const Step = require('../models/Step');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const { checkAchievements } = require('../services/achievements.service');

const logSteps = async (req, res, next) => {
  try {
    const { steps, date } = req.body;

    if (!steps || steps < 0) {
      return res.status(400).json({ message: 'Valid steps count required' });
    }

    const day = date ? new Date(date) : new Date();
    day.setHours(0, 0, 0, 0);

    // Upsert: one record per user per day
    const record = await Step.findOneAndUpdate(
      { user: req.user._id, date: day },
      { steps },
      { upsert: true, new: true }
    );

    // Recalculate totalSteps and stepsToday on the user
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalAgg] = await Step.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$steps' } } },
    ]);

    const todayRecord = await Step.findOne({ user: req.user._id, date: today });

    await User.findByIdAndUpdate(req.user._id, {
      totalSteps: totalAgg?.total ?? 0,
      stepsToday: todayRecord?.steps ?? 0,
    });

    // Sync steps into any active challenges the user is in
    const activeChallenges = await Challenge.find({
      'participants.user': req.user._id,
      status: 'active',
    });

    for (const challenge of activeChallenges) {
      // Sum all steps within the challenge date range
      const [agg] = await Step.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: challenge.startDate, $lte: challenge.endDate },
          },
        },
        { $group: { _id: null, total: { $sum: '$steps' } } },
      ]);

      await Challenge.updateOne(
        { _id: challenge._id, 'participants.user': req.user._id },
        { $set: { 'participants.$.steps': agg?.total ?? 0 } }
      );
    }

    // Check and unlock any earned achievements (fire-and-forget)
    checkAchievements(req.user._id).catch(console.error);

    res.json({ record });
  } catch (err) {
    next(err);
  }
};

const getMySteps = async (req, res, next) => {
  try {
    const { period } = req.query; // today | month | year

    const now = new Date();
    let from;

    if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      from = new Date(now.getFullYear(), 0, 1);
    } else {
      from = new Date();
      from.setHours(0, 0, 0, 0);
    }

    const steps = await Step.find({
      user: req.user._id,
      date: { $gte: from },
    }).sort({ date: 1 });

    const total = steps.reduce((sum, s) => sum + s.steps, 0);

    res.json({ steps, total });
  } catch (err) {
    next(err);
  }
};

const getUserSteps = async (req, res, next) => {
  try {
    const { period } = req.query;
    const { userId } = req.params;

    const isFriend = req.user.friends.map(f => f.toString()).includes(userId);
    if (!isFriend && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not a friend' });
    }

    const now = new Date();
    let from;

    if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      from = new Date(now.getFullYear(), 0, 1);
    } else {
      from = new Date();
      from.setHours(0, 0, 0, 0);
    }

    const steps = await Step.find({
      user: userId,
      date: { $gte: from },
    }).sort({ date: 1 });

    const total = steps.reduce((sum, s) => sum + s.steps, 0);

    res.json({ steps, total });
  } catch (err) {
    next(err);
  }
};

module.exports = { logSteps, getMySteps, getUserSteps };
