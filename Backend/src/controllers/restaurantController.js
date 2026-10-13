const Restaurant = require('../models/Restaurant');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createRestaurant = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    cuisine,
    location,
    contactPhone,
    images,
    openingHours,
    deliveryAvailable,
    minimumOrder,
  } = req.body;

  const restaurant = await Restaurant.create({
    name,
    description,
    cuisine,
    owner: req.user._id,
    location,
    contactPhone,
    images: images || [],
    openingHours,
    deliveryAvailable,
    minimumOrder,
  });

  res
    .status(201)
    .json(
      ApiResponse.created({ restaurant }, 'Restaurant created successfully'),
    );
});

const getRestaurants = asyncHandler(async (req, res) => {
  const { cuisine, search, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true };

  if (cuisine) filter.cuisine = cuisine;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter)
      .populate('owner', 'name phone profileImage')
      .sort({ 'rating.average': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Restaurant.countDocuments(filter),
  ]);

  res.json(
    ApiResponse.ok({
      restaurants,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    }),
  );
});

const getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).populate(
    'owner',
    'name phone profileImage',
  );

  if (!restaurant || !restaurant.isActive) {
    throw ApiError.notFound('Restaurant not found');
  }

  res.json(ApiResponse.ok({ restaurant }));
});

const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found');
  }

  const isOwner = restaurant.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('Access denied');
  }

  const allowedFields = [
    'name',
    'description',
    'cuisine',
    'location',
    'contactPhone',
    'images',
    'openingHours',
    'deliveryAvailable',
    'minimumOrder',
    'isActive',
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      restaurant[field] = req.body[field];
    }
  }

  await restaurant.save();
  res.json(ApiResponse.ok({ restaurant }, 'Restaurant updated successfully'));
});



const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found');
  }
  const isOwner = restaurant.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('Access denied');
  }
  await Restaurant.findByIdAndDelete(req.params.id);
  res.json(ApiResponse.ok(null, 'Restaurant deleted successfully'));
});
const addMenuItem = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found');
  }

  if (restaurant.owner.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Access denied');
  }

  const {
    name,
    description,
    price,
    category,
    image,
    isAvailable,
    isVegetarian,
    spiceLevel,
  } = req.body;

  restaurant.menuItems.push({
    name,
    description,
    price,
    category,
    image,
    isAvailable,
    isVegetarian,
    spiceLevel,
  });

  await restaurant.save();

  const menuItem = restaurant.menuItems[restaurant.menuItems.length - 1];

  res
    .status(201)
    .json(ApiResponse.created({ menuItem }, 'Menu item added successfully'));
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found');
  }

  if (restaurant.owner.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Access denied');
  }

  const menuItem = restaurant.menuItems.id(req.params.itemId);

  if (!menuItem) {
    throw ApiError.notFound('Menu item not found');
  }

  const allowedFields = [
    'name',
    'description',
    'price',
    'category',
    'image',
    'isAvailable',
    'isVegetarian',
    'spiceLevel',
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      menuItem[field] = req.body[field];
    }
  }

  await restaurant.save();

  res.json(ApiResponse.ok({ menuItem }, 'Menu item updated successfully'));
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    throw ApiError.notFound('Restaurant not found');
  }

  if (restaurant.owner.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Access denied');
  }

  const menuItem = restaurant.menuItems.id(req.params.itemId);

  if (!menuItem) {
    throw ApiError.notFound('Menu item not found');
  }

  menuItem.deleteOne();
  await restaurant.save();

  res.json(ApiResponse.ok(null, 'Menu item deleted successfully'));
});

module.exports = {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
