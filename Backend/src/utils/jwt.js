const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtConfig.accessSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, jwtConfig.refreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
