const express = require('express');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  updateComplaintStatus,
} = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  validate({
    title: { required: true, type: 'string', maxLength: 200 },
    description: { required: true, type: 'string', maxLength: 2000 },
    category: {
      required: true,
      enum: [
        'infrastructure',
        'sanitation',
        'security',
        'noise',
        'utilities',
        'traffic',
        'other',
      ],
    },
  }),
  createComplaint
);

router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.put('/:id', updateComplaint);
router.delete('/:id', deleteComplaint);
router.patch('/:id/status', updateComplaintStatus);

module.exports = router;
