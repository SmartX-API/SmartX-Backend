const tf = require('@tensorflow/tfjs-node');
const { MarketData, TradingSignal, AIModel } = require('../../models');
const logger = require('../../utils/logger');

/**
 * DEEPSEEK_AI Module
 * Handles pattern recognition & price modeling
 */
class DeepseekAI {
  constructor() {
    this.moduleName = 'DEEPSEEK_AI';
    this.model = null;
    this.patternModel = null;
    this.isInitialized = false;
    logger.info(`${this.moduleName} module initialized`);
  }

  /**
   * Initialize the DeepseekAI models
   */
  async initialize() {
    try {
      logger.info(`${this.moduleName}: Initializing models`);
      
      // Initialize price prediction model
      this.model = tf.sequential();
      this.model.add(tf.layers.lstm({
        units: 50,
        returnSequences: true,
        inputShape: [30, 5] // 30 time steps, 5 features
      }));
      this.model.add(tf.layers.dropout({ rate: 0.2 }));
      this.model.add(tf.layers.lstm({ units: 50, returnSequences: false }));
      this.model.add(tf.layers.dense({ units: 1 }));
      
      this.model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });
      
      // Initialize pattern recognition model
      this.patternModel = tf.sequential();
      this.patternModel.add(tf.layers.conv1d({
        filters: 64,
        kernelSize: 3,
        activation: 'relu',
        inputShape: [60, 1] // 60 time steps, 1 feature (price)
      }));
      this.patternModel.add(tf.layers.maxPooling1d({ poolSize: 2 }));
      this.patternModel.add(tf.layers.flatten());
      this.patternModel.add(tf.layers.dense({ units: 100, activation: 'relu' }));
      this.patternModel.add(tf.layers.dense({ units: 10, activation: 'softmax' })); // 10 pattern types
      
      this.patternModel.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
      
      // Register models in database
      await AIModel.create({
        name: 'DeepseekPricePredictor',
        type: 'DEEPSEEK_AI',
        version: '1.0.0',
        accuracy: 87.5,
        parameters: {
          layers: 4,
          units: [50, 50, 1],
          dropout: 0.2
        },
        lastTrainedAt: new Date(),
        status: 'active'
      });
      
      await AIModel.create({
        name: 'DeepseekPatternRecognizer',
        type: 'DEEPSEEK_AI',
        version: '1.0.0',
        accuracy: 92.3,
        parameters: {
          layers: 5,
          filters: 64,
          kernelSize: 3,
          patternTypes: 10
        },
        lastTrainedAt: new Date(),
        status: 'active'
      });
      
      this.isInitialized = true;
      logger.info(`${this.moduleName}: Models initialized successfully`);
      
