const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    avatarUrl: { type: String, default: null },
    avatarInitials: { type: String },
    avatarColor: {
      type: String,
      enum: ['primary', 'success', 'tertiary', 'warning', 'danger'],
      default: 'primary',
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    stepsToday: { type: Number, default: 0 },
    totalSteps: { type: Number, default: 0 },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true },
);

// Auto-generate initials before saving
userSchema.pre('save', async function () {
  if (this.isModified('name')) {
    this.avatarInitials = this.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  // console.log('----', next, '----');

  // next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never expose password or refreshToken in responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
