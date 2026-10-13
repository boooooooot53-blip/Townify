const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─────────────────────────────────────────────────────────────────────────────
// GET /users
// ─────────────────────────────────────────────────────────────────────────────

const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };

  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    User.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.ok({
      users,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /users/:id
// ─────────────────────────────────────────────────────────────────────────────

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');

  if (!user || !user.isActive) {
    throw ApiError.notFound('User not found');
  }

  res.json(ApiResponse.ok({ user }));
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /users/:id
// ─────────────────────────────────────────────────────────────────────────────

const updateUser = asyncHandler(async (req, res) => {
  const { name, phone, address, profileImage, fcmToken } = req.body;

  const isOwner = req.user._id.toString() === req.params.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('You can only update your own profile');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (profileImage !== undefined) user.profileImage = profileImage;
  if (fcmToken !== undefined) user.fcmToken = fcmToken;

  await user.save();

  res.json(ApiResponse.ok({ user: user.toPublicProfile() }, 'Profile updated successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /users/:id  (soft-delete)
// ─────────────────────────────────────────────────────────────────────────────

const deleteUser = asyncHandler(async (req, res) => {
  const isOwner = req.user._id.toString() === req.params.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('You can only delete your own account');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.isActive = false;
  await user.save();

  res.json(ApiResponse.ok(null, 'Account deactivated successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /users/workers
// ─────────────────────────────────────────────────────────────────────────────

const getWorkers = asyncHandler(async (req, res) => {
  const { skill, availability, page = 1, limit = 20 } = req.query;
  const filter = { role: 'worker', isActive: true, approved: true };

  if (skill) filter['workerProfile.skills'] = skill;
  if (availability) filter['workerProfile.availability'] = availability;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [workers, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken')
      .sort({ 'workerProfile.rating': -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    User.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.ok({
      workers,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /users/worker-profile
// ─────────────────────────────────────────────────────────────────────────────

const updateWorkerProfile = asyncHandler(async (req, res) => {
  if (req.user.role !== 'worker') {
    throw ApiError.forbidden('Only workers can update worker profile');
  }

  const { skills, experience, availability, bio, hourlyRate, cnic, cnicFront, cnicBack } = req.body;
  const user = await User.findById(req.user._id);

  if (!user.workerProfile) {
    user.workerProfile = {};
  }

  if (skills) user.workerProfile.skills = skills;
  if (experience !== undefined) user.workerProfile.experience = experience;
  if (availability) user.workerProfile.availability = availability;
  if (bio !== undefined) user.workerProfile.bio = bio;
  if (hourlyRate !== undefined) user.workerProfile.hourlyRate = hourlyRate;
  if (cnic !== undefined) user.workerProfile.cnic = cnic;
  if (cnicFront !== undefined) user.workerProfile.cnicFront = cnicFront;
  if (cnicBack !== undefined) user.workerProfile.cnicBack = cnicBack;

  await user.save();

  res.json(ApiResponse.ok({ user: user.toPublicProfile() }, 'Worker profile updated'));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /users/:workerId/rate
// NEW: user rates a worker after a completed job.
//
// - Validates rating is 1–5.
// - Prevents the same user from rating the same worker twice
//   (one rating per user per worker; update if already rated).
// - Recomputes the worker's average rating, totalReviews, and completedJobs.
// - Returns the updated worker document.
// ─────────────────────────────────────────────────────────────────────────────

const rateWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.params;
  const { rating, review, serviceRequestId } = req.body;

  // 1. Validate rating value
  const parsedRating = Number(rating);
  if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
    throw ApiError.badRequest('Rating must be a number between 1 and 5');
  }

  // 2. Find the worker
  const worker = await User.findById(workerId);
  if (!worker || !worker.isActive) {
    throw ApiError.notFound('Worker not found');
  }

  if (worker.role !== 'worker') {
    throw ApiError.badRequest('You can only rate workers');
  }

  // Prevent rating yourself
  if (workerId.toString() === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot rate yourself');
  }

  // 3. Check if this user already rated this worker
  //    If yes → update their existing entry instead of duplicating
  const existingIndex = worker.workerProfile.ratingsReceived.findIndex(
    (r) => r.userId.toString() === req.user._id.toString()
  );

  if (existingIndex !== -1) {
    // Update existing rating
    worker.workerProfile.ratingsReceived[existingIndex].rating = parsedRating;
    if (review !== undefined) {
      worker.workerProfile.ratingsReceived[existingIndex].review = review;
    }
    if (serviceRequestId) {
      worker.workerProfile.ratingsReceived[existingIndex].serviceRequestId = serviceRequestId;
    }
  } else {
    // Push new rating entry
    worker.workerProfile.ratingsReceived.push({
      userId: req.user._id,
      rating: parsedRating,
      review,
      serviceRequestId,
    });

    // Only increment completedJobs on the FIRST rating from this user
    worker.workerProfile.completedJobs = (worker.workerProfile.completedJobs || 0) + 1;
  }

  // 4. Recompute average rating and totalReviews
  const allRatings = worker.workerProfile.ratingsReceived;
  const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);
  worker.workerProfile.rating = Math.round((sum / allRatings.length) * 10) / 10; // 1 decimal
  worker.workerProfile.totalReviews = allRatings.length;

  await worker.save();

  res.json(ApiResponse.ok({ user: worker.toPublicProfile() }, 'Worker rated successfully'));
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getWorkers,
  updateWorkerProfile,
  rateWorker,
};
