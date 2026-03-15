const mongoose = require('mongoose');

// Master list of all possible achievements (seeded once)
const achievementSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    category: {
      type: String,
      enum: ['steps', 'streaks', 'wins', 'social'],
      required: true,
    },
  },
  { timestamps: false }
);

// Per-user achievement unlock record
const userAchievementSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    achievement: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
    unlockedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0, min: 0, max: 1 },
  },
  { timestamps: false }
);

userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = { Achievement, UserAchievement };
