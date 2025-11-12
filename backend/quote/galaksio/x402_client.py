"""
x402 Client - makes requests to x402 endpoints to get pricing
"""
import requests
from typing import Dict, Optional


def get_x402_quote(url: str, payload: dict = None, method: str = 'POST') -> Optional[Dict]:
    """
    Make request to x402 endpoint and extract payment requirements

    Args:
        url: The x402 endpoint URL
        payload: Request payload (for POST) or params (for GET)
        method: HTTP method (POST or GET)

    Returns:
        dict with price_usd, currency, network, recipient, x402_instructions
    """
    try:
        if method == 'POST':
            resp = requests.post(url, json=payload, timeout=15)
        else:
            resp = requests.get(url, params=payload, timeout=15)

        if resp.status_code == 402:
            headers = resp.headers
            data = resp.json()

            # Extract x402 payment data
            accepts = data.get("accepts", [{}])[0]
            amount = float(accepts.get("maxAmountRequired", 0))

            return {
                "price_usd": amount / 1e6,  # USDC to USD (assuming 6 decimals)
                "currency": headers.get("asset") or accepts.get("asset"),
                "network": headers.get("network") or accepts.get("network"),
                "recipient": headers.get("payTo") or accepts.get("payTo"),
                "x402_instructions": {
                    "scheme": accepts.get("scheme"),
                    "network": accepts.get("network"),
                    "payTo": accepts.get("payTo"),
                    "asset": accepts.get("asset"),
                    "maxAmountRequired": accepts.get("maxAmountRequired"),
                    "description": accepts.get("description")
                },
                "metadata": {
                    "status_code": resp.status_code,
                    "response": data
                }
            }

        # No payment required (200 OK or other)
        return {
            "price_usd": 0.0,
            "free": True,
            "metadata": {
                "status_code": resp.status_code,
                "note": "No payment required"
            }
        }

    except requests.exceptions.RequestException as e:
        print(f"Error getting x402 quote from {url}: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error getting x402 quote: {e}")
        return None
