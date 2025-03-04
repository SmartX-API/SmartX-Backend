const axios = require('axios');
const { TwitterMonitor, TradingSignal } = require('../../models');
const logger = require('../../utils/logger');
const { redisClient } = require('../../config/redis');

/**
 * TWITTER_MONITOR Module
 * Handles sentiment analysis & trading signals from Twitter
 */
class TwitterMonitorModule {
  constructor() {
    this.moduleName = 'TWITTER_MONITOR';
    this.influencers = [];
    this.keywords = ['crypto', 'bitcoin', 'ethereum', 'solana', 'altcoin', 'defi', 'nft', 'bullish', 'bearish', 'moon', 'dump'];
    logger.info(`${this.moduleName} module initialized`);
  }

  /**
   * Initialize the Twitter monitor
   */
  async initialize() {
    try {
      logger.info(`${this.moduleName}: Initializing Twitter monitor`);
      
      // Load influencers from Redis or set default
      const cachedInfluencers = await redisClient.get('twitter_influencers');
      
      if (cachedInfluencers) {
        this.influencers = JSON.parse(cachedInfluencers);
      } else {
        // Default list of crypto influencers
        this.influencers = [
          'elonmusk',
          'cz_binance',
          'SBF_FTX',
          'VitalikButerin',
          'aantonop',
          'cryptoYoda1338',
          'PeterLBrandt',
          'CryptoHayes',
          'APompliano',
          'CryptoCred'
        ];
        
        // Cache influencers list
        await redisClient.set('twitter_influencers', JSON.stringify(this.influencers));
      }
      
      logger.info(`${this.moduleName}: Monitoring ${this.influencers.length} influencers`);
      
      return {
        success: true,
        influencersCount: this.influencers.length,
        keywordsCount: this.keywords.length
      };
    } catch (error) {
      logger.error(`${this.moduleName}: Initialization error - ${error.message}`);
      throw new Error(`Twitter monitor initialization failed: ${error.message}`);
    }
  }

  /**
   * Add a new influencer to monitor
   * @param {string} username - Twitter username
   * @returns {Promise<Object>} Result
   */
  async addInfluencer(username) {
    try {
      logger.info(`${this.moduleName}: Adding influencer ${username}`);
      
      if (this.influencers.includes(username)) {
        return { success: false, message: 'Influencer already being monitored' };
      }
      
      this.influencers.push(username);
      
      // Update cached list
      await redisClient.set('twitter_influencers', JSON.stringify(this.influencers));
      
      return {
        success: true,
        message: `Influencer ${username} added successfully`,
        influencersCount: this.influencers.length
      };
    } catch (error) {
      logger.error(`${this.moduleName}: Add influencer error - ${error.message}`);
      throw new Error(`Failed to add influencer: ${error.message}`);
    }
  }

  /**
   * Fetch recent tweets from monitored influencers
   * @returns {Promise<Array>} Recent tweets
   */
  async fetchRecentTweets() {
    try {
      logger.info(`${this.moduleName}: Fetching recent tweets from ${this.influencers.length} influencers`);
      
      if (!process.env.TWITTER_BEARER_TOKEN) {
        throw new Error('Twitter API token not configured');
      }
      
      const tweets = [];
      
      // In a real implementation, this would use the Twitter API
      // For this example, we'll simulate the response
      for (const influencer of this.influencers.slice(0, 5)) {
        const simulatedTweets = this.simulateTweets(influencer);
        tweets.push(...simulatedTweets);
      }
      
      // Store tweets in database
      for (const tweet of tweets) {
        await TwitterMonitor.create({
          tweetId: tweet.id,
          username: tweet.username,
          content: tweet.text,
          sentiment: tweet.sentiment,
          sentimentScore: tweet.sentimentScore,
          relevanceScore: tweet.relevanceScore,
          detectedSymbols: tweet.symbols,
          detectedKeywords: tweet.keywords,
          metadata: {
            followers: tweet.followers,
            retweets: tweet.retweets,
            likes: tweet.likes
          }
        });
      }
      
      logger.info(`${this.moduleName}: Fetched and processed ${tweets.length} tweets`);
      
      return tweets;
    } catch (error) {
      logger.error(`${this.moduleName}: Tweet fetch error - ${error.message}`);
      throw new Error(`Failed to fetch tweets: ${error.message}`);
    }
  }