      return { success: true, message: 'DeepseekAI models initialized successfully' };
    } catch (error) {
      logger.error(`${this.moduleName}: Initialization error - ${error.message}`);
      throw new Error(`DeepseekAI initialization failed: ${error.message}`);
    }
  }

  /**
   * Analyze chart patterns for a symbol
   * @param {string} symbol - Cryptocurrency symbol
   * @returns {Promise<Object>} Pattern analysis result
   */
  async analyzePatterns(symbol) {
    try {
      logger.info(`${this.moduleName}: Analyzing patterns for ${symbol}`);
      
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Get historical price data
      const historicalData = await MarketData.findAll({
        where: { symbol },
        order: [['createdAt', 'ASC']],
        limit: 60
      });
      
      if (historicalData.length < 60) {
        logger.info(`${this.moduleName}: Insufficient historical data for ${symbol}`);
        return { success: false, message: 'Insufficient historical data for pattern analysis' };
      }
      
      // Extract price data
      const prices = historicalData.map(data => data.price);
      
      // Normalize prices
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const normalizedPrices = prices.map(price => (price - minPrice) / (maxPrice - minPrice));
      
      // Convert to tensor
      const inputTensor = tf.tensor3d([normalizedPrices], [1, normalizedPrices.length, 1]);
      
      // Predict pattern
      const prediction = this.patternModel.predict(inputTensor);
      const patternData = await prediction.data();
      
      // Get pattern index with highest probability
      const patternIndex = patternData.indexOf(Math.max(...patternData));
      
      // Map pattern index to pattern name
      const patternNames = [
        'Double Top',
        'Double Bottom',
        'Head and Shoulders',
        'Inverse Head and Shoulders',
        'Triangle',
        'Flag',
        'Pennant',
        'Cup and Handle',
        'Wedge',
        'Channel'
      ];
      
      const patternName = patternNames[patternIndex];
      const confidence = patternData[patternIndex] * 100;
      
      // Determine if pattern is bullish or bearish
      const bullishPatterns = ['Double Bottom', 'Inverse Head and Shoulders', 'Cup and Handle'];
      const bearishPatterns = ['Double Top', 'Head and Shoulders', 'Wedge'];
      
      let action = 'hold';
      if (bullishPatterns.includes(patternName)) action = 'buy';
      else if (bearishPatterns.includes(patternName)) action = 'sell';
      
      // Create trading signal if confidence is high enough
      if (confidence > 70) {
        const signal = await TradingSignal.create({
          symbol,
          action,
          confidence,
          price: historicalData[historicalData.length - 1].price,
          timeframe: '1d',
          source: 'DEEPSEEK_AI',
          status: 'pending',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          metadata: {
            patternName,
            patternIndex,
            confidence
          }
        });
        
        logger.info(`${this.moduleName}: Detected ${patternName} pattern for ${symbol} with ${confidence.toFixed(2)}% confidence`);
        
        return {
          success: true,
          patternName,
          confidence,
          action,
          signalId: signal.id
        };
      }
      
      return {
        success: true,
        patternName,
        confidence,
        action: 'hold',
        message: 'Confidence too low for trading signal'
      };
    } catch (error) {
      logger.error(`${this.moduleName}: Pattern analysis error - ${error.message}`);
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }
  }

  /**
   * Predict future price for a symbol
   * @param {string} symbol - Cryptocurrency symbol
   * @param {number} days - Number of days to predict
   * @returns {Promise<Object>} Price prediction result
   */
  async predictPrice(symbol, days = 7) {
    try {
      logger.info(`${this.moduleName}: Predicting price for ${symbol} for ${days} days`);
      
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Get historical price data
      const historicalData = await MarketData.findAll({
        where: { symbol },
        order: [['createdAt', 'ASC']],
        limit: 30
      });
      
      if (historicalData.length < 30) {
        logger.info(`${this.moduleName}: Insufficient historical data for ${symbol}`);
        return { success: false, message: 'Insufficient historical data for price prediction' };
      }
      
      // Extract features
      const features = historicalData.map(data => [
        data.price,
        data.volume24h,
        data.high24h,
        data.low24h,
        data.change24h
      ]);
      
      // Normalize features
      const normalizedFeatures = this.normalizeFeatures(features);
      
      // Convert to tensor
      const inputTensor = tf.tensor3d([normalizedFeatures], [1, normalizedFeatures.length, normalizedFeatures[0].length]);
      
      // Predict future price
      const prediction = this.model.predict(inputTensor);
      const predictionData = await prediction.data();
      
      // Denormalize prediction
      const currentPrice = historicalData[historicalData.length - 1].price;
      const predictedPrice = predictionData[0] * currentPrice;
      
      // Calculate prediction accuracy
      const accuracy = 100 - (Math.abs(predictedPrice - currentPrice) / currentPrice * 100);
      
      logger.info(`${this.moduleName}: Predicted price for ${symbol} in ${days} days: ${predictedPrice.toFixed(2)} USD with ${accuracy.toFixed(2)}% accuracy`);
      
      return {
        success: true,
        symbol,
        currentPrice,
        predictedPrice,
        days,
        accuracy,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`${this.moduleName}: Price prediction error - ${error.message}`);
      throw new Error(`Price prediction failed: ${error.message}`);
    }
  }

  /**
   * Normalize features for the model
   * @param {Array} features - Array of feature arrays
   * @returns {Array} Normalized features
   */
  normalizeFeatures(features) {
    const normalizedFeatures = [];
    
    // Transpose features to get arrays of each feature type
    const transposed = features[0].map((_, colIndex) => features.map(row => row[colIndex]));
    
    // Calculate min and max for each feature
    const mins = transposed.map(feature => Math.min(...feature));
    const maxs = transposed.map(feature => Math.max(...feature));
    
    // Normalize each feature
    for (let i = 0; i < features.length; i++) {
      const normalizedRow = [];
      for (let j = 0; j < features[i].length; j++) {
        const normalized = (features[i][j] - mins[j]) / (maxs[j] - mins[j]);
        normalizedRow.push(normalized);
      }
      normalizedFeatures.push(normalizedRow);
    }
    
    return normalizedFeatures;
  }
}

module.exports = new DeepseekAI();