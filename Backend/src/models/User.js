
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schema: individual rating entry
// ─────────────────────────────────────────────────────────────────────────────
const ratingEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 500,
    },
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
    },
  },
  { timestamps: true, _id: true }
);

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schema: worker profile
// ─────────────────────────────────────────────────────────────────────────────
const workerProfileSchema = new mongoose.Schema(
  {
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    // ── NEW: tracks how many jobs the worker has completed ──────────────────
    completedJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    // ── NEW: array of individual ratings received from users ─────────────────
    ratingsReceived: {
      type: [ratingEntrySchema],
      default: [],
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available',
    },
    cnic: {
      type: String,
      trim: true,
    },
    cnicFront: {
      type: String,
    },
    cnicBack: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// Main User schema
// ─────────────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    approved:{
      type:Boolean,
      
      default: false,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['resident', 'worker', 'admin'],
      default: 'resident',
    },
    workerProfile: workerProfileSchema,
    profileImage: {
      type: String,
      default: null,
    },
    address: {
      street: String,
      city: String,
      area: String,
      coordinates: {
        type: [Number],
      },
    },
    fcmToken: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────────────────────
userSchema.index({ role: 1, 'workerProfile.availability': 1 });
userSchema.index({ 'address.coordinates': '2dsphere' });

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Methods
// ─────────────────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicProfile = function toPublicProfile() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);