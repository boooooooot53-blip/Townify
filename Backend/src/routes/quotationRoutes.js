const express = require('express');
const {
  createQuotation,
  getQuotations,
  getQuotationById,
  acceptQuotation,
  rejectQuotation,
  deleteQuotation,
} = require('../controllers/quotationController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  validate({
    serviceRequestId: { required: true, type: 'string' },
    amount: { required: true, type: 'number', min: 0 },
    description: { required: true, type: 'string', maxLength: 1000 },
  }),
  createQuotation
);

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.patch('/:id/accept', acceptQuotation);
router.patch('/:id/reject', rejectQuotation);
router.delete('/:id', deleteQuotation);

module.exports = router;
