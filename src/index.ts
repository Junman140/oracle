/**
 * Pi Price Oracle - Main Entry Point
 */
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { PriceAggregator } from './services/aggregator';
import { createApiRouter } from './routes/api';
import { createPiDataRouter } from './routes/pi-data';
import { createHorizonProxyRouter } from './routes/horizon-proxy';

// Import all price sources
import { CoinGeckoSource } from './sources/coingecko';
import { BitgetSource } from './sources/bitget';
import { OKXSource } from './sources/okx';

async function main() {
  logger.info('Starting Pi Price Oracle...');

  // Initialize Express app
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());

  // Request logging
  app.use((req, _res, next) => {
    logger.debug('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    next();
  });

  // Initialize price aggregator
  const aggregator = new PriceAggregator();

  // Add all price sources
  try {
    // CoinGecko (no API key required)
    aggregator.addSource(
      new CoinGeckoSource('coingecko', config.weights.coingecko, config.symbols.coingecko)
    );
    logger.info('✅ CoinGecko source added');

    // Bitget - Pi is listed as PIUSDT_SPBL
    aggregator.addSource(
      new BitgetSource('bitget', config.weights.bitget, config.symbols.bitget)
    );
    logger.info('✅ Bitget source added');

    // OKX - Pi is listed as PI-USDT  
    aggregator.addSource(
      new OKXSource('okx', config.weights.okx, config.symbols.okx)
    );
    logger.info('✅ OKX source added');

    logger.info('🚀 All price sources initialized successfully');
  } catch (error: any) {
    logger.error('Error initializing price sources', { error: error.message });
    process.exit(1);
  }

  // API Routes
  app.use('/api/v1', createApiRouter(aggregator));
  
  // Pi Network data endpoints (matching piscan.io format)
  app.use('/data', createPiDataRouter(aggregator));
  
  // Horizon API proxy (for blockchain data)
  app.use('/horizon', createHorizonProxyRouter());

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'Pi Price Oracle & API',
      version: '1.0.0',
      description: 'Aggregated price feed and Pi Network data API',
      endpoints: {
        // Price Oracle
        price: '/api/v1/price',
        sources: '/api/v1/sources',
        health: '/api/v1/health',
        
        // Pi Data (piscan.io compatible)
        piPrice: '/data/pi-price',
        mainnetSupply: '/data/mainnet-supply',
        checkScamWallet: '/check-scam-wallet/:address',
        
        // Horizon Proxy (blockchain data)
        horizon: '/horizon/*',
        account: '/horizon/accounts/:accountId',
        transactions: '/horizon/transactions',
      },
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.nodeEnv === 'development' ? err.message : 'An error occurred',
    });
  });

  // Start server
  const server = app.listen(config.port, () => {
    logger.info(`Pi Price Oracle running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Cache TTL: ${config.cacheTTL} seconds`);
    logger.info(`Visit http://localhost:${config.port} to get started`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the application
main().catch((error) => {
  logger.error('Fatal error during startup', { error: error.message });
  process.exit(1);
});

