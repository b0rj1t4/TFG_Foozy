require('dotenv').config();
const mongoose = require('mongoose');
const Step = require('../models/Step');
const User = require('../models/User');

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
          steps: Math.floor(Math.random() * 10000), // Random steps between 0 and 9999
        });
      }
    });

    await Step.insertMany(stepsData);
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
