require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDb = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const videoRoutes = require('./src/routes/videos');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static serving for uploaded files (thumbnails, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

// Connect to DB and start server
const PORT = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
