const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 2000,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'infrastructure',
        'sanitation',
        'security',
        'noise',
        'utilities',
        'traffic',
        'other',
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'rejected'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    images: {
      type: [String],
      default: [],
    },
    location: {
      address: String,
      coordinates: {
        type: [Number],
      },
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignmentStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    adminNotes: {
      type: String,
      maxlength: 1000,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    completionImages: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

complaintSchema.index({ user: 1, status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Complaint', complaintSchema);
