const router = require('express').Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');

const authCtrl         = require('../controllers/auth.controller');
const usersCtrl        = require('../controllers/users.controller');
const friendsCtrl      = require('../controllers/friends.controller');
const challengesCtrl   = require('../controllers/challenges.controller');
const stepsCtrl        = require('../controllers/steps.controller');
const achievementsCtrl = require('../controllers/achievements.controller');

// ── Multer (avatar + challenge cover uploads) ────────────────────────────────
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/register',
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  ],
  authCtrl.register
);

router.post('/auth/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  authCtrl.login
);

router.post('/auth/refresh', authCtrl.refresh);
router.post('/auth/logout', protect, authCtrl.logout);

// ── Users ────────────────────────────────────────────────────────────────────
router.get('/users/me', protect, usersCtrl.getMe);

router.put('/users/me', protect,
  upload.single('avatar'),
  [
    body('name').optional().trim().notEmpty(),
    body('avatarColor').optional().isIn(['primary', 'success', 'tertiary', 'warning', 'danger']),
  ],
  usersCtrl.updateMe
);

router.get('/users/search', protect, usersCtrl.searchUsers);
router.get('/users/:id', protect, usersCtrl.getUserById);

// ── Friends ──────────────────────────────────────────────────────────────────
router.get('/friends', protect, friendsCtrl.getFriends);
router.get('/friends/:id', protect, friendsCtrl.getFriendProfile);
router.post('/friends/:id', protect, friendsCtrl.addFriend);
router.delete('/friends/:id', protect, friendsCtrl.removeFriend);

// ── Challenges ───────────────────────────────────────────────────────────────
router.get('/challenges', protect, challengesCtrl.getChallenges);

router.post('/challenges', protect,
  upload.single('cover'),
  [
    body('title').trim().notEmpty().isLength({ max: 50 }),
    body('targetSteps').isInt({ min: 1 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
  ],
  challengesCtrl.createChallenge
);

router.get('/challenges/:id', protect, challengesCtrl.getChallengeById);
router.put('/challenges/:id', protect, challengesCtrl.updateChallenge);
router.delete('/challenges/:id', protect, challengesCtrl.deleteChallenge);
router.post('/challenges/:id/join', protect, challengesCtrl.joinChallenge);
router.get('/challenges/:id/ranking', protect, challengesCtrl.getRanking);

// ── Steps ────────────────────────────────────────────────────────────────────
router.post('/steps', protect,
  [
    body('steps').isInt({ min: 0 }).withMessage('Steps must be a non-negative integer'),
    body('date').optional().isISO8601(),
  ],
  stepsCtrl.logSteps
);

router.get('/steps/me', protect, stepsCtrl.getMySteps);
router.get('/steps/:userId', protect, stepsCtrl.getUserSteps);

// ── Achievements ─────────────────────────────────────────────────────────────
router.get('/achievements', protect, achievementsCtrl.getAllAchievements);
router.get('/achievements/me', protect, achievementsCtrl.getMyAchievements);
router.get('/achievements/:userId', protect, achievementsCtrl.getUserAchievements);

module.exports = router;
