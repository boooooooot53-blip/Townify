const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { createNotification } = require('../utils/createNotification');

/*
|--------------------------------------------------------------------------
| GET ALL COMPLAINTS
|--------------------------------------------------------------------------
*/
const postgetComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate(
        'user',
        'name email phone profileImage'
      )
      .populate(
        'assignedTo',
        'name email phone profileImage workerProfile'
      )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Get admin complaints error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET SINGLE COMPLAINT
|--------------------------------------------------------------------------
*/
const postgetComplaintById = async (req, res) => {
  try {
    console.log("Triggered get complaint by ID");
    const complaint = await Complaint.findById(req.params.id)
      .populate(
        'user',
        'name email phone profileImage address isEmailVerified isPhoneVerified'
      )
      .populate(
        'assignedTo',
        'name email phone profileImage address workerProfile isEmailVerified isPhoneVerified'
      )
      .lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }
    console.log("Fetched complaint:", complaint);
    res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error('Get complaint by ID error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint',
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET WORKERS FOR ASSIGNMENT
|--------------------------------------------------------------------------
*/
const postgetWorkersForAssignment = async (req, res) => {
  try {
    const workers = await User.find({
      role: 'worker',
      approved: true,
      isActive: true,
    })
      .select(
        'name email phone profileImage workerProfile'
      )
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: workers.length,
      workers,
    });
  } catch (error) {
    console.error(
      'Get workers for complaint assignment error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to fetch workers',
    });
  }
};


/*
|--------------------------------------------------------------------------
| ASSIGN WORKER
|--------------------------------------------------------------------------
*/
const postassignWorker = async (req, res) => {
  try {
    const { workerId } = req.body;

    console.log("Assigning worker with ID:", workerId);

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'Worker ID is required',
      });
    }

    const worker = await User.findOne({
      _id: workerId,
      role: 'worker',
      approved: true,
      isActive: true,
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Approved active worker not found',
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: worker._id,
        assignmentStatus: 'pending',
        rejectionReason: null,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        'user',
        'name email phone profileImage'
      )
      .populate(
        'assignedTo',
        'name email phone profileImage workerProfile'
      );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    // Send notification to the assigned worker
    await createNotification({
      userId: worker._id,
      title: 'New Job Assignment',
      message: `You have been assigned to complaint "${complaint.title}". Please accept or reject it.`,
      type: 'complaint',
      data: { complaintId: complaint._id.toString() },
    });

    res.status(200).json({
      success: true,
      message: 'Worker assigned successfully',
      complaint,
    });
  } catch (error) {
    console.error('Assign worker error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to assign worker',
    });
  }
};


/*
|--------------------------------------------------------------------------
| CHANGE COMPLAINT STATUS
|--------------------------------------------------------------------------
*/
const postupdateComplaintStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    console.log("Updating complaint status to:", status);

    const validStatuses = [
      'pending',
      'in_progress',
      'resolved',
      'rejected',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint status',
      });
    }

    const complaint = await Complaint.findById(
      req.params.id
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    /*
     * Prevent resolving/rejecting without an assigned worker.
     * Remove this rule if your business logic allows admin
     * to resolve/reject complaints without workers.
     */
    if (
      (status === 'in_progress' || status === 'resolved') &&
      !complaint.assignedTo
    ) {
      return res.status(400).json({
        success: false,
        message: 'Assign a worker before starting or resolving the complaint',
      });
    }

    complaint.status = status;

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
      complaint.rejectionReason = '';
      complaint.rejectedAt = null;
    } else if (status === 'rejected') {
      complaint.rejectedAt = new Date();
      complaint.resolvedAt = null;
      complaint.rejectionReason =
        rejectionReason?.trim() || '';
    } else {
      complaint.resolvedAt = null;
      complaint.rejectedAt = null;

      if (status !== 'rejected') {
        complaint.rejectionReason = '';
      }
    }

    await complaint.save();

    await complaint.populate([
      {
        path: 'user',
        select: 'name email phone profileImage',
      },
      {
        path: 'assignedTo',
        select: 'name email phone profileImage workerProfile',
      },
    ]);

    res.status(200).json({
      success: true,
      message: `Complaint ${status.replace('_', ' ')} successfully`,
      complaint,
    });
  } catch (error) {
    console.error(
      'Update complaint status error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status',
    });
  }
};

module.exports = {
  postgetComplaints,
  postgetComplaintById,
    postgetWorkersForAssignment,
    postassignWorker,
    postupdateComplaintStatus,
};