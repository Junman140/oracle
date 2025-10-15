/**
 * API routes for the price oracle
 */
import { Router, Request, Response } from 'express';
import { PriceAggregator } from '../services/aggregator';
import { logger } from '../utils/logger';

const router = Router();
const startTime = Date.now();

export function createApiRouter(aggregator: PriceAggregator): Router {
  /**
   * GET /api/v1/price
   * Get the current aggregated Pi price
   */
  router.get('/price', async (_req: Request, res: Response) => {
    try {
      const price = await aggregator.getAggregatedPrice();
      res.json(price);
    } catch (error: any) {
      logger.error('Error fetching aggregated price', { error: error.message });
      res.status(500).json({
        error: 'Failed to fetch price',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/sources
   * Get status of all price sources
   */
  router.get('/sources', (_req: Request, res: Response) => {
    try {
      const sources = aggregator.getAllSourceStatuses();
      res.json({ sources });
    } catch (error: any) {
      logger.error('Error fetching source statuses', { error: error.message });
      res.status(500).json({
        error: 'Failed to fetch source statuses',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/v1/health
   * Health check endpoint
   */
  router.get('/health', (_req: Request, res: Response) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.json({
      status: 'healthy',
      uptime,
      timestamp: new Date(),
    });
  });

  return router;
}

