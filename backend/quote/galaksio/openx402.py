"""
OpenX402 IPFS Storage - x402 integration

Provides quote functionality for uploading files to IPFS through the
OpenX402 API with fixed pricing: 0.01 USDC per file.

API: https://ipfs.openx402.ai
Process:
  1. POST /upload - Upload file to RAM (FREE), get file ID
  2. GET /pin/:id - Pay 0.01 USDC to permanently pin to IPFS

Limits:
  - Max file size: 100MB
  - Files expire after 1 hour if not pinned
  - Fixed price: 0.01 USDC per pin
"""

from galaksio.x402_client import get_x402_quote
from galaksio.constants import constants
from typing import Dict, Optional

OPENX402_BASE_URL = constants.get("OPENX402_BASE_URL", "https://ipfs.openx402.ai")
OPENX402_MAX_FILE_SIZE_MB = 100
OPENX402_MAX_FILE_SIZE_BYTES = OPENX402_MAX_FILE_SIZE_MB * 1_000_000


def get_openx402_storage_quote(
    file_size_bytes: int = 1_000_000,
    file_name: Optional[str] = None,
    file_content: Optional[str] = None,
    permanent: bool = False,
    ttl: Optional[int] = None
) -> Dict:
    """
    Get quote for IPFS storage via OpenX402.

    OpenX402 uses a 2-step process:
      1. Upload file to RAM (FREE) - no payment required
      2. Pin to IPFS (0.01 USDC) - requires x402 payment

    Args:
        file_size_bytes: Size of file to store (max 100MB)
        file_name: Optional file name
        file_content: Optional file content (not used for quotes)
        permanent: Whether to pin permanently (always true for IPFS)
        ttl: Time-to-live in seconds (not applicable for IPFS pinning)

    Returns:
        dict: quote info with price_usd, currency, network, x402_instructions
              or error dict if file is too large

    Example:
        >>> quote = get_openx402_storage_quote(50_000_000)  # 50MB
        >>> print(f"Cost: ${quote['price_usd']}")
    """
    # Check file size limit (100MB)
    if file_size_bytes > OPENX402_MAX_FILE_SIZE_BYTES:
        return {
            "error": f"File too large for OpenX402. Max size: {OPENX402_MAX_FILE_SIZE_MB}MB, requested: {round(file_size_bytes / 1_000_000, 2)}MB",
            "max_size_bytes": OPENX402_MAX_FILE_SIZE_BYTES,
            "max_size_mb": OPENX402_MAX_FILE_SIZE_MB,
            "requested_size_bytes": file_size_bytes,
            "provider": "openx402"
        }

    # For quote purposes, we call the /pin/:id endpoint to get x402 payment info
    # This is where the actual payment happens (0.01 USDC)
    # Using a sample/dummy ID to trigger 402 response with payment instructions
    url = f"{OPENX402_BASE_URL}/pin/quote_request"

    # GET request to pin endpoint triggers 402 payment required
    quote = get_x402_quote(url, payload=None, method='GET')

    if quote:
        quote['provider'] = 'openx402'
        quote['category'] = 'storage'
        quote['file_size_bytes'] = file_size_bytes
        quote['file_size_mb'] = round(file_size_bytes / 1_000_000, 2)
        quote['permanent'] = True  # IPFS pinning is permanent
        quote['billing_period'] = 'one-time'
        quote['platform'] = 'ipfs'
        quote['max_size_mb'] = OPENX402_MAX_FILE_SIZE_MB

        # OpenX402 has fixed pricing of 0.01 USDC per pin
        if 'price_usd' not in quote:
            quote['price_usd'] = 0.01

        # Add workflow info
        quote['workflow'] = {
            'step_1': 'POST /upload - Upload file to RAM (FREE)',
            'step_2': 'GET /pin/:id - Pin to IPFS (0.01 USDC) - Payment required here',
            'expiry': 'Files in RAM expire after 1 hour if not pinned',
            'quote_endpoint': '/pin/:id'
        }

        return quote

    return {"error": "Failed to get quote from OpenX402", "provider": "openx402"}
