const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TwitterMonitor = sequelize.define('TwitterMonitor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tweetId: {
    type: DataTypes.STRING,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT
  },
  sentiment: {
    type: DataTypes.ENUM('positive', 'negative', 'neutral'),
    allowNull: false
  },
  sentimentScore: {
    type: DataTypes.DECIMAL(5, 2)
  },
  relevanceScore: {
    type: DataTypes.DECIMAL(5, 2)
  },
  detectedSymbols: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  detectedKeywords: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  metadata: {
    type: DataTypes.JSONB
  }
});

module.exports = TwitterMonitor;