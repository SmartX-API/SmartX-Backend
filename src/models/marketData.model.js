const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MarketData = sequelize.define('MarketData', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false
  },
  volume24h: {
    type: DataTypes.DECIMAL(24, 8)
  },
  marketCap: {
    type: DataTypes.DECIMAL(24, 8)
  },
  high24h: {
    type: DataTypes.DECIMAL(18, 8)
  },
  low24h: {
    type: DataTypes.DECIMAL(18, 8)
  },
  change24h: {
    type: DataTypes.DECIMAL(10, 2)
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  additionalData: {
    type: DataTypes.JSONB
  }
});

module.exports = MarketData;