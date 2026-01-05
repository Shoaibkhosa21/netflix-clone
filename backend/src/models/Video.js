const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    filePath: { type: String },
    externalUrl: { type: String },
    thumbnailPath: { type: String },
    visibility: { type: String, enum: ['public'], default: 'public' },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Video', videoSchema);
