const express = require('express');
const router = express.Router();
const screenshotController = require('../controllers/screenshotController');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('screenshot'), screenshotController.uploadScreenshot);
router.get('/latest', screenshotController.getLatestScreenshot);

module.exports = router;