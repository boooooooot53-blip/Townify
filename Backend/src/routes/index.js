const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const complaintRoutes = require('./complaintRoutes');
const serviceRequestRoutes = require('./serviceRequestRoutes');
const quotationRoutes = require('./quotationRoutes');
const chatRoutes = require('./chatRoutes');
const restaurantRoutes = require('./restaurantRoutes');
const sosRoutes = require('./sosRoutes');
const notificationRoutes = require('./notificationRoutes');
const AdminRoutes = require('./adminRoutes');
const adminWorkerRoutes = require('./adminWorker');
const adminComplaintRoutes = require('./adminComplaintRoutes');
const { getDashboard, getComplains } = require('../controllers/authController');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Townify API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/complaints', complaintRoutes);
router.get( '/dashboard', getDashboard );
router.get( '/complains', getComplains );
router.use('/service-requests', serviceRequestRoutes);
router.use('/quotations', quotationRoutes);
router.use('/chat', chatRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/sos', sosRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin',AdminRoutes);
router.use('/adminWorker',adminWorkerRoutes);
router.use('/adminComplaints',adminComplaintRoutes);
// adminComplaints/complaints
module.exports = router;
