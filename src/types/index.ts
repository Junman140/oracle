/**
 * Type definitions for the Pi Price Oracle
 */

export interface PriceData {
  price: number;
  timestamp: Date;
  source: string;
  weight?: number;
}

export interface AggregatedPrice {
  symbol: string;
  price_usd: number;
  timestamp: Date;
  sources_used: number;
  total_sources: number;
  aggregation_method: string;
  source_prices: Record<string, SourcePriceDetail>;
  confidence_score: number;
  cache_hit: boolean;
}

export interface SourcePriceDetail {
  price: number;
  weight: number;
  timestamp: Date;
}

export interface SourceStatus {
  name: string;
  status: 'active' | 'error' | 'disabled';
  last_success: Date | null;
  last_error: string | null;
  success_rate: number;
  avg_response_time_ms: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: Date;
}

export interface SourceConfig {
  name: string;
  enabled: boolean;
  weight: number;
  symbol: string;
  apiKey?: string;
  apiSecret?: string;
}

export abstract class PriceSource {
  protected name: string;
  protected weight: number;
  protected symbol: string;
  protected lastSuccess: Date | null = null;
  protected lastError: string | null = null;
  protected successCount: number = 0;
  protected errorCount: number = 0;
  protected responseTimes: number[] = [];

  constructor(name: string, weight: number, symbol: string) {
    this.name = name;
    this.weight = weight;
    this.symbol = symbol;
  }

  abstract fetchPrice(): Promise<PriceData>;

  getName(): string {
    return this.name;
  }

  getWeight(): number {
    return this.weight;
  }

  getStatus(): SourceStatus {
    const totalRequests = this.successCount + this.errorCount;
    const successRate = totalRequests > 0 ? this.successCount / totalRequests : 0;
    const avgResponseTime = 
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0;

    return {
      name: this.name,
      status: this.errorCount === 0 || this.successCount > 0 ? 'active' : 'error',
      last_success: this.lastSuccess,
      last_error: this.lastError,
      success_rate: successRate,
      avg_response_time_ms: avgResponseTime,
    };
  }

  protected recordSuccess(responseTime: number): void {
    this.successCount++;
    this.lastSuccess = new Date();
    this.responseTimes.push(responseTime);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }

  protected recordError(error: string): void {
    this.errorCount++;
    this.lastError = error;
  }
}

export class PriceOracleError extends Error {
  constructor(message: string, public source?: string) {
    super(message);
    this.name = 'PriceOracleError';
  }
}

export class SourceError extends Error {
  constructor(message: string, public source: string) {
    super(message);
    this.name = 'SourceError';
  }
}

