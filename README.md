# Pi Network Price Oracle

A robust, cost-effective price oracle built with TypeScript that aggregates Pi Network coin prices from multiple sources to provide a unified, continuous price feed.

## Features

- **Multiple Data Sources**: Aggregates from CoinGecko, CoinMarketCap, and major exchanges
- **Cost Effective**: Uses free API tiers with intelligent caching and rate limiting
- **Real-time Updates**: Efficient polling with configurable intervals
- **Weighted Aggregation**: Smart price averaging with outlier detection
- **Fault Tolerant**: Continues operating even if some sources fail
- **REST API**: Simple HTTP endpoints to fetch aggregated prices
- **TypeScript**: Fully typed for better developer experience
- **Monitoring**: Built-in health checks and source reliability tracking

## Data Sources

### Free APIs (No Authentication Required)
- **CoinGecko API**: Free tier, 50 calls/min, no API key required
- **CoinMarketCap API**: Free tier (10,000 calls/month) - API key needed

### Exchanges (Public Endpoints)
- **Binance**: Free API, high volume, reliable
- **Coinbase**: Free API access
- **Kraken**: Free API access
- **KuCoin**: Free API access (3 calls/sec)
- **Bitfinex**: Free API access

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Price Oracle (TypeScript)          │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐      ┌──────────────┐       │
│  │ API Sources  │      │  Exchanges   │       │
│  ├──────────────┤      ├──────────────┤       │
│  │ CoinGecko    │      │ Binance      │       │
│  │ CoinMarketCap│      │ Coinbase     │       │
│  └──────────────┘      │ Kraken       │       │
│         │              │ KuCoin       │       │
│         │              │ Bitfinex     │       │
│         └──────────────┴──────────────┘       │
│                    │                            │
│            ┌───────▼────────┐                  │
│            │  Node Cache    │                  │
│            │ (30s TTL)      │                  │
│            └───────┬────────┘                  │
│                    │                            │
│            ┌───────▼────────┐                  │
│            │   Aggregator   │                  │
│            │ (Weighted Avg) │                  │
│            └───────┬────────┘                  │
│                    │                            │
│            ┌───────▼────────┐                  │
│            │  Express API   │                  │
│            └────────────────┘                  │
└─────────────────────────────────────────────────┘
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd oracle
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys (optional for most sources)
```

4. Build and run:
```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## Configuration

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Cache Configuration
CACHE_TTL_SECONDS=30

# API Keys (Optional)
COINMARKETCAP_API_KEY=your_key_here

