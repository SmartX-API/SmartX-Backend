const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');
const cyberMetrics = require('../modules/cyberMetrics');
const deepseekAI = require('../modules/deepseekAI');
const grokEngine = require('../modules/grokEngine');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/neural-feed:
 *   get:
 *     summary: Get neural feed of market opportunities
 *     tags: [Neural Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         description: Cryptocurrency symbol
 *     responses:
 *       200:
 *         description: Neural feed retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/', authenticate, apiLimiter, async (req, res) => {
  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }
    
    logger.info(`Neural feed requested for ${symbol}`);
    
    // Get market analysis from all AI modules
    const cyberMetricsSignal = await cyberMetrics.analyzeMarket(symbol);
    const patternAnalysis = await deepseekAI.analyzePatterns(symbol);
    const pricePredict = await deepseekAI.predictPrice(symbol, 7);
    const grokSignal = await grokEngine.analyzeMarket(symbol);
    
    res.status(200).json({
      symbol,
      timestamp: new Date(),
      opportunities: [
        {
          source: 'CYBER_METRICS',
          action: cyberMetricsSignal.action,
          confidence: cyberMetricsSignal.confidence,
          timeframe: cyberMetricsSignal.timeframe
        },
        {
          source: 'DEEPSEEK_AI',
          pattern: patternAnalysis.patternName,
          action: patternAnalysis.action,
          confidence: patternAnalysis.confidence
        },
        {
          source: 'DEEPSEEK_AI',
          currentPrice: pricePredict.currentPrice,
          predictedPrice: pricePredict.predictedPrice,
          days: pricePredict.days,
          accuracy: pricePredict.accuracy
        },
        {
          source: 'GROK_ENGINE',
          action: grokSignal.action,
          confidence: grokSignal.confidence,
          sourceSignals: grokSignal.sourceSignals
        }
      ]
    });
  } catch (error) {
    logger.error(`Neural feed error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve neural feed' });
  }
});

/**
 * @swagger
 * /api/neural-feed/analyze:
 *   post:
 *     summary: Analyze a specific cryptocurrency
 *     tags: [Neural Feed]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *             properties:
 *               symbol:
 *                 type: string
 *               timeframe:
 *                 type: string
 *                 enum: [1h, 4h, 1d, 1w]
 *                 default: 1d
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/analyze', authenticate, apiLimiter, async (req, res) => {
  try {
    const { symbol, timeframe = '1d' } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }
    
    logger.info(`Neural analysis requested for ${symbol} on ${timeframe} timeframe`);
    
    // Get comprehensive analysis from Grok Engine
    const analysis = await grokEngine.analyzeMarket(symbol);
    
    // Get price prediction
    const prediction = await deepseekAI.predictPrice(symbol, timeframe === '1h' ? 1 : timeframe === '4h' ? 1 : timeframe === '1d' ? 7 : 30);
    
    res.status(200).json({
      symbol,
      timeframe,
      timestamp: new Date(),
      analysis: {
        action: analysis.action,
        confidence: analysis.confidence,
        signalId: analysis.signalId,
        sourceSignals: analysis.sourceSignals
      },
      prediction: {
        currentPrice: prediction.currentPrice,
        predictedPrice: prediction.predictedPrice,
        days: prediction.days,
        accuracy: prediction.accuracy
      }
    });
  } catch (error) {
    logger.error(`Neural analysis error: ${error.message}`);
    res.status(500).json({ error: 'Failed to complete neural analysis' });
  }
});

module.exports = router;