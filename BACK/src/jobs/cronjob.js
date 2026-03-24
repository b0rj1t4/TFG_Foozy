const cron = require('node-cron');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Step = require('../models/Step');

//             ┌────────────── second (optional)
//             │ ┌──────────── minute
//             │ │ ┌────────── hour
//             │ │ │ ┌──────── day of month
//             │ │ │ │ ┌────── month
//             │ │ │ │ │ ┌──── day of week
//             │ │ │ │ │ │
//             │ │ │ │ │ │
//             * * * * * *
cron.schedule('0 0 0 * * *', async () => {
  // Every 24 hours at midnight

  try {
    const result = await Challenge.updateMany(
      {
        status: 'active',
        endDate: { $lte: new Date() },
      },
      {
        $set: { status: 'completed' },
      },
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const usersWithStepsToday = await Step.distinct('userId', {
      date: { $gte: today, $lt: tomorrow },
    });

    const result2 = await User.updateMany(
      { _id: { $nin: usersWithStepsToday } },
      {
        $set: { stepsToday: 0 },
      },
    );

    console.log(`[CRON] Updated ${result.modifiedCount} challenges`);
    console.log(`[CRON] Updated ${result2.modifiedCount} users`);
  } catch (error) {
    console.error('[CRON] Error updating challenges:', error);
  }
});
