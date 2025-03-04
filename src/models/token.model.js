const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Token = sequelize.define('Token', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contractAddress: {
    type: DataTypes.STRING,
    unique: true
  },
  blockchain: {
    type: DataTypes.STRING,
    defaultValue: 'Solana'
  },
  totalSupply: {
    type: DataTypes.DECIMAL(24, 8)
  },
  circulatingSupply: {
    type: DataTypes.DECIMAL(24, 8)
  },
  decimals: {
    type: DataTypes.INTEGER,
    defaultValue: 9
  },
  createdBy: {
    type: DataTypes.UUID
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSONB
  }
});

module.exports = Token;