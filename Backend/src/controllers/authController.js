const User = require('../models/User');
const Complaint = require('../models/Complaint');
const OTP = require('../models/OTP');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const generateOTP = require('../utils/generateOTP');
const bcrypt = require('bcryptjs');

const { sendOtpEmail } = require('../utils/sendEmail');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, profession, cnicFront, cnicBack } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    throw ApiError.conflict('User with this email or phone already exists');
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role === 'worker' ? 'worker' : 'resident',
    workerProfile:
      role === 'worker' ? { 
        skills: Array.isArray(profession) ? profession : (profession ? [profession] : []), 
        availability: 'available',
        cnicFront,
        cnicBack
      } : undefined,
  });

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  res.status(201).json(
    ApiResponse.created(
      {
        user: user.toPublicProfile(),
        accessToken,
        refreshToken,
      },
      'Registration successful',
    ),
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken');
  // console.log(user)

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  console.log(user.toPublicProfile())
  res.json(
    ApiResponse.ok(
      {
        user: user.toPublicProfile(),
        accessToken,
        refreshToken,
      },
      'Login successful',
    ),
  );
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw ApiError.badRequest('Refresh token is required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== token) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.json(
    ApiResponse.ok(
      {
        accessToken,
        refreshToken: newRefreshToken,
      },
      'Token refreshed successfully',
    ),
  );
});

const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshToken');

  if (user) {
    user.refreshToken = null;
    user.fcmToken = null;
    await user.save({ validateBeforeSave: false });
  }

  res.json(ApiResponse.ok(null, 'Logged out successfully'));
});

const getMe = asyncHandler(async (req, res) => {

  res.json(ApiResponse.ok({ user: req.user.toPublicProfile() }));
});

const sendOTP = asyncHandler(async (req, res) => {
  const { identifier, purpose } = req.body;

  if (!identifier || !purpose) {
    throw ApiError.badRequest('Identifier and purpose are required');
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OTP.deleteMany({ identifier, purpose });

  await OTP.create({ identifier, code, purpose, expiresAt });

  // In production, send via SMS/email service. For development, log only.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`OTP for ${identifier}: ${code}`);
  }

  res.json(ApiResponse.ok({ expiresIn: 600 }, 'OTP sent successfully'));
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { identifier, code, purpose } = req.body;

  const otpRecord = await OTP.findOne({
    identifier,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    throw ApiError.badRequest('OTP expired or not found');
  }

  if (otpRecord.attempts >= 5) {
    throw ApiError.badRequest('Maximum OTP attempts exceeded');
  }

  if (otpRecord.code !== code) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw ApiError.badRequest('Invalid OTP');
  }

  otpRecord.isUsed = true;
  await otpRecord.save();

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  });

  if (user) {
    if (identifier.includes('@')) {
      user.isEmailVerified = true;
    } else {
      user.isPhoneVerified = true;
    }
    await user.save();
  }

  res.json(ApiResponse.ok({ verified: true }, 'OTP verified successfully'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw ApiError.badRequest('Email is required');
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    isActive: true,
  });

  if (!user) {
    throw ApiError.notFound('No account found with this email');
  }

  const identifier = email.toLowerCase().trim();
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OTP.deleteMany({ identifier, purpose: 'password_reset' });
  await OTP.create({ identifier, code, purpose: 'password_reset', expiresAt });

  try {
    await sendOtpEmail(identifier, code);
  } catch (emailErr) {
    console.error('Email send failed:', emailErr.message);
    // fallback log in dev so you can still test
    console.log(`[DEV FALLBACK] OTP for ${identifier}: ${code}`);
  }

  res.json(
    ApiResponse.ok(
      { expiresIn: 600 },
      'Password reset code sent to your email',
    ),
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { identifier, code, newPassword } = req.body;

  if (!identifier || !code || !newPassword) {
    throw ApiError.badRequest(
      'Identifier, code, and new password are required',
    );
  }

  if (newPassword.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters');
  }

  // OTP already verified in previous step, just check it was used
  const otpRecord = await OTP.findOne({
    identifier,
    purpose: 'password_reset',
    isUsed: true, // ✅ already verified and marked used
    code, // ✅ still match the code for security
  });

  if (!otpRecord) {
    throw ApiError.badRequest(
      'Invalid reset session. Please request a new code.',
    );
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  }).select('+password');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.password = newPassword;
  user.refreshToken = null;
  await user.save();

  // Clean up the OTP record
  await OTP.deleteOne({ _id: otpRecord._id });

  res.json(ApiResponse.ok(null, 'Password reset successfully'));
});

const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw ApiError.badRequest('Email is required');
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    isActive: true,
  });

  res.json(ApiResponse.ok({ exists: !!user }));
});


const getDashboard = async (req, res) => {
  try {

    const [
      totalUsers,
      residents,
      workers,
      admins,
      approvedUsers,
      pendingUsers,
      activeUsers,
      inactiveUsers,

      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      rejectedComplaints,
      urgentComplaints,

      complaintsByCategory,
    ] = await Promise.all([
      // ─────────────────────────────────────────────
      // USERS
      // ─────────────────────────────────────────────
      User.countDocuments(),



      User.countDocuments({
        role: 'resident',
      }),

      User.countDocuments({
        role: 'worker',
      }),

      User.countDocuments({
        role: 'admin',
      }),

      User.countDocuments({
        approved: true,
      }),

      User.countDocuments({
        approved: false,
      }),

      User.countDocuments({
        isActive: true,
      }),

      User.countDocuments({
        isActive: false,
      }),

      // ─────────────────────────────────────────────
      // COMPLAINTS
      // ─────────────────────────────────────────────
      Complaint.countDocuments(),

      Complaint.countDocuments({
        status: 'pending',
      }),

      Complaint.countDocuments({
        status: 'in_progress',
      }),

      Complaint.countDocuments({
        status: 'resolved',
      }),

      Complaint.countDocuments({
        status: 'rejected',
      }),

      Complaint.countDocuments({
        priority: 'urgent',
      }),

      // ─────────────────────────────────────────────
      // COMPLAINTS BY CATEGORY
      // ─────────────────────────────────────────────
      Complaint.aggregate([
        {
          $group: {
            _id: '$category',
            count: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            count: 1,
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          residents,
          workers,
          admins,
          approved: approvedUsers,
          pending: pendingUsers,
          active: activeUsers,
          inactive: inactiveUsers,
        },

        complaints: {
          total: totalComplaints,
          pending: pendingComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints,
          rejected: rejectedComplaints,
          urgent: urgentComplaints,
        },

        complaintsByCategory,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard',
    });
  }
};
const getComplains = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: complaints,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
    });
  }

};


const changePassword = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    // IMPORTANT:
    // password has select:false in User schema,
    // so explicitly include it.
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check current password
    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Prevent using the same password
    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password.',
      });
    }

    // Do NOT bcrypt.hash() here manually.
    // Your User model's pre('save') hook will hash it.
    user.password = newPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('Change password error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to change password.',
    });
  }
};





module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  checkEmail,
  getDashboard,
  getComplains,
  changePassword
};
