const { validationResult } = require('express-validator');
const Challenge = require('../models/Challenge');

const getChallenges = async (req, res, next) => {
  try {
    const { status, joined } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (joined === 'true') filter['participants.user'] = req.user._id;

    const challenges = await Challenge.find(filter)
      .populate('createdBy', 'name avatarInitials avatarColor')
      .sort({ createdAt: -1 });

    // Attach caller's own steps to each challenge
    const result = challenges.map(c => {
      const me = c.participants.find(p => p.user.toString() === req.user._id.toString());
      return {
        ...c.toJSON(),
        mySteps: me?.steps ?? null,
        myRank: me
          ? [...c.participants]
              .sort((a, b) => b.steps - a.steps)
              .findIndex(p => p.user.toString() === req.user._id.toString()) + 1
          : null,
        joined: !!me,
      };
    });

    res.json({ challenges: result });
  } catch (err) {
    next(err);
  }
};

const createChallenge = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, targetSteps, startDate, endDate } = req.body;

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const challenge = await Challenge.create({
      title,
      description,
      targetSteps,
      startDate,
      endDate,
      coverUrl: req.file ? `/uploads/${req.file.filename}` : req.body.coverUrl ?? null,
      createdBy: req.user._id,
      participants: [{ user: req.user._id, steps: 0 }],
    });

    res.status(201).json({ challenge });
  } catch (err) {
    next(err);
  }
};

const getChallengeById = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('createdBy', 'name avatarInitials avatarColor')
      .populate('participants.user', 'name avatarInitials avatarColor stepsToday');

    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    res.json({ challenge });
  } catch (err) {
    next(err);
  }
};

const updateChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    if (challenge.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not the challenge owner' });
    }

    const allowed = ['title', 'description', 'targetSteps', 'startDate', 'endDate'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) challenge[field] = req.body[field];
    });

    await challenge.save();
    res.json({ challenge });
  } catch (err) {
    next(err);
  }
};

const deleteChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    if (challenge.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not the challenge owner' });
    }

    await challenge.deleteOne();
    res.json({ message: 'Challenge deleted' });
  } catch (err) {
    next(err);
  }
};

const joinChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    if (challenge.status === 'completed') {
      return res.status(400).json({ message: 'Challenge already completed' });
    }

    const already = challenge.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );
    if (already) return res.status(409).json({ message: 'Already joined' });

    challenge.participants.push({ user: req.user._id, steps: 0 });
    await challenge.save();

    res.json({ message: 'Joined challenge' });
  } catch (err) {
    next(err);
  }
};

const getRanking = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id).populate(
      'participants.user',
      'name avatarInitials avatarColor'
    );

    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const ranking = [...challenge.participants]
      .sort((a, b) => b.steps - a.steps)
      .map((p, i) => ({
        rank: i + 1,
        user: p.user,
        steps: p.steps,
        pct: Math.min(100, Math.round((p.steps / challenge.targetSteps) * 100)),
        isMe: p.user._id.toString() === req.user._id.toString(),
      }));

    res.json({ ranking });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getChallenges,
  createChallenge,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  getRanking,
};
