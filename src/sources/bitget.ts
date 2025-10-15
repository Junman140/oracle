/**
 * Bitget exchange connector
 * Uses public API, no authentication required for price data
 * Pi Network is listed as PIUSDT_SPBL
 */
import axios from 'axios';
import { PriceSource, PriceData, SourceError } from '../types';
import { logger } from '../utils/logger';

export class BitgetSource extends PriceSource {
  private baseUrl = 'https://api.bitget.com/api/spot/v1';

  async fetchPrice(): Promise<PriceData> {
    const startTime = Date.now();
    
    try {
      const url = `${this.baseUrl}/market/ticker`;
      
      logger.debug('Fetching price from Bitget', { symbol: this.symbol });
      
      const response = await axios.get(url, {
        params: {
          symbol: this.symbol,
        },
        timeout: 5000,
      });

      if (!response.data || response.data.code !== '00000' || !response.data.data) {
        throw new SourceError('Invalid response from Bitget', this.name);
      }

      const ticker = response.data.data;
      const price = parseFloat(ticker.close);
      const timestamp = new Date();

      if (!price || isNaN(price)) {
        throw new SourceError('Invalid price data from Bitget', this.name);
      }

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      logger.info('Bitget price fetched', { price, responseTime });

      return {
        price,
        timestamp,
        source: this.name,
        weight: this.weight,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.msg || error.message;
      this.recordError(errorMessage);
      logger.error('Bitget fetch error', { 
        error: errorMessage,
        symbol: this.symbol 
      });
      throw new SourceError(`Bitget error: ${errorMessage}`, this.name);
    }
  }
}

