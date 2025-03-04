const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { User } = require('../models');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [sequelize.Op.or]: [{ email }, { username }]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email or username already exists'
      });
    }
    
    // Create new user
    const user = await User.create({
      username,
      email,
      password
    });
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Store refresh token in Redis
    await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
      EX: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Update last login
    await user.update({ lastLogin: new Date() });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }
    
    // Validate password
    const isValidPassword = await user.validPassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Store refresh token in Redis
    await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
      EX: 60 * 60 * 24 * 7 // 7 days
    });
    
    // Update last login
    await user.update({ lastLogin: new Date() });
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Check if token exists in Redis
    const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);
    
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    
    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Update refresh token in Redis
    await redisClient.set(`refresh_token:${user.id}`, newRefreshToken, {
      EX: 60 * 60 * 24 * 7 // 7 days
    });
    
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Remove refresh token from Redis
    await redisClient.del(`refresh_token:${req.user.id}`);
    
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Generate API key for user
const generateApiKey = async (req, res) => {
  try {
    const user = req.user;
    
    // Generate API key and secret
    const apiKey = `NT_${uuidv4().replace(/-/g, '')}`;
    const apiSecret = crypto.randomBytes(32).toString('hex');
    
    // Update user with API credentials
    await user.update({
      apiKey,
      apiSecret: await bcrypt.hash(apiSecret, 10)
    });
    
    res.status(200).json({
      message: 'API key generated successfully',
      apiKey,
      apiSecret,
      note: 'Please save your API secret as it will not be shown again'
    });
  } catch (error) {
    logger.error(`API key generation error: ${error.message}`);
    res.status(500).json({ error: 'API key generation failed' });
  }
};

// Helper function to generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '1d' }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  generateApiKey
};