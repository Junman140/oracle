/**
 * Horizon API proxy - proxies requests to Pi Network Horizon API
 */
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = Router();
const HORIZON_API = 'https://api.mainnet.minepi.com';

// Create axios instance with timeout
const horizonClient = axios.create({
  baseURL: HORIZON_API,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function createHorizonProxyRouter(): Router {
  /**
   * Proxy all Horizon API requests
   * This allows your frontend to call /horizon/* which proxies to Pi Network Horizon
   */
  router.all('/*', async (req: Request, res: Response) => {
    try {
      const path = req.path;
      const method = req.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
      
      logger.debug(`Proxying Horizon request: ${method.toUpperCase()} ${path}`);
      
      const response = await horizonClient.request({
        method,
        url: path,
        params: req.query,
        data: req.body,
      });

      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data || error.message;
      
      logger.error('Horizon proxy error', {
        path: req.path,
        status,
        message,
      });
      
      res.status(status).json({
        error: 'Horizon API error',
        message,
      });
    }
  });

  return router;
}

