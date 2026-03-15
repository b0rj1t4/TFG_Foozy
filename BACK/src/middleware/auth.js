const { verifyAccess } = require('../utils/jwt');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const payload = verifyAccess(auth.split(' ')[1]);
    req.user = await User.findById(payload.sub);

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { protect };
