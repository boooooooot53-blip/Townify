const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
  {
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
      index: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 1000,
    },
    estimatedDuration: {
      value: { type: Number, min: 1 },
      unit: {
        type: String,
        enum: ['hours', 'days'],
        default: 'hours',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    validUntil: {
      type: Date,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

quotationSchema.index({ serviceRequest: 1, worker: 1 }, { unique: true });
quotationSchema.index({ worker: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Quotation', quotationSchema);
