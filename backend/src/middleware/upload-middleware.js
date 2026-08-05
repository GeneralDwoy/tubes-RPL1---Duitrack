const crypto = require('node:crypto');
const path = require('node:path');

const multer = require('multer');

const uploadDirectory = path.join(__dirname, '..', '..', 'uploads');
const extensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const extension = extensions[file.mimetype];
    callback(null, `profile-${req.user.idUser}-${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  fileFilter: (req, file, callback) => {
    if (!extensions[file.mimetype]) {
      callback(new Error('Foto harus menggunakan format JPG, PNG, atau WebP'));
      return;
    }
    callback(null, true);
  },
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  storage,
});

function uploadProfilePhoto(req, res, next) {
  upload.single('photo')(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran foto maksimal 2 MB'
        : error.message || 'Foto profil tidak dapat diunggah';

    return res.status(400).json({ status: 'error', message });
  });
}

module.exports = uploadProfilePhoto;
