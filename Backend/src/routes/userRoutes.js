const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getWorkers,
  updateWorkerProfile,
  rateWorker,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.get('/workers', authenticate, getWorkers);
router.put('/worker-profile', authenticate, updateWorkerProfile);

// ── Rating route (NEW)

router.post('/:workerId/rate', authenticate, rateWorker);

// ── General user routes
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUserById);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);

module.exports = router;
