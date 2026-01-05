const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Video = require('../models/Video');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer setup for uploads
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video uploads are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit for MVP
});

// Create video (upload or external URL)
router.post('/', auth, upload.single('video'), async (req, res) => {
  try {
    const { title, description, externalUrl } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!req.file && !externalUrl) {
      return res.status(400).json({ message: 'Either video file or externalUrl is required' });
    }

    const video = await Video.create({
      ownerId: req.user.id,
      title,
      description,
      filePath: req.file ? `/uploads/${req.file.filename}` : undefined,
      externalUrl: externalUrl || undefined,
    });

    res.status(201).json({ video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List videos (public)
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find({ visibility: 'public' })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('_id title description filePath externalUrl views createdAt ownerId');

    res.json({ videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single video
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json({ video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stream video file
router.get('/:id/stream', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video || !video.filePath) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const fullPath = path.join(__dirname, '..', '..', video.filePath.replace(/^\/+/, ''));
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File missing on server' });
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(fullPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(fullPath).pipe(res);
    }

    // Increment views asynchronously
    Video.findByIdAndUpdate(video._id, { $inc: { views: 1 } }).catch(() => {});
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Increment view count (for external URLs)
router.post('/:id/view', async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json({ video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List videos by user
router.get('/user/:userId', async (req, res) => {
  try {
    const videos = await Video.find({ ownerId: req.params.userId, visibility: 'public' })
      .sort({ createdAt: -1 })
      .select('_id title description filePath externalUrl views createdAt ownerId');

    res.json({ videos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
