/**
 * Price aggregation service
 * Combines prices from multiple sources using weighted averages
 */
import { PriceSource, PriceData, AggregatedPrice, SourcePriceDetail, PriceOracleError } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config';
import { cacheService } from './cache';

export class PriceAggregator {
  private sources: PriceSource[] = [];

  addSource(source: PriceSource): void {
    this.sources.push(source);
    logger.info('Price source added', { source: source.getName() });
  }

  async getAggregatedPrice(): Promise<AggregatedPrice> {
    // Check cache first
    const cacheKey = 'aggregated_price';
    const cached = cacheService.get<AggregatedPrice>(cacheKey);
    
    if (cached) {
      return { ...cached, cache_hit: true };
    }

    // Fetch from all sources in parallel
    const prices = await this.fetchAllPrices();

    if (prices.length < config.minSourcesRequired) {
      throw new PriceOracleError(
        `Insufficient data sources (${prices.length}/${config.minSourcesRequired} required)`
      );
    }

    // Remove outliers
    const filteredPrices = this.removeOutliers(prices);

    if (filteredPrices.length < config.minSourcesRequired) {
      logger.warn('Too many outliers detected, using all prices');
      // Fall back to all prices if too many were filtered
      return this.calculateAggregatedPrice(prices, false);
    }

    const result = this.calculateAggregatedPrice(filteredPrices, false);
    
    // Cache the result
    cacheService.set(cacheKey, result);

    return result;
  }

  private async fetchAllPrices(): Promise<PriceData[]> {
    const promises = this.sources.map(async (source) => {
      try {
        return await source.fetchPrice();
      } catch (error: any) {
        logger.warn('Failed to fetch from source', {
          source: source.getName(),
          error: error.message,
        });
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<PriceData> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  private removeOutliers(prices: PriceData[]): PriceData[] {
    if (prices.length < 3) {
      return prices; // Need at least 3 prices for outlier detection
    }

    // Calculate median
    const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)].price;

    // Filter out prices that deviate more than threshold from median
    const threshold = (config.outlierThresholdPercent / 100) * median;
    
    const filtered = prices.filter(p => {
      const deviation = Math.abs(p.price - median);
      const isOutlier = deviation > threshold;
      
      if (isOutlier) {
        logger.warn('Outlier detected', {
          source: p.source,
          price: p.price,
          median,
          deviation,
          threshold,
        });
      }
      
      return !isOutlier;
    });

    return filtered;
  }

  private calculateAggregatedPrice(prices: PriceData[], cacheHit: boolean): AggregatedPrice {
    // Calculate weighted average
    let totalWeight = 0;
    let weightedSum = 0;
    const sourcePrices: Record<string, SourcePriceDetail> = {};

    for (const priceData of prices) {
      const weight = priceData.weight || 1.0;
      weightedSum += priceData.price * weight;
      totalWeight += weight;

      sourcePrices[priceData.source] = {
        price: priceData.price,
        weight,
        timestamp: priceData.timestamp,
      };
    }

    const aggregatedPrice = weightedSum / totalWeight;

    // Calculate confidence score (0-1)
    // Based on number of sources and price consistency
    const sourceRatio = Math.min(prices.length / this.sources.length, 1.0);
    
    // Calculate coefficient of variation (CV) for consistency
    const mean = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p.price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    
    // Lower CV means higher consistency
    const consistencyScore = Math.max(0, 1 - cv * 10);
    
    const confidenceScore = (sourceRatio * 0.6 + consistencyScore * 0.4);

    logger.info('Price aggregated', {
      price: aggregatedPrice,
      sources_used: prices.length,
      confidence: confidenceScore,
      cv,
    });

    return {
      symbol: 'PI',
      price_usd: aggregatedPrice,
      timestamp: new Date(),
      sources_used: prices.length,
      total_sources: this.sources.length,
      aggregation_method: 'weighted_average',
      source_prices: sourcePrices,
      confidence_score: confidenceScore,
      cache_hit: cacheHit,
    };
  }

  getAllSourceStatuses() {
    return this.sources.map(source => source.getStatus());
  }
}

