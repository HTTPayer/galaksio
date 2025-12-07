# Galaksio Storage Integration

Integration between the Galaksio Quote Engine and the Galaksio Storage API for fetching dynamic storage quotes on Arweave.

## Overview

The `galaksio_storage.py` module provides seamless integration with the Galaksio Storage API, enabling:

- Dynamic pricing quotes based on actual Arweave network costs
- x402 payment protocol support
- Permanent storage on Arweave
- Health monitoring and API information retrieval

## Architecture

```
┌─────────────────────┐
│   Quote Engine      │
│                     │
│  - Arweave          │
│  - Pinata           │
│  - Galaksio Storage │◄─── New Integration
│  - Filecoin         │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ galaksio_storage.py │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│  x402_client.py     │
└─────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│  Galaksio Storage API           │
│  https://storage.galaksio.cloud │
│                                 │
│  - POST /upload                 │
│  - GET /data/{tx_id}            │
│  - POST /query                  │
│  - GET /health                  │
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│  Arweave Network    │
└─────────────────────┘
```

## Files Created/Modified

### New Files

1. **`galaksio/galaksio_storage.py`**
   - Main integration module
   - Functions:
     - `get_galaksio_storage_quote()` - Get upload pricing
     - `get_galaksio_data_retrieve_quote()` - Get retrieval pricing
     - `get_galaksio_query_quote()` - Get query pricing
     - `check_galaksio_storage_health()` - Health check
     - `get_galaksio_storage_info()` - API information

2. **`test_galaksio_storage.py`**
   - Comprehensive test suite
   - Tests all integration functions
   - Displays pricing for different file sizes

3. **`example_galaksio_storage.py`**
   - Usage examples
   - Shows QuoteEngine integration
   - Demonstrates direct API usage

4. **`GALAKSIO_STORAGE_INTEGRATION.md`**
   - This documentation file

### Modified Files

1. **`galaksio/quote_engine.py`**
   - Added import for `galaksio_storage`
   - Added `galaksio_storage` to storage providers list
   - Added `_get_galaksio_storage()` method

2. **`galaksio/constants.py`**
   - Already contained `GALAKSIO_STORAGE_BASE_URL`

## Usage

### Basic Usage with QuoteEngine

```python
from galaksio.quote_engine import QuoteEngine, StorageSpec

# Initialize engine
engine = QuoteEngine()

# Define storage requirements
spec = StorageSpec(size_gb=1.0, permanent=True)

# Get quotes from all providers (including galaksio_storage)
comparison = engine.compare_storage(spec)

# Display results
print(f"Best offer: {comparison['best_offer']['provider']}")
print(f"Price: ${comparison['best_offer']['price_usd']:.6f}")
```

### Direct Module Usage

```python
from galaksio.galaksio_storage import get_galaksio_storage_quote

# Get quote for 1 MB upload
quote = get_galaksio_storage_quote(data_size_bytes=1_000_000)

print(f"Price: ${quote['price_usd']:.6f}")
print(f"Dynamic pricing: {quote.get('dynamic_pricing', False)}")

# Show price breakdown
breakdown = quote.get('price_breakdown', {})
print(f"Base fee: ${breakdown.get('base_fee_usd', 0):.6f}")
print(f"Storage cost: ${breakdown.get('storage_cost_usd', 0):.6f}")
```

### Health Check

```python
from galaksio.galaksio_storage import check_galaksio_storage_health

health = check_galaksio_storage_health()

if health['status'] == 'healthy':
    print(f"API is healthy!")
    print(f"Arweave wallet: {health['wallet_address']}")
    print(f"Balance: {health['wallet_balance_ar']} AR")
```

## Running Tests

### Test the integration
```bash
cd C:\Users\brand\projects\galaksio\core\backend\quote
python test_galaksio_storage.py
```

### Run examples
```bash
python example_galaksio_storage.py
```

## Features

### Dynamic Pricing

The Galaksio Storage API uses dynamic pricing based on:
- **Base Fee**: $0.01 (service fee)
- **Storage Cost**: Calculated from actual Arweave network fees
- **AR/USD Rate**: Live exchange rate from CoinGecko

Example pricing:
- 1 KB: ~$0.010 - $0.024
- 10 KB: ~$0.024
- 100 KB: ~$0.024
- 1 MB: ~$0.024+
- 10 MB: ~$0.030+

### x402 Payment Protocol

The integration supports the x402 payment protocol:
- USDC payments on multiple networks
- Base, Base Sepolia, Avalanche, Avalanche Fuji
- Signature-based payment verification
- Facilitator support for settlement

### Permanent Storage

Data stored via Galaksio Storage is:
- Permanently stored on Arweave
- Immutable and censorship-resistant
- Accessible via `https://arweave.net/{tx_id}`
- Queryable using ArQL

## Configuration

The API endpoint is configured in `constants.py`:

```python
constants = {
    "GALAKSIO_STORAGE_BASE_URL": "https://storage.galaksio.cloud"
}
```

For local development, you can update this to:
```python
"GALAKSIO_STORAGE_BASE_URL": "http://localhost:8000"
```

## API Endpoints

### Upload (Dynamic Pricing)
- **Endpoint**: `POST /upload`
- **Cost**: $0.01 base + dynamic storage cost
- **Returns**: Transaction ID and gateway URL

### Retrieve (Static Pricing)
- **Endpoint**: `GET /data/{tx_id}`
- **Cost**: $0.001 flat
- **Returns**: Stored data

### Query (Static Pricing)
- **Endpoint**: `POST /query`
- **Cost**: $0.005 flat
- **Returns**: Transaction IDs matching query

### Health Check (Free)
- **Endpoint**: `GET /health`
- **Cost**: Free
- **Returns**: API status and wallet info

## Response Format

All quote functions return a standardized dictionary:

```python
{
    "provider": "galaksio_storage",
    "category": "storage",
    "price_usd": 0.024,
    "currency": "USDC",
    "network": "base-sepolia",
    "recipient": "0x...",
    "billing_period": "one-time",
    "permanent": True,
    "platform": "arweave",
    "dynamic_pricing": True,
    "price_breakdown": {
        "base_fee_usd": 0.01,
        "storage_cost_usd": 0.014,
        "total_usd": 0.024
    },
    "x402_instructions": {
        "scheme": "exact",
        "network": "base-sepolia",
        "payTo": "0x...",
        "asset": "0x...",
        "maxAmountRequired": "24000",
        "description": "Upload data to Arweave"
    }
}
```

## Error Handling

All functions return error information when requests fail:

```python
{
    "error": "Failed to get quote from Galaksio Storage"
}
```

Or for health/info endpoints:
```python
{
    "status": "error",
    "api_available": False,
    "error": "Connection timeout"
}
```

## Integration with QuoteEngine

The `galaksio_storage` provider is automatically included when using QuoteEngine:

```python
engine = QuoteEngine()

# Get all storage quotes (includes galaksio_storage)
quotes = engine.get_storage_quotes(spec)

# Compare prices across providers
comparison = engine.compare_storage(spec)

# Get best offer
best = engine.get_best_offer(storage_spec=spec)
```

## Next Steps

Potential enhancements:
1. Add actual payment execution (not just quotes)
2. Add data upload functionality with x402 payment
3. Add data retrieval with payment
4. Add query functionality
5. Cache quotes to reduce API calls
6. Add retry logic for failed requests
7. Add metrics/logging for quote requests

## Support

- **Galaksio Storage Docs**: https://storage.galaksio.cloud/docs
- **x402 Protocol**: https://github.com/Markeljan/x402
- **Arweave**: https://arweave.org

## License

MIT
