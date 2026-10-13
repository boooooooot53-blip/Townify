const express = require('express');
const {
  createServiceRequest,
  getServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  assignWorker,
  updateAssignedStatus,
} = require('../controllers/serviceRequestController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  validate({
    title: { required: true, type: 'string', maxLength: 200 },
    description: { required: true, type: 'string', maxLength: 2000 },
    serviceType: {
      required: true,
      enum: [
        'plumbing',
        'electrical',
        'carpentry',
        'painting',
        'cleaning',
        'gardening',
        'appliance_repair',
        'moving',
        'other',
      ],
    },
  }),
  createServiceRequest
);

router.get('/', getServiceRequests);
router.get('/:id', getServiceRequestById);
router.put('/:id', updateServiceRequest);
router.delete('/:id', deleteServiceRequest);

// New Routes for Admin Assignment
router.post('/:id/assign', assignWorker);
router.patch('/:id/assigned-status', updateAssignedStatus);

module.exports = router;
