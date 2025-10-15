/**
 * OKX exchange connector
 * Uses public API, no authentication required for price data
 * Pi Network is listed as PI/USDT
 */
import axios from 'axios';
import { PriceSource, PriceData, SourceError } from '../types';
import { logger } from '../utils/logger';

export class OKXSource extends PriceSource {
  private baseUrl = 'https://www.okx.com/api/v5';

  async fetchPrice(): Promise<PriceData> {
    const startTime = Date.now();
    
    try {
      const url = `${this.baseUrl}/market/ticker`;
      
      logger.debug('Fetching price from OKX', { symbol: this.symbol });
      
      const response = await axios.get(url, {
        params: {
          instId: this.symbol,
        },
        timeout: 5000,
      });

      if (!response.data || !response.data.data || !response.data.data[0]) {
        throw new SourceError('Invalid response from OKX', this.name);
      }

      const ticker = response.data.data[0];
      const price = parseFloat(ticker.last);
      const timestamp = new Date(parseInt(ticker.ts));

      if (!price || isNaN(price)) {
        throw new SourceError('Invalid price data from OKX', this.name);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      logger.info('OKX price fetched', { price, responseTime });

      return {
        price,
        timestamp,
        source: this.name,
        weight: this.weight,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.msg || error.message;
      this.recordError(errorMessage);
      logger.error('OKX fetch error', { 
        error: errorMessage,
        symbol: this.symbol 
      });
      throw new SourceError(`OKX error: ${errorMessage}`, this.name);
    }
  }
}

