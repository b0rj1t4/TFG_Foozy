require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { logSteps } = require('../controllers/steps.controller');

const callLogSteps = (userId, steps, date) =>
  new Promise((resolve, reject) => {
    const req = {
      user: { _id: userId },
      body: { steps, date },
    };

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        if (this.statusCode >= 400) {
          return reject(
            new Error(payload?.message || 'logSteps returned an error'),
          );
        }
        return resolve(payload);
      },
    };

    const next = (err) => {
      if (err) return reject(err);
      return resolve();
    };

    logSteps(req, res, next).catch(reject);
  });

const seedSteps = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const users = await User.find().select('_id');
    if (users.length === 0) {
      console.log('No users found. Please seed users first.');
      return;
    }

    const stepsData = [];

    users.forEach((user) => {
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        stepsData.push({
          user: user._id,
          date,
          steps: Math.floor(Math.random() * 10000) + 1, // Random steps between 1 and 10000
        });
      }
    });

    for (const step of stepsData) {
      await callLogSteps(step.user, step.steps, step.date);
    }

    console.log('Steps seeded successfully');
  } catch (err) {
    console.error('Error seeding steps:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedSteps().catch((err) => {
  console.error('Error in seedSteps:', err);
  process.exit(1);
});
