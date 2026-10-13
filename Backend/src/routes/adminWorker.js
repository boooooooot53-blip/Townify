const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/admin');
const {
  getWorkers,
  getWorkerById,
  approveWorker,
  deactivateWorker,
  activateWorker,
} = require('../controllers/adminWorker');

// Add your admin authentication middleware here.
// Example:
// const { protect, adminOnly } = require('../middleware/auth');
// router.use(protect, adminOnly);

router.get('/workers',authenticate, getWorkers);

router.get('/workers/:id', authenticate, getWorkerById);

router.post('/workers/:id/approve', authenticate, approveWorker);

router.post('/workers/:id/deactivate', authenticate, deactivateWorker);

router.post('/workers/:id/activate', authenticate, activateWorker);

module.exports = router;
