import requests
import json

ARWEAVE_PRICE_URL = "https://arweave.net/price"

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


if __name__ == "__main__":
    print("=" * 60)
    print("Arweave Permanent Storage Pricing Test")
    print("=" * 60)

    for gb in [0.1, 1, 10]:
        print(f"\n[Test] {gb} GB storage (permanent)")
        result = get_arweave_pricing(storage_gb=gb)
        if result:
            print(json.dumps(result, indent=2))
            print(f"\nEstimated Cost:")
            print(f"  {result['price_ar']:.6f} AR")
            if result['price_usd']:
                print(f"  ≈ ${result['price_usd']:.2f} USD")
        else:
            print("No result returned.")

    print("\n" + "=" * 60)
