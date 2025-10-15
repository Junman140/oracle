/**
 * CoinGecko API connector
 * Free tier: 50 calls/minute, no API key required
 */
import axios from 'axios';
import { PriceSource, PriceData, SourceError } from '../types';
import { logger } from '../utils/logger';

export class CoinGeckoSource extends PriceSource {
  private baseUrl = 'https://api.coingecko.com/api/v3';

  async fetchPrice(): Promise<PriceData> {
    const startTime = Date.now();
    
    try {
      const url = `${this.baseUrl}/simple/price?ids=${this.symbol}&vs_currencies=usd&include_last_updated_at=true`;
      
      logger.debug('Fetching price from CoinGecko', { symbol: this.symbol });
      
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = response.data[this.symbol];
      
      if (!data || !data.usd) {
        throw new SourceError('Invalid response from CoinGecko', this.name);
      }

      const price = data.usd;
      const timestamp = data.last_updated_at 
        ? new Date(data.last_updated_at * 1000)
        : new Date();

      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);

      logger.info('CoinGecko price fetched', { price, responseTime });

      return {
        price,
        timestamp,
        source: this.name,
        weight: this.weight,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.status?.error_message || error.message;
      this.recordError(errorMessage);
      logger.error('CoinGecko fetch error', { 
        error: errorMessage,
        symbol: this.symbol 
      });
      throw new SourceError(`CoinGecko error: ${errorMessage}`, this.name);
    }
  }
}

