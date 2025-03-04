const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimiter.middleware');
const smartMatrix = require('../modules/smartMatrix');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/sec-check/token:
 *   get:
 *     summary: Audit a token's security
 *     tags: [Security Check]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tokenId
 *         schema:
 *           type: string
 *         required: true
 *         description: Token ID to audit
 *     responses:
 *       200:
 *         description: Token security audit completed
 *       401:
 *         description: Not authenticated
 */
router.get('/token', authenticate, apiLimiter, async (req, res) => {
  try {
    const { tokenId } = req.query;
    
    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID parameter is required' });
    }
    
    logger.info(`Token security audit requested for token ${tokenId}`);
    
    // Get token from database
    const { Token } = require('../models');
    const token = await Token.findByPk(tokenId);
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // Simulate security audit
    const securityScore = Math.floor(Math.random() * 30) + 70; // 70-100 score
    const issues = [];
    
    if (securityScore < 80) {
      issues.push('Potential centralization risk in token distribution');
    }
    
    if (securityScore < 90) {
      issues.push('Consider implementing additional access controls');
    }
    
    res.status(200).json({
      tokenId,
      symbol: token.symbol,
      name: token.name,
      contractAddress: token.contractAddress,
      blockchain: token.blockchain,
      securityScore,
      issues,
      recommendations: [
        'Regular security audits',
        'Multi-signature wallet implementation',
        'Timelock for critical functions'
      ],
      auditTimestamp: new Date()
    });
  } catch (error) {
    logger.error(`Token security audit error: ${error.message}`);
    res.status(500).json({ error: 'Failed to complete security audit' });
  }
});

/**
 * @swagger
 * /api/sec-check/system:
 *   get:
 *     summary: Check system security status
 *     tags: [Security Check]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System security check completed
 *       401:
 *         description: Not authenticated
 */
router.get('/system', authenticate, authorize('admin'), apiLimiter, async (req, res) => {
  try {
    logger.info('System security check requested');
    
    // Simulate system security check
    const securityStatus = {
      firewall: {
        status: 'active',
        threatsBlocked: 2300000,
        lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      ddosProtection: {
        status: 'active',
        attacksThwarted: 15,
        lastAttack: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      apiSecurity: {
        rateLimit: 'enabled',
        jwtExpiration: '24h',
        bruteForceProtection: 'enabled'
      },
      databaseSecurity: {
        encryption: 'enabled',
        backups: 'daily',
        lastBackup: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      },
      vulnerabilities: []
    };
    
    res.status(200).json({
      securityStatus,
      overallStatus: 'secure',
      lastFullAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      recommendations: [
        'Schedule next security audit',
        'Update firewall rules',
        'Review API access patterns'
      ]
    });
  } catch (error) {
    logger.error(`System security check error: ${error.message}`);
    res.status(500).json({ error: 'Failed to complete system security check' });
  }
});

/**
 * @swagger
 * /api/sec-check/wallet:
 *   get:
 *     summary: Check wallet security
 *     tags: [Security Check]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *         required: true
 *         description: Wallet address to check
 *     responses:
 *       200:
 *         description: Wallet security check completed
 *       401:
 *         description: Not authenticated
 */
router.get('/wallet', authenticate, apiLimiter, async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Wallet address parameter is required' });
    }
    
    logger.info(`Wallet security check requested for ${address}`);
    
    // Simulate wallet security check
    const securityStatus = {
      address,
      riskLevel: 'low',
      knownEntity: false,
      transactions: {
        total: 156,
        suspicious: 0
      },
      interactedWith: {
        knownScams: 0,
        highRiskContracts: 0
      }
    };
    
    res.status(200).json({
      securityStatus,
      recommendations: [
        'Consider using a hardware wallet',
        'Enable multi-factor authentication',
        'Never share private keys'
      ],
      checkTimestamp: new Date()
    });
  } catch (error) {
    logger.error(`Wallet security check error: ${error.message}`);
    res.status(500).json({ error: 'Failed to complete wallet security check' });
  }
});

module.exports = router;