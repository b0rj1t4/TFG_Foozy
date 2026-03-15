const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    steps: { type: Number, required: true, min: 0 },
    date: {
      type: Date,
      required: true,
      default: () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },
  },
  { timestamps: true }
);

// One entry per user per day
stepSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Step', stepSchema);
