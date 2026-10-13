const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
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
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      enum: [
        'plumbing',
        'electrical',
        'carpentry',
        'painting',
        'cleaning',
        'gardening',
        'appliance_repair',
        'moving',
        'pest_control',
        'other',
      ],
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'quoted', 'accepted', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected'],
      default: 'open',
      index: true,
    },

    preferredDate: {
      type: Date,
    },
    location: {
      address: String,
      coordinates: {
        type: [Number],
      },
    },
    images: {
      type: [String],
      default: [],
    },
    acceptedQuotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedByAdmin: {
      type: Boolean,
      default: false,
    },
    adminTimeline: [
      {
        status: String,
        note: String,
        date: { type: Date, default: Date.now },
      },
    ],
    rejectionReason: {
      type: String,
      default: null,
    },
    completedAt: {
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

serviceRequestSchema.index({ user: 1, status: 1, createdAt: -1 });
serviceRequestSchema.index({ serviceType: 1, status: 1 });
serviceRequestSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
