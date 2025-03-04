const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');
const { Trade, TradingSignal } = require('../models');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/exec-log:
 *   get:
 *     summary: Get execution logs
 *     tags: [Execution Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of logs to return
 *         default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset for pagination
 *         default: 0
 *     responses:
 *       200:
 *         description: Execution logs retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/', authenticate, apiLimiter, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    logger.info(`Execution logs requested with limit ${limit} and offset ${offset}`);
    
    // Get recent trades
    const trades = await Trade.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    // Get total count
    const totalCount = await Trade.count();
    
    res.status(200).json({
      trades,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    logger.error(`Execution log error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve execution logs' });
  }
});

/**
 * @swagger
 * /api/exec-log/performance:
 *   get:
 *     summary: Get trading performance metrics
 *     tags: [Execution Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, all]
 *         description: Timeframe for performance metrics
 *         default: week
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/performance', authenticate, apiLimiter, async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    
    logger.info(`Performance metrics requested for timeframe: ${timeframe}`);
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }
    
    // Get completed trades in the timeframe
    const trades = await Trade.findAll({
      where: {
        status: 'completed',
        createdAt: {
          [sequelize.Op.gte]: startDate
        }
      }
    });
    
    // Calculate performance metrics
    let totalTrades = trades.length;
    let profitableTrades = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    
    trades.forEach(trade => {
      if (trade.profitLoss > 0) {
        profitableTrades++;
        totalProfit += parseFloat(trade.profitLoss);
      } else {
        totalLoss += Math.abs(parseFloat(trade.profitLoss));
      }
    });
    
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
    const netProfit = totalProfit - totalLoss;
    
    res.status(200).json({
      timeframe,
      totalTrades,
      profitableTrades,
      lossyTrades: totalTrades - profitableTrades,
      winRate,
      totalProfit,
      totalLoss,
      netProfit,
      startDate,
      endDate: new Date()
    });
  } catch (error) {
    logger.error(`Performance metrics error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve performance metrics' });
  }
});

/**
 * @swagger
 * /api/exec-log/signals:
 *   get:
 *     summary: Get trading signals
 *     tags: [Execution Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, executed, expired, cancelled, all]
 *         description: Filter by signal status
 *         default: pending
 *     responses:
 *       200:
 *         description: Trading signals retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/signals', authenticate, apiLimiter, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    logger.info(`Trading signals requested with status: ${status}`);
    
    // Build query based on status
    const query = {};
    if (status !== 'all') {
      query.status = status;
    }
    
    // Get trading signals
    const signals = await TradingSignal.findAll({
      where: query,
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    res.status(200).json({
      signals,
      count: signals.length,
      status: status
    });
  } catch (error) {
    logger.error(`Trading signals error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve trading signals' });
  }
});

module.exports = router;