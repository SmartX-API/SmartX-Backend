const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const tradeRoutes = require('./trade.routes');
const tokenRoutes = require('./token.routes');
const marketDataRoutes = require('./marketData.routes');
const tradingSignalRoutes = require('./tradingSignal.routes');
const twitterMonitorRoutes = require('./twitterMonitor.routes');
const aiModelRoutes = require('./aiModel.routes');
const systemLogRoutes = require('./systemLog.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trades', tradeRoutes);
router.use('/tokens', tokenRoutes);
router.use('/market-data', marketDataRoutes);
router.use('/trading-signals', tradingSignalRoutes);
router.use('/twitter-monitor', twitterMonitorRoutes);
router.use('/ai-models', aiModelRoutes);
router.use('/system-logs', systemLogRoutes);

// Neural Trade specific endpoints
router.use('/neural-feed', require('./neuralFeed.routes'));
router.use('/exec-log', require('./execLog.routes'));
router.use('/ai-predict', require('./aiPredict.routes'));
router.use('/sec-check', require('./secCheck.routes'));
router.use('/sys-update', require('./sysUpdate.routes'));

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;