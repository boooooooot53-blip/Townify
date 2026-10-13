
const express = require('express');
const router = express.Router();
const {
  postgetComplaints,
  postgetComplaintById,
  postgetWorkersForAssignment,
  postassignWorker,
  postupdateComplaintStatus,
} = require('../controllers/adminComplaintController');
const { authenticate } = require('../middleware/admin');

router.post('/complaints', authenticate,postgetComplaints);
router.get('/complaints/:id', authenticate, postgetComplaintById);
router.get('/complaints/workers/worker', authenticate, postgetWorkersForAssignment);
router.post('/complaints/:id/assign-worker', authenticate, postassignWorker);
router.post('/complaints/:id/status', authenticate, postupdateComplaintStatus);

module.exports = router;
// adminComplaints/complaints  adminComplaints/complaints/${complaintId}/status