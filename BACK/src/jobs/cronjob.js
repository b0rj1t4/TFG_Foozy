const cron = require('node-cron');
const { Challenge } = require('../models/Challenge');

//             ┌────────────── second (optional)
//             │ ┌──────────── minute
//             │ │ ┌────────── hour
//             │ │ │ ┌──────── day of month
//             │ │ │ │ ┌────── month
//             │ │ │ │ │ ┌──── day of week
//             │ │ │ │ │ │
//             │ │ │ │ │ │
//             * * * * * *
cron.schedule('0 0 */23 * * *', async () => {
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

    console.log(`[CRON] Updated ${result.modifiedCount} challenges`);
  } catch (error) {
    console.error('[CRON] Error updating challenges:', error);
  }
});
