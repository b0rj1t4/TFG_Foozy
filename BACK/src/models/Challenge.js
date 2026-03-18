const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    steps: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 200 },
    coverUrl: { type: String, default: null },
    targetSteps: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [participantSchema],
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
    },
  },
  { timestamps: true },
);

// Auto-set status based on dates
challengeSchema.pre('save', function (next) {
  const now = new Date();
  if (now < this.startDate) this.status = 'upcoming';
  else if (now > this.endDate) this.status = 'completed';
  else this.status = 'active';
});

challengeSchema.virtual('participantCount').get(function () {
  return this.participants.length;
});

module.exports = mongoose.model('Challenge', challengeSchema);
