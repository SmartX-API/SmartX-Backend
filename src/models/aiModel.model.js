const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AIModel = sequelize.define('AIModel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('CYBER_METRICS', 'DEEPSEEK_AI', 'GROK_ENGINE'),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accuracy: {
    type: DataTypes.DECIMAL(5, 2)
  },
  parameters: {
    type: DataTypes.JSONB
  },
  lastTrainedAt: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('active', 'training', 'inactive'),
    defaultValue: 'active'
  },
  metadata: {
    type: DataTypes.JSONB
  }
});

module.exports = AIModel;