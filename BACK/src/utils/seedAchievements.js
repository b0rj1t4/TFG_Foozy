require('dotenv').config();
const mongoose = require('mongoose');
const { Achievement } = require('../models/Achievement');

const ACHIEVEMENTS = [
  // Steps
  { key: 'first_steps',     title: 'First Steps',      description: 'Walk 1,000 steps in a day',            icon: 'walk-outline',         category: 'steps'   },
  { key: 'daily_dasher',    title: 'Daily Dasher',     description: 'Reach 10,000 steps in a single day',   icon: 'footsteps-outline',    category: 'steps'   },
  { key: 'century_club',    title: 'Century Club',     description: 'Accumulate 100,000 total steps',        icon: 'footsteps-outline',    category: 'steps'   },
  { key: 'marathon_walker', title: 'Marathon Walker',  description: 'Walk a marathon distance (~56,000)',    icon: 'ribbon-outline',       category: 'steps'   },
  { key: 'million_mover',   title: 'Million Mover',    description: 'Accumulate 1,000,000 total steps',     icon: 'star-outline',         category: 'steps'   },
  { key: 'ultramarathon',   title: 'Ultramarathon',    description: 'Walk 100km worth of steps in a week',  icon: 'star-outline',         category: 'steps'   },
  // Streaks
  { key: 'streak_3',        title: 'Just Getting Started', description: '3-day activity streak',            icon: 'flame-outline',        category: 'streaks' },
  { key: 'streak_7',        title: 'Week Warrior',     description: '7-day activity streak',                icon: 'flame-outline',        category: 'streaks' },
  { key: 'streak_14',       title: 'Two-Week Titan',   description: '14-day activity streak',               icon: 'flame-outline',        category: 'streaks' },
  { key: 'streak_30',       title: 'Monthly Grind',    description: '30-day activity streak',               icon: 'thunderstorm-outline', category: 'streaks' },
  { key: 'streak_100',      title: 'Unstoppable',      description: '100-day activity streak',              icon: 'star-outline',         category: 'streaks' },
  // Wins
  { key: 'podium',          title: 'Podium Finish',    description: 'Finish top 3 in any challenge',        icon: 'podium-outline',       category: 'wins'    },
  { key: 'gold_rush',       title: 'Gold Rush',        description: 'Win 1st place in a challenge',         icon: 'trophy-outline',       category: 'wins'    },
  { key: 'hat_trick',       title: 'Hat Trick',        description: 'Win 3 challenges',                     icon: 'trophy-outline',       category: 'wins'    },
  { key: 'comeback_kid',    title: 'Comeback Kid',     description: 'Finish top 10 after being ranked 50+', icon: 'ribbon-outline',       category: 'wins'    },
  { key: 'contender_5',     title: 'Consistent Contender', description: 'Complete 5 challenges',            icon: 'ribbon-outline',       category: 'wins'    },
  // Social
  { key: 'team_player',     title: 'Team Player',      description: 'Join your first group challenge',      icon: 'people-outline',       category: 'social'  },
  { key: 'hype_machine',    title: 'Hype Machine',     description: 'Most active member in a group',        icon: 'heart-outline',        category: 'social'  },
  { key: 'social_butterfly',title: 'Social Butterfly', description: 'Participate in 3 group challenges',    icon: 'people-outline',       category: 'social'  },
  { key: 'legend',          title: 'Legend',           description: 'Top leaderboard in a group of 100+',   icon: 'star-outline',         category: 'social'  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const data of ACHIEVEMENTS) {
    await Achievement.findOneAndUpdate(
      { key: data.key },
      data,
      { upsert: true, new: true }
    );
  }

  console.log(`Seeded ${ACHIEVEMENTS.length} achievements`);
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
