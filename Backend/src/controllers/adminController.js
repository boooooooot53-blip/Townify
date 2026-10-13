const User = require('../models/User');

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};


// PATCH /api/admin/users/:id/approve
const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        approved: true,
        isActive: true,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      user,
    });
  } catch (error) {
    console.error('Approve user error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to approve user',
    });
  }
};


// PATCH /api/admin/users/:id/deactivate
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      user,
    });
  } catch (error) {
    console.error('Deactivate user error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
    });
  }
};


// PATCH /api/admin/users/:id/activate
const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isActive: true,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      user,
    });
  } catch (error) {
    console.error('Activate user error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to activate user',
    });
  }
};

module.exports = {
  getUsers,
  approveUser,
  deactivateUser,
  activateUser,

};
