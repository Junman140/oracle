/**
 * Configuration management for the Pi Price Oracle
 */
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Cache
  cacheTTL: parseInt(process.env.CACHE_TTL_SECONDS || '30', 10),

  // Pi Symbols (configured for each source)
  symbols: {
    coingecko: process.env.PI_SYMBOL_COINGECKO || 'pi-network',
    bitget: process.env.PI_SYMBOL_BITGET || 'PIUSDT_SPBL',
    okx: process.env.PI_SYMBOL_OKX || 'PI-USDT',
  },

  // Aggregation
  outlierThresholdPercent: parseInt(process.env.OUTLIER_THRESHOLD_PERCENT || '10', 10),
  minSourcesRequired: parseInt(process.env.MIN_SOURCES_REQUIRED || '1', 10),

  // Source Weights (for weighted average calculation)
  weights: {
    coingecko: parseFloat(process.env.WEIGHT_COINGECKO || '1.5'),
    bitget: parseFloat(process.env.WEIGHT_BITGET || '2.0'),
    okx: parseFloat(process.env.WEIGHT_OKX || '2.0'),
  },
};

