const mongoose = require('mongoose');
const Quotation = require('../models/Quotation');
const ServiceRequest = require('../models/ServiceRequest');
const ChatRoom = require('../models/ChatRoom');
const { createNotification } = require('../utils/createNotification');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createQuotation = asyncHandler(async (req, res) => {
  if (req.user.role !== 'worker') {
    throw ApiError.forbidden('Only workers can submit quotations');
  }

  const { serviceRequestId, amount, description, estimatedDuration, validUntil } = req.body;

  const serviceRequest = await ServiceRequest.findById(serviceRequestId);

  if (!serviceRequest) {
    throw ApiError.notFound('Service request not found');
  }

  if (!['open', 'quoted'].includes(serviceRequest.status)) {
    throw ApiError.badRequest('Service request is no longer accepting quotations');
  }

  if (serviceRequest.user.toString() === req.user._id.toString()) {
    throw ApiError.badRequest('Cannot quote on your own service request');
  }

  const existingQuote = await Quotation.findOne({
    serviceRequest: serviceRequestId,
    worker: req.user._id,
  });

  if (existingQuote) {
    throw ApiError.conflict('You have already submitted a quotation for this request');
  }

  const quotation = await Quotation.create({
    serviceRequest: serviceRequestId,
    worker: req.user._id,
    amount,
    description,
    estimatedDuration,
    validUntil,
  });

  if (serviceRequest.status === 'open') {
    serviceRequest.status = 'quoted';
    await serviceRequest.save();
  }

  await quotation.populate([
    { path: 'worker', select: 'name phone profileImage workerProfile' },
    { path: 'serviceRequest', select: 'title serviceType status' },
  ]);

  await createNotification({
    userId: serviceRequest.user,
    title: 'New Quotation Received',
    message: `${req.user.name} sent a quotation of Rs. ${amount} for "${serviceRequest.title}".`,
    type: 'quotation',
    data: {
      quotationId: quotation._id.toString(),
      serviceRequestId: serviceRequestId.toString(),
      workerId: req.user._id.toString(),
    },
  });

  res.status(201).json(ApiResponse.created({ quotation }, 'Quotation submitted successfully'));
});

const getQuotations = asyncHandler(async (req, res) => {
  const { serviceRequestId, status, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (serviceRequestId) {
    const serviceRequest = await ServiceRequest.findById(serviceRequestId);

    if (!serviceRequest) {
      throw ApiError.notFound('Service request not found');
    }

    const isOwner = serviceRequest.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin && req.user.role !== 'worker') {
      throw ApiError.forbidden('Access denied');
    }

    filter.serviceRequest = serviceRequestId;
  } else if (req.user.role === 'worker') {
    filter.worker = req.user._id;
  }

  if (status) filter.status = status;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [quotations, total] = await Promise.all([
    Quotation.find(filter)
      .populate('worker', 'name phone profileImage workerProfile')
      .populate('serviceRequest', 'title serviceType status user')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Quotation.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.ok({
      quotations,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    })
  );
});

const getQuotationById = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('worker', 'name phone profileImage workerProfile')
    .populate({
      path: 'serviceRequest',
      select: 'title serviceType status user',
      populate: { path: 'user', select: 'name phone profileImage' },
    });

  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  const isWorker = quotation.worker._id.toString() === req.user._id.toString();
  const isOwner =
    quotation.serviceRequest.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isWorker && !isOwner && !isAdmin) {
    throw ApiError.forbidden('Access denied');
  }

  res.json(ApiResponse.ok({ quotation }));
});

