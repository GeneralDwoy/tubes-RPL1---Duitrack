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
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({
      status: 'error',
      message: 'Token autentikasi tidak valid atau sudah kedaluwarsa',
    });
  }
}

module.exports = authenticate;