const User = require('../models/User');

/**
 * GET /api/admin/workers
 * Get all workers for admin
 */
const getWorkers = async (req, res) => {
    try {
        const workers = await User.find({ role: 'worker' })
            .select('-password -refreshToken')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: workers.length,
            workers,
        });
    } catch (error) {
        console.error('Get workers error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch workers',
        });
    }
};

/**
 * GET /api/admin/workers/:id
 * Get complete worker profile
 */
const getWorkerById = async (req, res) => {
    try {
        const worker = await User.findOne({
            _id: req.params.id,
            role: 'worker',
        })
            .select('-password -refreshToken')
            .lean();

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found',
            });
        }

        res.status(200).json({
            success: true,
            worker,
        });
    } catch (error) {
        console.error('Get worker by ID error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch worker profile',
        });
    }
};

/**
 * PATCH /api/admin/workers/:id/approve
 */
const approveWorker = async (req, res) => {
    try {
        const worker = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                role: 'worker',
            },
            {
                approved: true,
                isActive: true,
                'workerProfile.verified': true,
            },
            {
                new: true,
                runValidators: true,
            }
        ).select('-password -refreshToken');

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Worker approved successfully',
            worker,
        });
    } catch (error) {
        console.error('Approve worker error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to approve worker',
        });
    }
};

/**
 * PATCH /api/admin/workers/:id/deactivate
 */
const deactivateWorker = async (req, res) => {
    try {
        const worker = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                role: 'worker',
            },
            {
                isActive: false,
            },
            {
                new: true,
                runValidators: true,
            }
        ).select('-password -refreshToken');

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Worker deactivated successfully',
            worker,
        });
    } catch (error) {
        console.error('Deactivate worker error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to deactivate worker',
        });
    }
};

/**
 * PATCH /api/admin/workers/:id/activate
 */
const activateWorker = async (req, res) => {
    try {
        const worker = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                role: 'worker',
            },
            {
                isActive: true,
            },
            {
                new: true,
                runValidators: true,
            }
        ).select('-password -refreshToken');

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Worker activated successfully',
            worker,
        });
    } catch (error) {
        console.error('Activate worker error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to activate worker',
        });
    }
};


module.exports = {
    getWorkers,
    getWorkerById,
    approveWorker,
    deactivateWorker,
    activateWorker,
};