const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Trade = sequelize.define('Trade', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('buy', 'sell'),
    allowNull: false
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false
  },
  fee: {
    type: DataTypes.DECIMAL(18, 8),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  executedAt: {
    type: DataTypes.DATE
  },
  exchange: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orderId: {
    type: DataTypes.STRING
  },
  signalId: {
    type: DataTypes.UUID
  },
  profitLoss: {
    type: DataTypes.DECIMAL(18, 8)
  },
  notes: {
    type: DataTypes.TEXT
  }
});

module.exports = Trade;