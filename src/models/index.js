const { sequelize } = require('../config/database');
const User = require('./user.model');
const Trade = require('./trade.model');
const Token = require('./token.model');
const MarketData = require('./marketData.model');
const TradingSignal = require('./tradingSignal.model');
const TwitterMonitor = require('./twitterMonitor.model');
const AIModel = require('./aiModel.model');
const SystemLog = require('./systemLog.model');

// Define associations
User.hasMany(Trade);
Trade.belongsTo(User);

Token.hasMany(Trade);
Trade.belongsTo(Token);

MarketData.hasMany(TradingSignal);
TradingSignal.belongsTo(MarketData);

TwitterMonitor.hasMany(TradingSignal);
TradingSignal.belongsTo(TwitterMonitor);

AIModel.hasMany(TradingSignal);
TradingSignal.belongsTo(AIModel);

module.exports = {
  sequelize,
  User,
  Trade,
  Token,
  MarketData,
  TradingSignal,
  TwitterMonitor,
  AIModel,
  SystemLog
};