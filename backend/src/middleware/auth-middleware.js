const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Token autentikasi tidak tersedia',
    });
  }

  const token = authorization.slice(7);

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret is not configured');
    }

    req.user = jwt.verify(token, secret);
    return next();
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return res.status(401).json({
      status: 'error',
      message: 'Token autentikasi tidak valid atau sudah kedaluwarsa',
    });
  }
}

module.exports = authenticate;