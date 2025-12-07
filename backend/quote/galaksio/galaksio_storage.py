"""
Galaksio Storage integration - Arweave permanent storage via x402

Provides quote functionality for uploading data to Arweave through the
Galaksio Storage API with dynamic pricing based on actual network costs.
"""

from galaksio.x402_client import get_x402_quote
from galaksio.constants import constants
from typing import Dict, Optional
import json

GALAKSIO_STORAGE_BASE_URL = constants.get("GALAKSIO_STORAGE_BASE_URL", "https://storage.galaksio.cloud")


def get_galaksio_storage_quote(data_size_bytes: int = 1_000) -> Dict:
    """
    Get quote for uploading data to Arweave via Galaksio Storage with dynamic pricing.

    The pricing is calculated dynamically based on:
    - Base fee: $0.01
    - Arweave storage cost: varies by data size and current AR/USD rate

    Args:
        data_size_bytes: Size of data to upload in bytes (default: 1KB)

    Returns:
        dict: quote info with price_usd, currency, network, x402_instructions

    Example:
        >>> quote = get_galaksio_storage_quote(10000)  # 10KB
        >>> print(f"Upload cost: ${quote['price_usd']:.6f}")
    """
    url = f"{GALAKSIO_STORAGE_BASE_URL}/upload"

    # Create a sample payload to trigger 402 response with dynamic pricing
    payload = {
        "data": "x" * data_size_bytes,  # Sample data of requested size
        "content_type": "text/plain",
        "is_base64": False
    }

    quote = get_x402_quote(url, payload, method='POST')

    if quote:
        quote['provider'] = 'galaksio_storage'
        quote['category'] = 'storage'
        quote['data_size_bytes'] = data_size_bytes
        quote['data_size_kb'] = round(data_size_bytes / 1024, 2)
        quote['data_size_mb'] = round(data_size_bytes / (1024 * 1024), 2)
        quote['permanent'] = True
        quote['billing_period'] = 'one-time'
        quote['platform'] = 'arweave'

        # Extract dynamic pricing info if available
        if 'metadata' in quote and 'response' in quote['metadata']:
            accepts = quote['metadata']['response'].get('accepts', [{}])[0]
            if 'extra' in accepts:
                extra = accepts['extra']
                quote['dynamic_pricing'] = extra.get('dynamicPricing', False)
                quote['price_breakdown'] = {
                    'total_usd': extra.get('priceUSD'),
                    'base_fee_usd': 0.01,  # Base fee from server config
                    'storage_cost_usd': extra.get('priceUSD', 0.01) - 0.01 if extra.get('priceUSD') else 0
                }

        return quote

    return {"error": "Failed to get quote from Galaksio Storage"}


def get_galaksio_data_retrieve_quote(tx_id: str = "sample_tx_id") -> Dict:
    """
    Get quote for retrieving data from Arweave via Galaksio Storage.

    Static pricing: $0.001 per retrieval

    Args:
        tx_id: Arweave transaction ID (placeholder for quote)

    Returns:
        dict: quote info with price_usd, currency, network, x402_instructions

    Example:
        >>> quote = get_galaksio_data_retrieve_quote()
        >>> print(f"Retrieval cost: ${quote['price_usd']:.6f}")
    """
    url = f"{GALAKSIO_STORAGE_BASE_URL}/data/{tx_id}"

    quote = get_x402_quote(url, payload=None, method='GET')

    if quote:
        quote['provider'] = 'galaksio_storage'
        quote['category'] = 'storage'
        quote['operation'] = 'retrieve'
        quote['billing_period'] = 'pay-per-request'
        quote['platform'] = 'arweave'

        return quote

    return {"error": "Failed to get retrieval quote from Galaksio Storage"}


def get_galaksio_query_quote() -> Dict:
    """
    Get quote for querying Arweave transactions via Galaksio Storage.

    Static pricing: $0.005 per query

    Returns:
        dict: quote info with price_usd, currency, network, x402_instructions

    Example:
        >>> quote = get_galaksio_query_quote()
        >>> print(f"Query cost: ${quote['price_usd']:.6f}")
    """
    url = f"{GALAKSIO_STORAGE_BASE_URL}/query"

    # Sample query payload
    payload = {
        "op": "equals",
        "name": "Content-Type",
        "value": "application/json"
    }

    quote = get_x402_quote(url, payload, method='POST')

    if quote:
        quote['provider'] = 'galaksio_storage'
        quote['category'] = 'storage'
        quote['operation'] = 'query'
        quote['billing_period'] = 'pay-per-request'
        quote['platform'] = 'arweave'

        return quote

    return {"error": "Failed to get query quote from Galaksio Storage"}


def check_galaksio_storage_health() -> Dict:
    """
    Check Galaksio Storage API health and connectivity.

    Returns:
        dict: health status information

    Example:
        >>> health = check_galaksio_storage_health()
        >>> print(f"Status: {health.get('status')}")
    """
    import requests

    try:
        url = f"{GALAKSIO_STORAGE_BASE_URL}/health"
        resp = requests.get(url, timeout=10)

        if resp.ok:
            data = resp.json()
            return {
                "status": "healthy",
                "api_available": True,
                "arweave_connected": data.get("arweave_connected", False),
                "wallet_address": data.get("wallet_address"),
                "wallet_balance_ar": data.get("wallet_balance_ar"),
                "payment_network": data.get("payment_network"),
                "url": GALAKSIO_STORAGE_BASE_URL
            }
        else:
            return {
                "status": "error",
                "api_available": False,
                "error": f"HTTP {resp.status_code}",
                "url": GALAKSIO_STORAGE_BASE_URL
            }

    except Exception as e:
        return {
            "status": "error",
            "api_available": False,
            "error": str(e),
            "url": GALAKSIO_STORAGE_BASE_URL
        }


def get_galaksio_storage_info() -> Dict:
    """
    Get Galaksio Storage API information and pricing overview.

    Returns:
        dict: API information, endpoints, and pricing model

    Example:
        >>> info = get_galaksio_storage_info()
        >>> print(f"Service: {info.get('service')}")
    """
    import requests

    try:
        url = f"{GALAKSIO_STORAGE_BASE_URL}/"
        resp = requests.get(url, timeout=10)

        if resp.ok:
            data = resp.json()
            return {
                "service": data.get("service"),
                "description": data.get("description"),
                "version": data.get("version"),
                "endpoints": data.get("endpoints"),
                "pricing_model": data.get("pricing_model"),
                "payment_network": data.get("payment_network"),
                "docs": f"{GALAKSIO_STORAGE_BASE_URL}{data.get('docs', '/docs')}",
                "url": GALAKSIO_STORAGE_BASE_URL
            }
        else:
            return {
                "error": f"HTTP {resp.status_code}",
                "url": GALAKSIO_STORAGE_BASE_URL
            }

    except Exception as e:
        return {
            "error": str(e),
            "url": GALAKSIO_STORAGE_BASE_URL
        }
