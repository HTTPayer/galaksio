"""
xCache integration - Redis cache creation via x402

xCache provides instant Redis cache instances:
- Create cache: Uses x402 payment, returns cache ID with 50,000 operations included
- Topup is NOT supported through Galaksio (users topup directly via xCache)
"""

from galaksio.x402_client import get_x402_quote
from galaksio.constants import constants
from typing import Dict

XCACHE_BASE_URL = constants.get("XCACHE_BASE_URL", "https://api.xcache.io")


def get_xcache_create_quote(region: str = "us-east-1") -> Dict:
    """
    Get quote for creating a new xCache instance via x402

    Args:
        region: Primary region for cache deployment (default: us-east-1)

    Returns:
        dict: quote info with price_usd, currency, network, x402_instructions
    """
    url = f"{XCACHE_BASE_URL}/create"
    payload = {"region": region}

    quote = get_x402_quote(url, payload, method='POST')

    if quote:
        quote['provider'] = 'xcache'
        quote['operation'] = 'create'
        quote['region'] = region
        quote['operations_included'] = 50000
        return quote

    return {"error": "Failed to get quote from xCache"}
