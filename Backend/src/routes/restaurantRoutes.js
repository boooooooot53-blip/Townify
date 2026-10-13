const express = require('express');
const {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/restaurantController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', optionalAuth, getRestaurants);
router.get('/:id', optionalAuth, getRestaurantById);

router.use(authenticate);

router.post(
  '/',
  validate({
    name: { required: true, type: 'string', maxLength: 150 },
    location: { required: true },
  }),
  createRestaurant
);

router.put('/:id', updateRestaurant);
router.delete('/:id', deleteRestaurant);

router.post(
  '/:id/menu',
  validate({
    name: { required: true, type: 'string', maxLength: 100 },
    price: { required: true, type: 'number', min: 0 },
    category: {
      required: true,
      enum: ['appetizer', 'main', 'dessert', 'beverage', 'side', 'special'],
    },
  }),
  addMenuItem
);

router.put('/:id/menu/:itemId', updateMenuItem);
router.delete('/:id/menu/:itemId', deleteMenuItem);

module.exports = router;
