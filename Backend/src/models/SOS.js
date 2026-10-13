const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    emergencyType: {
      type: String,
      required: [true, 'Emergency type is required'],
      enum: ['medical', 'fire', 'crime', 'accident', 'natural_disaster', 'other'],
      index: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    location: {
      address: String,
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['active', 'responding', 'resolved', 'cancelled'],
      default: 'active',
      index: true,
    },
    responders: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
        role: {
          type: String,
          enum: ['admin', 'security', 'volunteer'],
        },
      },
    ],
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolutionNotes: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

sosSchema.index({ status: 1, createdAt: -1 });
sosSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('SOS', sosSchema);
