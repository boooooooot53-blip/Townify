const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { createNotification } = require('../utils/createNotification');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, priority, images, location } = req.body;

  const complaint = await Complaint.create({
    user: req.user._id,
    title,
    description,
    category,
    priority,
    images: images || [],
    location,
  });

  await complaint.populate('user', 'name email phone profileImage');

  res.status(201).json(ApiResponse.created({ complaint }, 'Complaint submitted successfully'));
});

const getComplaints = asyncHandler(async (req, res) => {
  const { status, category, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === 'resident') {
    filter.user = req.user._id;
  } else if (req.user.role === 'worker') {
    filter.assignedTo = req.user._id;
  }

  if (status) filter.status = status;
  if (category) filter.category = category;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('user', 'name email phone profileImage')
      .populate('assignedTo', 'name phone profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Complaint.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.ok({
      complaints,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    })
  );
});

const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name email phone profileImage')
    .populate('assignedTo', 'name phone profileImage');

  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  if (
    req.user.role === 'resident' &&
    complaint.user._id.toString() !== req.user._id.toString()
  ) {
    throw ApiError.forbidden('Access denied');
  }

  res.json(ApiResponse.ok({ complaint }));
});

const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  const isOwner = complaint.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('Access denied');
  }

  if (isOwner && !['pending'].includes(complaint.status)) {
    throw ApiError.badRequest('Cannot update complaint after it has been processed');
  }

  const { title, description, category, priority, images, location } = req.body;

  if (title) complaint.title = title;
  if (description) complaint.description = description;
  if (category) complaint.category = category;
  if (priority) complaint.priority = priority;
  if (images) complaint.images = images;
  if (location) complaint.location = location;

  await complaint.save();
  await complaint.populate('user', 'name email phone profileImage');

  res.json(ApiResponse.ok({ complaint }, 'Complaint updated successfully'));
});

const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  const isOwner = complaint.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('Access denied');
  }

  await complaint.deleteOne();

  res.json(ApiResponse.ok(null, 'Complaint deleted successfully'));
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  const isAdmin = req.user.role === 'admin';
  const isAssignedWorker = req.user.role === 'worker' && complaint.assignedTo && complaint.assignedTo.toString() === req.user._id.toString();

  if (!isAdmin && !isAssignedWorker) {
    throw ApiError.forbidden('Only admins or the assigned worker can update complaint status');
  }

  const { status, assignedTo, adminNotes, assignmentStatus, rejectionReason, completionImages } = req.body;

  // Workers shouldn't be able to reassign or add admin notes
  if (!isAdmin && (assignedTo || adminNotes)) {
    throw ApiError.forbidden('Only admins can assign workers or add admin notes');
  }

  if (status) complaint.status = status;
  if (adminNotes) complaint.adminNotes = adminNotes;
  
  if (assignedTo) {
    const isNewAssignment = complaint.assignedTo?.toString() !== assignedTo;
    complaint.assignedTo = assignedTo;
    if (isNewAssignment) {
      complaint.assignmentStatus = 'pending';
      complaint.rejectionReason = null;
    }
  }

  if (assignmentStatus) {
    if (!['pending', 'accepted', 'rejected'].includes(assignmentStatus)) {
      throw ApiError.badRequest('Invalid assignment status');
    }
    complaint.assignmentStatus = assignmentStatus;
    if (assignmentStatus === 'rejected') {
      complaint.rejectionReason = rejectionReason;
    }
  }

  if (status === 'resolved') {
    complaint.resolvedAt = new Date();
    if (completionImages && Array.isArray(completionImages)) {
      complaint.completionImages = completionImages;
    }
  }

  await complaint.save();
  await complaint.populate([
    { path: 'user', select: 'name email phone profileImage' },
    { path: 'assignedTo', select: 'name phone profileImage' },
  ]);

  if (status) {
    await createNotification({
      userId: complaint.user._id,
      title: 'Complaint Status Updated',
      message: `Your complaint "${complaint.title}" is now ${status.replace('_', ' ')}.`,
      type: 'complaint',
      data: { complaintId: complaint._id.toString(), status },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${complaint.user._id}`).emit('notification', {
        title: 'Complaint Status Updated',
        message: `Your complaint "${complaint.title}" is now ${status.replace('_', ' ')}.`,
        type: 'complaint',
        data: { complaintId: complaint._id.toString(), status },
      });
    }
  }

  // Notify Worker of Assignment
  if (assignedTo && complaint.assignmentStatus === 'pending') {
    await createNotification({
      userId: assignedTo,
      title: 'New Complaint Assignment',
      message: `You have been assigned to complaint "${complaint.title}". Please accept or reject it.`,
      type: 'complaint',
      data: { complaintId: complaint._id.toString() },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${assignedTo}`).emit('notification', {
        title: 'New Complaint Assignment',
        message: `You have been assigned to complaint "${complaint.title}". Please accept or reject it.`,
        type: 'complaint',
        data: { complaintId: complaint._id.toString() },
      });
    }
  }

  // Notify Admin of worker actions
  if (isAssignedWorker) {
    let adminMsg = '';
    if (assignmentStatus) {
      adminMsg = assignmentStatus === 'accepted' 
        ? `${req.user.name} accepted the assignment for "${complaint.title}".`
        : `${req.user.name} rejected the assignment for "${complaint.title}". Reason: ${rejectionReason || 'None'}`;
    }
    
    if (status && ['in_progress', 'resolved'].includes(status)) {
      adminMsg = `${req.user.name} updated the status of "${complaint.title}" to ${status.replace('_', ' ')}.`;
    }

    if (adminMsg) {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      const notifications = admins.map(admin => createNotification({
        userId: admin._id,
        title: 'Complaint Update',
        message: adminMsg,
        type: 'complaint',
        data: { complaintId: complaint._id.toString() }
      }));
      await Promise.all(notifications);

      const io = req.app.get('io');
      if (io) {
        admins.forEach(admin => {
          io.to(`user:${admin._id}`).emit('notification', {
            title: 'Complaint Update',
            message: adminMsg,
            type: 'complaint',
            data: { complaintId: complaint._id.toString() }
          });
        });
      }
    }
  }

  res.json(ApiResponse.ok({ complaint }, 'Complaint status updated'));
});

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  updateComplaintStatus,
};
