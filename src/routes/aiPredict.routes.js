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
 * /api/ai-predict/price:
 *   get:
 *     summary: Get price prediction for a cryptocurrency
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         required: true
 *         description: Cryptocurrency symbol
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Number of days to predict
 *         default: 7
 *     responses:
 *       200:
 *         description: Price prediction retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/price', authenticate, apiLimiter, async (req, res) => {
  try {
    const { symbol, days = 7 } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }
    
    logger.info(`Price prediction requested for ${symbol} for ${days} days`);
    
    // Get price prediction from DeepseekAI
    const prediction = await deepseekAI.predictPrice(symbol, parseInt(days));
    
    res.status(200).json({
      symbol,
      currentPrice: prediction.currentPrice,
      predictedPrice: prediction.predictedPrice,
      days: prediction.days,
      accuracy: prediction.accuracy,
      timestamp: prediction.timestamp
    });
  } catch (error) {
    logger.error(`Price prediction error: ${error.message}`);
    res.status(500).json({ error: 'Failed to predict price' });
  }
});

/**
 * @swagger
 * /api/ai-predict/pattern:
 *   get:
 *     summary: Get chart pattern analysis for a cryptocurrency
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         required: true
 *         description: Cryptocurrency symbol
 *     responses:
 *       200:
 *         description: Pattern analysis retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/pattern', authenticate, apiLimiter, async (req, res) => {
  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }
    
    logger.info(`Pattern analysis requested for ${symbol}`);
    
    // Get pattern analysis from DeepseekAI
    const analysis = await deepseekAI.analyzePatterns(symbol);
    
    res.status(200).json({
      symbol,
      patternName: analysis.patternName,
      confidence: analysis.confidence,
      action: analysis.action,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Pattern analysis error: ${error.message}`);
    res.status(500).json({ error: 'Failed to analyze pattern' });
  }
});

/**
 * @swagger
 * /api/ai-predict/sentiment:
 *   get:
 *     summary: Get social media sentiment analysis for a cryptocurrency
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         required: true
 *         description: Cryptocurrency symbol
 *     responses:
 *       200:
 *         description: Sentiment analysis retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/sentiment', authenticate, apiLimiter, async (req, res) => {
  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }
    
    logger.info(`Sentiment analysis requested for ${symbol}`);
    
    // Get tweets from TwitterMonitor
    const twitterMonitor = require('../modules/twitterMonitor');
    await twitterMonitor.initialize();
    const tweets = await twitterMonitor.fetchRecentTweets();
    
    // Filter tweets for the requested symbol
    const symbolTweets = tweets.filter(tweet => 
      tweet.symbols && tweet.symbols.includes(symbol)
    );
    
    if (symbolTweets.length === 0) {
      return res.status(404).json({ 
        message: 'No recent tweets found for this symbol',
        symbol
      });
    }
    
    // Calculate aggregate sentiment
    const sentimentSum = symbolTweets.reduce((sum, tweet) => {
      return sum + (tweet.sentiment === 'positive' ? tweet.sentimentScore :
                   tweet.sentiment === 'negative' ? -tweet.sentimentScore : 0);
    }, 0);
    
    const avgSentiment = sentimentSum / symbolTweets.length;
    
    // Count sentiment types
    const sentimentCounts = {
      positive: symbolTweets.filter(t => t.sentiment === 'positive').length,
      negative: symbolTweets.filter(t => t.sentiment === 'negative').length,
      neutral: symbolTweets.filter(t => t.sentiment === 'neutral').length
    };
    
    res.status(200).json({
      symbol,
      tweetCount: symbolTweets.length,
      avgSentiment,
      sentimentCounts,
      topInfluencers: [...new Set(symbolTweets.map(t => t.username))].slice(0, 5),
      timestamp: new Date()
    });
  } catch (error) {
    logger.error(`Sentiment analysis error: ${error.message}`);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

/**
 * @swagger
 * /api/ai-predict/comprehensive:
 *   get:
 *     summary: Get comprehensive AI prediction for a cryptocurrency
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         required: true
 *         description: Cryptocurrency symbol
 *     responses:
 *       200:
 *         description: Comprehensive prediction retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/comprehensive', authenticate, apiLimiter, async (req, res) => {
  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }
    
    logger.info(`Comprehensive prediction requested for ${symbol}`);
    
    // Get analysis from all AI modules
    const cyberMetricsSignal = await cyberMetrics.analyzeMarket(symbol);
    const patternAnalysis = await deepseekAI.analyzePatterns(symbol);
    const pricePredict = await deepseekAI.predictPrice(symbol, 7);
    const grokSignal = await grokEngine.analyzeMarket(symbol);
    
    res.status(200).json({
      symbol,
      timestamp: new Date(),
      grokAnalysis: {
        action: grokSignal.action,
        confidence: grokSignal.confidence,
        sourceSignals: grokSignal.sourceSignals
      },
      technicalAnalysis: {
        pattern: patternAnalysis.patternName,
        patternConfidence: patternAnalysis.confidence,
        action: patternAnalysis.action
      },
      pricePrediction: {
        currentPrice: pricePredict.currentPrice,
        predictedPrice: pricePredict.predictedPrice,
        days: pricePredict.days,
        accuracy: pricePredict.accuracy
      },
      marketMetrics: {
        action: cyberMetricsSignal.action,
        confidence: cyberMetricsSignal.confidence,
        timeframe: cyberMetricsSignal.timeframe
      }
    });
  } catch (error) {
    logger.error(`Comprehensive prediction error: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate comprehensive prediction' });
  }
});

module.exports = router;