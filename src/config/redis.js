const redis = require('redis');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (err) => {
  logger.error(`Redis Error: ${err.message}`);
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

module.exports = { redisClient };