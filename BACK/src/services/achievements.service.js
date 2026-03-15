const { Achievement, UserAchievement } = require('../models/Achievement');
const User = require('../models/User');
const Step = require('../models/Step');
const Challenge = require('../models/Challenge');

/**
 * Unlock an achievement for a user if not already unlocked.
 * Returns true if newly unlocked.
 */
const unlock = async (userId, key, progress = 1) => {
  const achievement = await Achievement.findOne({ key });
  if (!achievement) return false;

  const existing = await UserAchievement.findOne({ user: userId, achievement: achievement._id });
  if (existing) return false;

  await UserAchievement.create({ user: userId, achievement: achievement._id, progress });
  return true;
};

/**
 * Update progress on a not-yet-unlocked achievement.
 */
const updateProgress = async (userId, key, progress) => {
  const achievement = await Achievement.findOne({ key });
  if (!achievement) return;

  await UserAchievement.findOneAndUpdate(
    { user: userId, achievement: achievement._id },
    { $setOnInsert: { user: userId, achievement: achievement._id }, $set: { progress } },
    { upsert: true }
  );
};

/**
 * Run all checks after a user logs steps.
 * Call this from the steps controller after saving.
 */
const checkAchievements = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  // ── Step milestones ──────────────────────────────────────────────────────
  if (user.stepsToday >= 1000)    await unlock(userId, 'first_steps');
  if (user.stepsToday >= 10000)   await unlock(userId, 'daily_dasher');
  if (user.totalSteps >= 100000)  await unlock(userId, 'century_club');
  if (user.totalSteps >= 1000000) await unlock(userId, 'million_mover');

  // Marathon: check if any single day ever hit 56000
  const marathon = await Step.findOne({ user: userId, steps: { $gte: 56000 } });
  if (marathon) await unlock(userId, 'marathon_walker');

  // Ultramarathon: sum steps over last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [weekAgg] = await Step.aggregate([
    { $match: { user: userId, date: { $gte: weekAgo } } },
    { $group: { _id: null, total: { $sum: '$steps' } } },
  ]);
  if ((weekAgg?.total ?? 0) >= 133000) await unlock(userId, 'ultramarathon'); // ~100km

  // ── Streaks ──────────────────────────────────────────────────────────────
  const streak = await getCurrentStreak(userId);
  if (streak >= 3)   await unlock(userId, 'streak_3');
  if (streak >= 7)   await unlock(userId, 'streak_7');
  if (streak >= 14)  await unlock(userId, 'streak_14');
  if (streak >= 30)  await unlock(userId, 'streak_30');
  if (streak >= 100) await unlock(userId, 'streak_100');

  // Update in-progress streak achievements
  if (streak < 14) await updateProgress(userId, 'streak_14', streak / 14);
  if (streak < 30) await updateProgress(userId, 'streak_30', streak / 30);

  // ── Social ───────────────────────────────────────────────────────────────
  const joinedCount = await Challenge.countDocuments({ 'participants.user': userId });
  if (joinedCount >= 1) await unlock(userId, 'team_player');
  if (joinedCount >= 3) await unlock(userId, 'social_butterfly');
  else await updateProgress(userId, 'social_butterfly', joinedCount / 3);

  // ── Wins — checked separately after a challenge ends ────────────────────
  // See checkChallengeWins() below
};

/**
 * Returns the current consecutive active-day streak for a user.
 */
const getCurrentStreak = async (userId) => {
  const steps = await Step.find({ user: userId, steps: { $gt: 0 } })
    .sort({ date: -1 })
    .select('date');

  if (!steps.length) return 0;

  let streak = 1;
  for (let i = 0; i < steps.length - 1; i++) {
    const diff =
      (new Date(steps[i].date) - new Date(steps[i + 1].date)) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }

  return streak;
};

/**
 * Check win-based achievements after a challenge completes.
 * Call this from a scheduled job or when fetching a completed challenge.
 */
const checkChallengeWins = async (challengeId) => {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge || challenge.status !== 'completed') return;

  const sorted = [...challenge.participants].sort((a, b) => b.steps - a.steps);

  for (let i = 0; i < sorted.length; i++) {
    const userId = sorted[i].user;
    const rank = i + 1;

    if (rank <= 3) await unlock(userId, 'podium');
    if (rank === 1) await unlock(userId, 'gold_rush');

    // Hat trick — won 3 challenges
    const wins = await Challenge.countDocuments({
      status: 'completed',
      'participants.0.user': userId,  // top participant after sort is stored first
    });
    if (wins >= 3) await unlock(userId, 'hat_trick');

    // Contender 5 — completed 5 challenges
    const completed = await Challenge.countDocuments({
      status: 'completed',
      'participants.user': userId,
    });
    if (completed >= 5) await unlock(userId, 'contender_5');
    else await updateProgress(userId, 'contender_5', completed / 5);

    // Legend — 1st in a challenge of 100+
    if (rank === 1 && challenge.participants.length >= 100) {
      await unlock(userId, 'legend');
    }

    // Hype machine — most active (rank 1) in any group
    if (rank === 1) await unlock(userId, 'hype_machine');
  }
};

module.exports = { checkAchievements, checkChallengeWins, getCurrentStreak };
