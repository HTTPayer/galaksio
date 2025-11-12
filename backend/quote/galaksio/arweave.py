import requests
import json
from galaksio.constants import constants

ARWEAVE_PRICE_URL = constants.get("ARWEAVE_PRICE_URL")

def get_arweave_pricing(storage_gb=1):
    """
    Fetch Arweave storage pricing for permanent data storage.

    Args:
        storage_gb (float): Amount of storage in gigabytes.

    Returns:
        dict: Price in AR and USD (approx).
    """

    # Convert GB to bytes
    bytes_to_store = int(storage_gb * 1_000_000_000)

    try:
        resp = requests.get(f"{ARWEAVE_PRICE_URL}/{bytes_to_store}")
        resp.raise_for_status()

        # Response is in winston (1 AR = 1e12 winston)
        price_winston = int(resp.text.strip())
        price_ar = price_winston / 1e12

        # Optional: Fetch current AR/USD price from Coingecko
        cg = requests.get("https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd")
        cg_price = cg.json().get("arweave", {}).get("usd", 0)
        price_usd = price_ar * cg_price if cg_price else None

        return {
            "storage_gb": storage_gb,
            "bytes": bytes_to_store,
            "price_winston": price_winston,
            "price_ar": price_ar,
            "price_usd": price_usd,
        }

    except requests.exceptions.RequestException as e:
        print(f"Error fetching Arweave pricing: {e}")
        return None