const acceptQuotation = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const quotation = await Quotation.findById(req.params.id).session(session);

    if (!quotation) {
      throw ApiError.notFound('Quotation not found');
    }

    if (quotation.status !== 'pending') {
      throw ApiError.badRequest('Quotation is no longer pending');
    }

    const serviceRequest = await ServiceRequest.findById(quotation.serviceRequest).session(session);

    if (!serviceRequest) {
      throw ApiError.notFound('Service request not found');
    }

    if (serviceRequest.user.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('Only the service request owner can accept quotations');
    }

    if (!['open', 'quoted'].includes(serviceRequest.status)) {
      throw ApiError.badRequest('Service request is no longer accepting quotations');
    }

    // ── Accept this quotation ────────────────────────────────────────────────
    quotation.status = 'accepted';
    quotation.acceptedAt = new Date();
    await quotation.save({ session });

    // ── Reject all other pending quotations and get their worker IDs ─────────
    const otherPendingQuotations = await Quotation.find(
      {
        serviceRequest: quotation.serviceRequest,
        _id: { $ne: quotation._id },
        status: 'pending',
      },
      null,
      { session }
    );

    const rejectedWorkerIds = otherPendingQuotations.map((q) => q.worker);

    await Quotation.updateMany(
      {
        serviceRequest: quotation.serviceRequest,
        _id: { $ne: quotation._id },
        status: 'pending',
      },
      { status: 'rejected', rejectedAt: new Date() },
      { session }
    );

    // ── Update service request ────────────────────────────────────────────────
    serviceRequest.status = 'accepted';
    serviceRequest.acceptedQuotation = quotation._id;
    serviceRequest.assignedWorker = quotation.worker;
    await serviceRequest.save({ session });

    // ── Create chat room for accepted worker ──────────────────────────────────
    let chatRoom = await ChatRoom.findOne({
      serviceRequest: serviceRequest._id,
      quotation: quotation._id,
    }).session(session);

    if (!chatRoom) {
      [chatRoom] = await ChatRoom.create(
        [
          {
            participants: [serviceRequest.user, quotation.worker],
            serviceRequest: serviceRequest._id,
            quotation: quotation._id,
            roomType: 'service',
            lastMessage: 'Chat room created — quotation accepted',
            lastMessageAt: new Date(),
          },
        ],
        { session }
      );
    }

    // ── FIX BUG 2: Deactivate hire-request rooms for rejected workers ─────────
    // This prevents rejected workers from seeing messages in their hire-request
    // chat rooms with the same user, since those rooms are now irrelevant.
    if (rejectedWorkerIds.length > 0) {
      await ChatRoom.updateMany(
        {
          participants: { $all: [serviceRequest.user] },
          serviceRequest: { $exists: false },
          isActive: { $ne: false },
        },
        {
          isActive: false,
          hireStatus: 'rejected',
          lastMessage: 'Your quotation was not selected for this job.',
          lastMessageAt: new Date(),
        },
        { session }
      );
    }

    await session.commitTransaction();

    await quotation.populate([
      { path: 'worker', select: 'name phone profileImage workerProfile' },
      { path: 'serviceRequest', select: 'title serviceType status' },
    ]);

    await chatRoom.populate('participants', 'name profileImage');

    // ── Notify the accepted worker ────────────────────────────────────────────
    await createNotification({
      userId: quotation.worker,
      title: 'Quotation Accepted',
      message: `Your quotation of Rs. ${quotation.amount} for "${serviceRequest.title}" was accepted.`,
      type: 'quotation',
      data: {
        quotationId: quotation._id.toString(),
        serviceRequestId: serviceRequest._id.toString(),
        chatRoomId: chatRoom._id.toString(),
      },
    });

    // ── FIX BUG 2: Notify each rejected worker so they see the status ─────────
    for (const workerId of rejectedWorkerIds) {
      await createNotification({
        userId: workerId,
        title: 'Quotation Not Selected',
        message: `Your quotation for "${serviceRequest.title}" was not selected. The resident chose another worker.`,
        type: 'quotation',
        data: {
          quotationId: quotation._id.toString(),
          serviceRequestId: serviceRequest._id.toString(),
        },
      });
    }

    res.json(
      ApiResponse.ok(
        { quotation, chatRoom },
        'Quotation accepted and chat room created'
      )
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

const rejectQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id).populate('serviceRequest');

  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  if (quotation.status !== 'pending') {
    throw ApiError.badRequest('Quotation is no longer pending');
  }

  const isOwner =
    quotation.serviceRequest.user.toString() === req.user._id.toString();
  const isWorker = quotation.worker.toString() === req.user._id.toString();

  if (!isOwner && !isWorker) {
    throw ApiError.forbidden('Access denied');
  }

  quotation.status = 'rejected';
  quotation.rejectedAt = new Date();
  await quotation.save();

  const notifyUserId = isOwner ? quotation.worker : quotation.serviceRequest.user;
  await createNotification({
    userId: notifyUserId,
    title: 'Quotation Rejected',
    message: `A quotation for "${quotation.serviceRequest.title || 'service request'}" was rejected.`,
    type: 'quotation',
    data: {
      quotationId: quotation._id.toString(),
      serviceRequestId: quotation.serviceRequest._id?.toString(),
    },
  });

  res.json(ApiResponse.ok({ quotation }, 'Quotation rejected'));
});

const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    throw ApiError.notFound('Quotation not found');
  }

  // Only the worker who created the quotation can delete it
  if (quotation.worker.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Access denied');
  }

  // Can only delete if it's pending
  if (quotation.status !== 'pending') {
    throw ApiError.badRequest('Can only delete pending quotations');
  }

  // Delete it
  await Quotation.findByIdAndDelete(req.params.id);

  // If this was the last quotation for the request, maybe the request status should change?
  // Let's check if there are other quotations
  const remainingQuotations = await Quotation.countDocuments({
    serviceRequest: quotation.serviceRequest,
  });

  if (remainingQuotations === 0) {
    await ServiceRequest.findByIdAndUpdate(quotation.serviceRequest, {
      status: 'open',
    });
  }

  res.json(ApiResponse.ok(null, 'Quotation deleted successfully'));
});

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  acceptQuotation,
  rejectQuotation,
  deleteQuotation,
};