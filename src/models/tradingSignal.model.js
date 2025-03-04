const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TradingSignal = sequelize.define('TradingSignal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM('buy', 'sell', 'hold'),
    allowNull: false
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  price: {
    type: DataTypes.DECIMAL(18, 8)
  },
  targetPrice: {
    type: DataTypes.DECIMAL(18, 8)
  },
  stopLoss: {
    type: DataTypes.DECIMAL(18, 8)
  },
  timeframe: {
    type: DataTypes.STRING
  },
  source: {
    type: DataTypes.ENUM('CYBER_METRICS', 'TWITTER_MONITOR', 'DEEPSEEK_AI', 'GROK_ENGINE'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'executed', 'expired', 'cancelled'),
    defaultValue: 'pending'
  },
  expiresAt: {
    type: DataTypes.DATE
  },
  metadata: {
    type: DataTypes.JSONB
  }
});

module.exports = TradingSignal;