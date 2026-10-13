const ServiceRequest = require('../models/ServiceRequest');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createServiceRequest = asyncHandler(async (req, res) => {
  const { title, description, serviceType, preferredDate, location, images } = req.body;

  const serviceRequest = await ServiceRequest.create({
    user: req.user._id,
    title,
    description,
    serviceType,
    preferredDate,
    location,
    images: images || [],
  });

  await serviceRequest.populate('user', 'name email phone profileImage');

  res.status(201).json(
    ApiResponse.created({ serviceRequest }, 'Service request created successfully')
  );
});

const getServiceRequests = asyncHandler(async (req, res) => {
  const { status, serviceType, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === 'resident') {
    filter.user = req.user._id;
  } else if (req.user.role === 'worker') {
    const workerSkills = req.user.workerProfile?.skills || [];
    filter.$or = [
      {
        status: { $in: ['open', 'quoted'] },
        ...(workerSkills.length > 0 ? { serviceType: { $in: workerSkills } } : {})
      },
      { assignedWorker: req.user._id }
    ];
  }

  if (status) filter.status = status;
  if (serviceType) filter.serviceType = serviceType;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [serviceRequests, total] = await Promise.all([
    ServiceRequest.find(filter)
      .populate('user', 'name email phone profileImage')
      .populate('assignedWorker', 'name phone profileImage workerProfile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    ServiceRequest.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.ok({
      serviceRequests,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    })
  );
});

const getServiceRequestById = asyncHandler(async (req, res) => {
  const serviceRequest = await ServiceRequest.findById(req.params.id)
    .populate('user', 'name email phone profileImage')
    .populate('assignedWorker', 'name phone profileImage workerProfile')
    .populate('acceptedQuotation');

  if (!serviceRequest) {
    throw ApiError.notFound('Service request not found');
  }

  if (
    req.user.role === 'resident' &&
    serviceRequest.user._id.toString() !== req.user._id.toString()
  ) {
    throw ApiError.forbidden('Access denied');
  }

  res.json(ApiResponse.ok({ serviceRequest }));
});

const updateServiceRequest = asyncHandler(async (req, res) => {
  const serviceRequest = await ServiceRequest.findById(req.params.id);

  if (!serviceRequest) {
    throw ApiError.notFound('Service request not found');
  }

  if (serviceRequest.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Access denied');
  }

  if (!['open', 'quoted'].includes(serviceRequest.status)) {
    throw ApiError.badRequest('Cannot update service request in current status');
  }

  const { title, description, serviceType, preferredDate, location, images } = req.body;

  if (title) serviceRequest.title = title;
  if (description) serviceRequest.description = description;
  if (serviceType) serviceRequest.serviceType = serviceType;
  if (preferredDate) serviceRequest.preferredDate = preferredDate;
  if (location) serviceRequest.location = location;
  if (images) serviceRequest.images = images;

  await serviceRequest.save();

  res.json(ApiResponse.ok({ serviceRequest }, 'Service request updated successfully'));
});

const deleteServiceRequest = asyncHandler(async (req, res) => {
  const serviceRequest = await ServiceRequest.findById(req.params.id);

  if (!serviceRequest) {
    throw ApiError.notFound('Service request not found');
  }

  if (serviceRequest.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Access denied');
  }

  await serviceRequest.deleteOne();

  res.json(ApiResponse.ok(null, 'Service request deleted successfully'));
});

// Admin ONLY
const assignWorker = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw ApiError.forbidden('Only admins can assign workers');
  }

  const { workerId } = req.body;
  if (!workerId) {
    throw ApiError.badRequest('workerId is required');
  }

  const serviceRequest = await ServiceRequest.findById(req.params.id);
  if (!serviceRequest) {
    throw ApiError.notFound('Service request not found');
  }

  serviceRequest.assignedWorker = workerId;
  serviceRequest.assignedByAdmin = true;
  serviceRequest.status = 'assigned';
  serviceRequest.adminTimeline.push({
    status: 'assigned',
    note: `Admin assigned worker ${workerId}`,
  });

  await serviceRequest.save();

  // Populate for response
  await serviceRequest.populate('user', 'name email phone profileImage');
  await serviceRequest.populate('assignedWorker', 'name phone profileImage workerProfile');

  // Emit socket event to the assigned worker
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${workerId}`).emit('job_assigned', { serviceRequest });
  }

  res.json(ApiResponse.ok({ serviceRequest }, 'Worker assigned successfully'));
});

// Worker ONLY (for admin-assigned jobs)
const updateAssignedStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'worker') {
    throw ApiError.forbidden('Only workers can update assigned status');
  }

  const { status, rejectionReason, completionImages } = req.body;
  if (!['accepted', 'in_progress', 'completed', 'cancelled', 'rejected'].includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }

  const serviceRequest = await ServiceRequest.findById(req.params.id);
  if (!serviceRequest) {
    throw ApiError.notFound('Service request not found');
  }

  if (serviceRequest.assignedWorker?.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You are not assigned to this request');
  }

  if (!serviceRequest.assignedByAdmin) {
    throw ApiError.badRequest('This request was not assigned by admin');
  }

  if (status === 'rejected' && !rejectionReason) {
    throw ApiError.badRequest('Rejection reason is required');
  }

  serviceRequest.status = status;
  if (status === 'rejected') {
    serviceRequest.rejectionReason = rejectionReason;
  }
  
  serviceRequest.adminTimeline.push({
    status: status,
    note: status === 'rejected' ? `Worker rejected job. Reason: ${rejectionReason}` : `Worker updated status to ${status}`,
  });

  if (status === 'completed') {
    serviceRequest.completedAt = new Date();
    if (completionImages && Array.isArray(completionImages)) {
      serviceRequest.completionImages = completionImages;
    }
  }

  await serviceRequest.save();
  await serviceRequest.populate('user', 'name email phone profileImage');
  await serviceRequest.populate('assignedWorker', 'name phone profileImage workerProfile');

  // Notify Admin about the status change
  let statusMessage = `Worker updated job status to ${status}`;
  if (status === 'accepted') statusMessage = `Worker ${req.user.name} accepted the job`;
  if (status === 'in_progress') statusMessage = `Worker ${req.user.name} started the job (In Progress)`;
  if (status === 'completed') statusMessage = `Worker ${req.user.name} completed the job`;
  if (status === 'rejected') statusMessage = `Worker ${req.user.name} rejected the job. Reason: ${rejectionReason}`;

  const { createNotification } = require('../utils/createNotification');
  const User = require('../models/User');
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  const notifications = admins.map(admin => createNotification({
    userId: admin._id,
    title: 'Worker Job Update',
    message: statusMessage,
    type: 'job',
    data: { serviceRequestId: serviceRequest._id.toString(), status },
  }));
  await Promise.all(notifications);

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${serviceRequest.user._id.toString()}`).emit('job_status_updated', { serviceRequest });
    io.to('admin_room').emit('job_status_updated', { serviceRequest });
  }

  res.json(ApiResponse.ok({ serviceRequest }, 'Status updated successfully'));
});

module.exports = {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  assignWorker,
  updateAssignedStatus,
};
