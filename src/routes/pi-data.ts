/**
 * Pi Network data endpoints - matching piscan.io API format
 */
import { Router, Request, Response } from 'express';
import { PriceAggregator } from '../services/aggregator';
import { logger } from '../utils/logger';
import axios from 'axios';

const router = Router();

// Pi Network Horizon API
const HORIZON_API = 'https://api.mainnet.minepi.com';

export function createPiDataRouter(aggregator: PriceAggregator): Router {
  /**
   * GET /data/pi-price
   * Returns price data in piscan.io format
   * Format: { data: [{ idxPx, high24h, open24h, low24h }] }
   */
  router.get('/pi-price', async (_req: Request, res: Response) => {
    try {
      const priceData = await aggregator.getAggregatedPrice();
      const price = priceData.price_usd.toFixed(4);
      
      // Format response to match piscan.io structure
      res.json({
        data: [{
          idxPx: price,
          high24h: price, // We'd need 24h data for this
          open24h: price,
          low24h: price,
        }]
      });
    } catch (error: any) {
      logger.error('Error fetching Pi price', { error: error.message });
      res.status(500).json({
        error: 'Failed to fetch Pi price',
        message: error.message,
      });
    }
  });

  /**
   * GET /data/mainnet-supply
   * Get Pi mainnet supply data
   */
  router.get('/mainnet-supply', async (_req: Request, res: Response) => {
    try {
      // This would need to be calculated from blockchain data
      // For now, return structure that matches piscan.io
      const response = await axios.get(`${HORIZON_API}`);
      
      res.json({
        total_circulating_supply: 0,
        total_locked: 0,
        total_supply: 0,
        // Add blockchain data when available
      });
    } catch (error: any) {
      logger.error('Error fetching supply data', { error: error.message });
      res.status(500).json({
        error: 'Failed to fetch supply data',
        message: error.message,
      });
    }
  });

  /**
   * GET /check-scam-wallet/:address
   * Check if wallet is flagged as scam
   */
  router.get('/check-scam-wallet/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      // TODO: Implement scam checking logic
      // For now, return safe
      res.json({
        address,
        is_scam: false,
        reason: null,
      });
    } catch (error: any) {
      logger.error('Error checking scam wallet', { error: error.message });
      res.status(500).json({
        error: 'Failed to check wallet',
        message: error.message,
      });
    }
  });

  return router;
}

