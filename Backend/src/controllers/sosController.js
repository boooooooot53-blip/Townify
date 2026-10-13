const SOS = require('../models/SOS');
const User = require('../models/User');
const { createNotification, createNotifications } = require('../utils/createNotification');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createSOS = asyncHandler(async (req, res) => {
  const { emergencyType, description, location } = req.body;

  if (!location?.coordinates || location.coordinates.length !== 2) {
    throw ApiError.badRequest('Valid location coordinates [lng, lat] are required');
  }

  const activeSOS = await SOS.findOne({
    user: req.user._id,
    status: { $in: ['active', 'responding'] },
  });

  if (activeSOS) {
    throw ApiError.conflict('You already have an active SOS alert');
  }

  const sos = await SOS.create({
    user: req.user._id,
    emergencyType,
    description,
    location,
  });

  await sos.populate('user', 'name phone profileImage');

  await createNotification({
    userId: req.user._id,
    title: 'SOS Alert Sent',
    message: `Your ${emergencyType.replace('_', ' ')} emergency alert has been activated. Help is on the way.`,
    type: 'sos',
    data: { sosId: sos._id.toString() },
  });

  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  if (admins.length) {
    await createNotifications(
      admins.map((admin) => ({
        userId: admin._id,
        title: 'New SOS Alert',
        message: `${req.user.name} triggered a ${emergencyType.replace('_', ' ')} emergency alert.`,
        type: 'sos',
        data: { sosId: sos._id.toString() },
      }))
    );
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('sos_alert', { sos });
  }

  res.status(201).json(ApiResponse.created({ sos }, 'SOS alert sent successfully'));
});

const getSOSAlerts = asyncHandler(async (req, res) => {
  const { status, emergencyType, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (req.user.role === 'resident') {
    filter.user = req.user._id;
  }

  if (status) filter.status = status;
  if (emergencyType) filter.emergencyType = emergencyType;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [alerts, total] = await Promise.all([
    SOS.find(filter)
      .populate('user', 'name phone profileImage')
      .populate('resolvedBy', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    SOS.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.ok({
      alerts,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    })
  );
});

const getSOSById = asyncHandler(async (req, res) => {
  const sos = await SOS.findById(req.params.id)
    .populate('user', 'name phone profileImage')
    .populate('responders.user', 'name phone profileImage')
    .populate('resolvedBy', 'name profileImage');

  if (!sos) {
    throw ApiError.notFound('SOS alert not found');
  }

  if (
    req.user.role === 'resident' &&
    sos.user._id.toString() !== req.user._id.toString()
  ) {
    throw ApiError.forbidden('Access denied');
  }

  res.json(ApiResponse.ok({ sos }));
});

const respondToSOS = asyncHandler(async (req, res) => {
  if (!['admin', 'worker'].includes(req.user.role)) {
    throw ApiError.forbidden('Only admins and workers can respond to SOS alerts');
  }

  const sos = await SOS.findById(req.params.id);

  if (!sos) {
    throw ApiError.notFound('SOS alert not found');
  }

  if (!['active', 'responding'].includes(sos.status)) {
    throw ApiError.badRequest('SOS alert is no longer active');
  }

  const alreadyResponding = sos.responders.some(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (!alreadyResponding) {
    sos.responders.push({
      user: req.user._id,
      role: req.user.role === 'admin' ? 'admin' : 'volunteer',
    });
  }

  sos.status = 'responding';
  await sos.save();
  await sos.populate('responders.user', 'name phone profileImage');

  const io = req.app.get('io');
  if (io) {
    io.emit('sos_update', { sos });
  }

  res.json(ApiResponse.ok({ sos }, 'Response recorded'));
});

const resolveSOS = asyncHandler(async (req, res) => {
  const { resolutionNotes } = req.body;

  const sos = await SOS.findById(req.params.id);

  if (!sos) {
    throw ApiError.notFound('SOS alert not found');
  }

  const isOwner = sos.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('Access denied');
  }

  if (!['active', 'responding'].includes(sos.status)) {
    throw ApiError.badRequest('SOS alert is already resolved or cancelled');
  }

  sos.status = 'resolved';
  sos.resolvedAt = new Date();
  sos.resolvedBy = req.user._id;
  if (resolutionNotes) sos.resolutionNotes = resolutionNotes;

  await sos.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('sos_update', { sos });
  }

  res.json(ApiResponse.ok({ sos }, 'SOS alert resolved'));
});

const cancelSOS = asyncHandler(async (req, res) => {
  const sos = await SOS.findById(req.params.id);

  if (!sos) {
    throw ApiError.notFound('SOS alert not found');
  }

  if (sos.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the alert creator can cancel');
  }

  if (!['active', 'responding'].includes(sos.status)) {
    throw ApiError.badRequest('SOS alert is already resolved or cancelled');
  }

  sos.status = 'cancelled';
  await sos.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('sos_update', { sos });
  }

  res.json(ApiResponse.ok({ sos }, 'SOS alert cancelled'));
});

module.exports = {
  createSOS,
  getSOSAlerts,
  getSOSById,
  respondToSOS,
  resolveSOS,
  cancelSOS,
};