  /**
   * Simulate tweets for development purposes
   * @param {string} username - Twitter username
   * @returns {Array} Simulated tweets
   */
  simulateTweets(username) {
    const tweetCount = Math.floor(Math.random() * 3) + 1;
    const tweets = [];
    
    for (let i = 0; i < tweetCount; i++) {
      const sentiments = ['positive', 'negative', 'neutral'];
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      const sentimentScore = sentiment === 'positive' ? Math.random() * 0.5 + 0.5 :
                            sentiment === 'negative' ? Math.random() * 0.5 :
                            Math.random() * 0.3 + 0.35;
      
      const symbols = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP'];
      const tweetSymbols = symbols.filter(() => Math.random() > 0.7);
      
      const tweetKeywords = this.keywords.filter(() => Math.random() > 0.8);
      
      tweets.push({
        id: `tweet_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        username,
        text: `This is a simulated tweet about crypto ${tweetSymbols.join(' ')} ${tweetKeywords.join(' ')}`,
        sentiment,
        sentimentScore,
        relevanceScore: Math.random() * 0.7 + 0.3,
        symbols: tweetSymbols,
        keywords: tweetKeywords,
        followers: Math.floor(Math.random() * 1000000),
        retweets: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 5000)
      });
    }
    
    return tweets;
  }

  /**
   * Analyze tweets and generate trading signals
   * @returns {Promise<Array>} Generated trading signals
   */
  async analyzeTweets() {
    try {
      logger.info(`${this.moduleName}: Analyzing tweets for trading signals`);
      
      // Fetch recent tweets
      const tweets = await this.fetchRecentTweets();
      
      // Group tweets by symbol
      const symbolTweets = {};
      
      tweets.forEach(tweet => {
        if (tweet.symbols && tweet.symbols.length > 0) {
          tweet.symbols.forEach(symbol => {
            if (!symbolTweets[symbol]) {
              symbolTweets[symbol] = [];
            }
            symbolTweets[symbol].push(tweet);
          });
        }
      });
      
      // Generate signals for symbols with sufficient tweet volume
      const signals = [];
      
      for (const [symbol, symbolTweetList] of Object.entries(symbolTweets)) {
        if (symbolTweetList.length >= 3) {
          // Calculate aggregate sentiment
          const sentimentSum = symbolTweetList.reduce((sum, tweet) => {
            return sum + (tweet.sentiment === 'positive' ? tweet.sentimentScore :
                         tweet.sentiment === 'negative' ? -tweet.sentimentScore : 0);
          }, 0);
          
          const avgSentiment = sentimentSum / symbolTweetList.length;
          
          // Determine action based on sentiment
          let action = 'hold';
          if (avgSentiment > 0.3) action = 'buy';
          else if (avgSentiment < -0.3) action = 'sell';
          
          // Calculate confidence
          const confidence = Math.abs(avgSentiment) * 100;
          
          if (action !== 'hold') {
            // Create trading signal
            const signal = await TradingSignal.create({
              symbol,
              action,
              confidence: Math.min(confidence, 95), // Cap at 95%
              price: 0, // This would be fetched from market data in a real implementation
              timeframe: '24h',
              source: 'TWITTER_MONITOR',
              status: 'pending',
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              metadata: {
                tweetCount: symbolTweetList.length,
                avgSentiment,
                influencers: symbolTweetList.map(t => t.username)
              }
            });
            
            signals.push(signal);
            
            logger.info(`${this.moduleName}: Generated ${action} signal for ${symbol} with ${confidence.toFixed(2)}% confidence`);
          }
        }
      }
      
      return signals;
    } catch (error) {
      logger.error(`${this.moduleName}: Tweet analysis error - ${error.message}`);
      throw new Error(`Tweet analysis failed: ${error.message}`);
    }
  }
}

module.exports = new TwitterMonitorModule();