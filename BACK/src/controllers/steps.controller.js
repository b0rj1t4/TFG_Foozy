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

    // Parse yyyy-MM-dd as LOCAL midnight, not UTC midnight.
    // new Date('2026-03-23') parses as UTC 00:00 which becomes the previous
    // day for users behind UTC. Splitting and using the Date constructor
    // with individual parts creates local midnight instead.
    let day;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split('-').map(Number);
      day = new Date(y, m - 1, d, 0, 0, 0, 0); // local midnight
    } else {
      day = new Date();
      day.setHours(0, 0, 0, 0);
    }
    // Upsert: one record per user per day
    const record = await Step.findOneAndUpdate(
      { user: req.user._id, date: day },
      { steps },
      { upsert: true, new: true },
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
        { $set: { 'participants.$.steps': agg?.total ?? 0 } },
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
    const { period } = req.query; // today | week | month | year

    const from = fromDateForPeriod(period);

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

    const isFriend = req.user.friends.map((f) => f.toString()).includes(userId);

    const from = fromDateForPeriod(period);

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

// Shared helper — returns the `from` date for a given period string
const fromDateForPeriod = (period) => {
  const now = new Date();
  if (period === 'week') {
    const from = new Date(now);
    from.setDate(now.getDate() - 6); // last 7 days including today
    from.setHours(0, 0, 0, 0);
    return from;
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === 'year') {
    return new Date(now.getFullYear(), 0, 1);
  }
  // default: today
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  return from;
};

module.exports = { logSteps, getMySteps, getUserSteps };
