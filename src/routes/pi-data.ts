/**
 * Pi Network data endpoints - matching piscan.io API format
 */
import { Router, Request, Response } from 'express';
import { PriceAggregator } from '../services/aggregator';
import { logger } from '../utils/logger';

const router = Router();

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching Pi price', { error: errorMessage });
      res.status(500).json({
        error: 'Failed to fetch Pi price',
        message: errorMessage,
      });
    }
  });

  /**
   * GET /data/mainnet-supply
   * Get Pi mainnet supply data
   * Returns supply data matching socialchain format
   */
  router.get('/mainnet-supply', async (_req: Request, res: Response) => {
    try {
      // TODO: Calculate from blockchain data when available
      // For now, return latest known values as fallback
      res.json({
        total_circulating_supply: 6600980756.30989,
        total_locked: 4968482226.44967,
        total_supply: 10155355009.7075,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching supply data', { error: errorMessage });
      res.json({
        total_circulating_supply: 6600980756.30989,
        total_locked: 4968482226.44967,
        total_supply: 10155355009.7075,
      });
    }
  });

  /**
   * GET /check-scam-wallet/:address
   * Check if wallet is flagged as scam
   * Matches piscan.io API format
   */
  router.get('/check-scam-wallet/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      
      // Known scam addresses (add to this list as needed)
      const knownScamAddresses = new Set<string>([
        // Add known scam addresses here
      ]);
      
      const is_scam = knownScamAddresses.has(address);
      
      res.json({
        address,
        is_scam,
        reason: is_scam ? 'Flagged as scam address' : null,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error checking scam wallet', { error: errorMessage });
      res.json({
        address: req.params.address,
        is_scam: false,
        reason: null,
      });
    }
  });

  /**
   * GET /top-accounts
   * Get top Pi accounts by balance
   */
  router.get('/top-accounts', async (_req: Request, res: Response) => {
    try {
      // TODO: Fetch from blockchain data when available
      res.json({
        accounts: [],
        total: 0,
        message: 'Top accounts data not yet available'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching top accounts', { error: errorMessage });
      res.json({
        accounts: [],
        total: 0,
        error: errorMessage
      });
    }
  });

  /**
   * GET /accounts/distribution
   * Get account distribution statistics
   */
  router.get('/accounts/distribution', async (_req: Request, res: Response) => {
    try {
      // TODO: Calculate from blockchain data when available
      res.json({
        distribution: [],
        total_accounts: 0,
        message: 'Account distribution data not yet available'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching account distribution', { error: errorMessage });
      res.json({
        distribution: [],
        total_accounts: 0,
        error: errorMessage
      });
    }
  });

  /**
   * GET /data/unlocknext30d
   * Get Pi unlock data for next 30 days
   */
  router.get('/data/unlocknext30d', async (_req: Request, res: Response) => {
    try {
      // TODO: Calculate from blockchain data when available
      res.json({
        unlocks: [],
        total_unlock: 0,
        message: 'Unlock data not yet available'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching unlock data', { error: errorMessage });
      res.json({
        unlocks: [],
        total_unlock: 0,
        error: errorMessage
      });
    }
  });

  /**
   * GET /data/unlockfull
   * Get full unlock statistics
   */
  router.get('/data/unlockfull', async (_req: Request, res: Response) => {
    try {
      // TODO: Calculate from blockchain data when available
      res.json({
        statistics: {},
        message: 'Full unlock statistics not yet available'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching unlock statistics', { error: errorMessage });
      res.json({
        statistics: {},
        error: errorMessage
      });
    }
  });

  /**
   * GET /data/nodemap
   * Get Pi node map data
   */
  router.get('/data/nodemap', async (_req: Request, res: Response) => {
    try {
      // TODO: Fetch from blockchain data when available
      res.json({
        nodes: [],
        total_nodes: 0,
        message: 'Node map data not yet available'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching node map', { error: errorMessage });
      res.json({
        nodes: [],
        total_nodes: 0,
        error: errorMessage
      });
    }
  });

  /**
   * GET /transactions
   * Get recent Pi transactions
   */
  router.get('/transactions', async (_req: Request, res: Response) => {
    try {
      // TODO: Fetch from blockchain data when available
      res.json({
        transactions: [],
        total: 0,
        message: 'Transaction data not yet available'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching transactions', { error: errorMessage });
      res.json({
        transactions: [],
        total: 0,
        error: errorMessage
      });
    }
  });

  return router;
}