# Pi Network Symbols (customize if needed)
PI_SYMBOL_COINGECKO=pi-network
PI_SYMBOL_CMC=18041
PI_SYMBOL_BINANCE=PIUSDT
PI_SYMBOL_COINBASE=PI-USD
PI_SYMBOL_KRAKEN=PIUSD
PI_SYMBOL_KUCOIN=PI-USDT
PI_SYMBOL_BITFINEX=tPIUSD
```

### Cost Analysis

| Source        | Free Tier Limit    | Cost After Free | Authentication Required |
|---------------|-------------------|-----------------|-------------------------|
| CoinGecko     | 50 calls/min      | $0              | No                      |
| CoinMarketCap | 10,000/month      | $0-$79/month    | Yes (free key)          |
| Binance       | 1200/min          | $0              | No (public endpoint)    |
| Coinbase      | 10,000/hour       | $0              | No (public endpoint)    |
| Kraken        | 15/sec            | $0              | No (public endpoint)    |
| KuCoin        | 3/sec public      | $0              | No (public endpoint)    |
| Bitfinex      | Rate limited      | $0              | No (public endpoint)    |

**Total Monthly Cost with Caching**: **$0**

With 30-second caching:
- 2,880 requests/day (1 per 30 seconds)
- ~86,400 requests/month
- Well within all free tiers!

## API Endpoints

### Get Current Pi Price
```
GET /api/v1/price
```

**Response:**
```json
{
  "symbol": "PI",
  "price_usd": 1.23,
  "timestamp": "2025-10-14T12:00:00.000Z",
  "sources_used": 7,
  "total_sources": 7,
  "aggregation_method": "weighted_average",
  "source_prices": {
    "coingecko": { "price": 1.22, "weight": 1.5, "timestamp": "2025-10-14T12:00:00.000Z" },
    "coinmarketcap": { "price": 1.24, "weight": 1.5, "timestamp": "2025-10-14T12:00:00.000Z" },
    "binance": { "price": 1.23, "weight": 2.0, "timestamp": "2025-10-14T12:00:00.000Z" },
    "coinbase": { "price": 1.22, "weight": 1.5, "timestamp": "2025-10-14T12:00:00.000Z" },
    "kraken": { "price": 1.23, "weight": 1.5, "timestamp": "2025-10-14T12:00:00.000Z" },
    "kucoin": { "price": 1.23, "weight": 1.0, "timestamp": "2025-10-14T12:00:00.000Z" },
    "bitfinex": { "price": 1.24, "weight": 1.0, "timestamp": "2025-10-14T12:00:00.000Z" }
  },
  "confidence_score": 0.95,
  "cache_hit": false
}
```

### Health Check
```
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2025-10-14T12:00:00.000Z"
}
```

### Source Status
```
GET /api/v1/sources
```

**Response:**
```json
{
  "sources": [
    {
      "name": "coingecko",
      "status": "active",
      "last_success": "2025-10-14T12:00:00.000Z",
      "last_error": null,
      "success_rate": 0.99,
      "avg_response_time_ms": 250
    },
    ...
  ]
}
```

## Aggregation Strategy

1. **Parallel Fetching**: Fetch prices from all sources simultaneously
2. **Outlier Detection**: Remove prices that deviate >10% from median
3. **Weighted Average**: Calculate weighted average based on source reliability:
   - CoinGecko: 1.5x (aggregated data)
   - CoinMarketCap: 1.5x (aggregated data)
   - Binance: 2.0x (highest volume exchange)
   - Coinbase: 1.5x (reputable exchange)
   - Kraken: 1.5x (reputable exchange)
   - KuCoin: 1.0x (medium volume)
   - Bitfinex: 1.0x (medium volume)
4. **Confidence Score**: Based on number of sources and price consistency
5. **Caching**: Results cached for 30 seconds to minimize API calls

## Project Structure

```
oracle/
├── src/
│   ├── sources/
│   │   ├── base.ts              # Base source interface
│   │   ├── coingecko.ts         # CoinGecko connector
│   │   ├── coinmarketcap.ts     # CoinMarketCap connector
│   │   ├── binance.ts           # Binance connector
│   │   ├── coinbase.ts          # Coinbase connector
│   │   ├── kraken.ts            # Kraken connector
│   │   ├── kucoin.ts            # KuCoin connector
│   │   └── bitfinex.ts          # Bitfinex connector
│   ├── services/
│   │   ├── aggregator.ts        # Price aggregation logic
│   │   └── cache.ts             # Caching service
│   ├── routes/
│   │   └── api.ts               # API routes
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   ├── logger.ts            # Winston logger
│   │   └── errors.ts            # Custom error classes
│   ├── config.ts                # Configuration management
│   └── index.ts                 # Application entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Development

### Build
```bash
npm run build
```

### Run in Development Mode
```bash
npm run dev
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

### Testing
```bash
npm test
```

## Error Handling

- **Graceful Degradation**: Continues operating if some sources fail
- **Retry Logic**: Automatic retries with exponential backoff
- **Fallback to Cache**: Uses cached data if all sources temporarily fail
- **Detailed Logging**: Winston logger for monitoring and debugging
- **Confidence Scoring**: Lower confidence when fewer sources are available

## Monitoring & Logging

The oracle uses Winston for structured logging:

```typescript
// Log levels: error, warn, info, debug
logger.info('Price fetched successfully', { 
  source: 'binance', 
  price: 1.23 
});
```

Monitor the application:
- Check `/api/v1/health` for system status
- Review `/api/v1/sources` for individual source health
- Monitor confidence scores in price responses
- Check console logs for errors and warnings

## Future Enhancements

- [ ] WebSocket streaming for real-time price updates
- [ ] Historical price data storage (PostgreSQL/MongoDB)
- [ ] GraphQL API support
- [ ] Prometheus metrics export
- [ ] Docker containerization
- [ ] Kubernetes deployment configs
- [ ] Alert system for price anomalies
- [ ] Additional exchanges (Huobi, OKX, Gate.io)
- [ ] Price charts and visualization
- [ ] Admin dashboard

## License

MIT

## Contributing

Pull requests are welcome! Please ensure:
- Code follows TypeScript best practices
- All tests pass
- Code is properly formatted (Prettier)
- Linting passes (ESLint)

## Support

For issues and questions, please open a GitHub issue.
