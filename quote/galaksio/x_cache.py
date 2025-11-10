import requests
from typing import Dict, Optional
from galaksio.constants import constants

XCACHE_BASE_URL = constants.get("XCACHE_BASE_URL", "https://api.xcache.io")

def get_xcache_pricing(operation: str = "create", size_mb: float = 100) -> Optional[Dict]:
    """
    Fetch xcache pricing by triggering a 402 Payment Required response.

    The xcache API is behind HTTPayer (402 payment system), so when we make
    a request without payment, it returns pricing information in the 402 response.

    Args:
        operation: The cache operation (create, set, get, etc.)
        size_mb: Estimated cache size in MB (for storage-based pricing)

    Returns:
        dict: Pricing information extracted from 402 response
    """

    # Try to create a cache to trigger 402 response
    url = f"{XCACHE_BASE_URL}/create"

    try:
        # Make request without payment headers - this should return 402
        resp = requests.post(url, json={"region": "us-east-1"}, timeout=5)

        # If we get 402, extract pricing from response
        if resp.status_code == 402:
            return _parse_402_response(resp, operation, size_mb)

        # If successful (shouldn't happen without payment), still return some info
        if resp.status_code == 200 or resp.status_code == 201:
            print("[xcache] Warning: Request succeeded without payment (unexpected)")
            return {
                "provider": "xcache",
                "operation": operation,
                "price_usd": 0.0,  # Free tier or cached response
                "billing_type": "pay-per-request",
                "status": "success_no_payment"
            }

    except requests.exceptions.RequestException as e:
        print(f"Error fetching xcache pricing: {e}")
        return None

    return None


def _parse_402_response(resp: requests.Response, operation: str, size_mb: float) -> Dict:
    """
    Parse the 402 Payment Required response to extract pricing information.

    HTTPayer 402 responses typically include:
    - Pay-To header: Payment address
    - Pay-Amount header: Amount in smallest unit
    - Pay-Currency header: Currency (e.g., USDC)
    - Pay-Network header: Blockchain network
    """

    headers = resp.headers

    # Extract payment information from headers
    pay_to = headers.get("Pay-To", "")
    pay_amount = headers.get("Pay-Amount", "0")
    pay_currency = headers.get("Pay-Currency", "USDC")
    pay_network = headers.get("Pay-Network", "base")

    # Convert amount to USD (assuming USDC/USD 1:1)
    try:
        # Pay-Amount is typically in smallest unit (e.g., microUSDC)
        amount_micro = int(pay_amount)
        price_usd = amount_micro / 1_000_000  # Convert microUSDC to USDC
    except (ValueError, TypeError):
        price_usd = 0.0

    # Try to parse response body for additional details
    try:
        body = resp.json()
    except:
        body = {"message": resp.text}

    return {
        "provider": "xcache",
        "operation": operation,
        "price_usd": price_usd,
        "currency": pay_currency,
        "network": pay_network,
        "recipient": pay_to,
        "billing_type": "pay-per-request",
        "size_mb": size_mb,
        "metadata": {
            "status_code": 402,
            "headers": {
                "pay_to": pay_to,
                "pay_amount": pay_amount,
                "pay_currency": pay_currency,
                "pay_network": pay_network
            },
            "response_body": body
        }
    }


def get_xcache_operation_pricing(operation: str, cache_id: str = "test", key: str = "test", size_mb: float = 1) -> Optional[Dict]:
    """
    Get pricing for specific xcache operations.

    Args:
        operation: Operation type (create, get, set, delete, list, ttl)
        cache_id: Cache ID (for operations that need it)
        key: Cache key (for operations that need it)
        size_mb: Estimated data size in MB

    Returns:
        dict: Pricing information
    """

    operation_urls = {
        "create": f"{XCACHE_BASE_URL}/create",
        "set": f"{XCACHE_BASE_URL}/{cache_id}/{key}",
        "get": f"{XCACHE_BASE_URL}/{cache_id}/{key}",
        "delete": f"{XCACHE_BASE_URL}/{cache_id}/{key}",
        "list": f"{XCACHE_BASE_URL}/{cache_id}",
        "ttl": f"{XCACHE_BASE_URL}/{cache_id}/{key}/ttl",
    }

    url = operation_urls.get(operation)
    if not url:
        print(f"Unknown xcache operation: {operation}")
        return None

    try:
        # Choose HTTP method based on operation
        if operation == "create":
            resp = requests.post(url, json={}, timeout=5)
        elif operation == "set":
            resp = requests.put(url, json={"value": "test"}, timeout=5)
        elif operation in ["get", "list", "ttl"]:
            resp = requests.get(url, timeout=5)
        elif operation == "delete":
            resp = requests.delete(url, timeout=5)
        else:
            resp = requests.get(url, timeout=5)

        if resp.status_code == 402:
            return _parse_402_response(resp, operation, size_mb)

    except requests.exceptions.RequestException as e:
        print(f"Error fetching xcache {operation} pricing: {e}")
        return None

    return None
