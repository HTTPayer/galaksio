import requests
import json

# Akash Console API endpoint for storage
AKASH_STORAGE_URL = "https://console-api.akash.network/v1/storage-pricing"

def get_akash_storage_pricing(storage_gb=100):
    """
    Fetch pricing for Akash decentralized storage.

    Args:
        storage_gb: Number of gigabytes to estimate.

    Returns:
        dict: Pricing comparison (Akash, AWS, GCP, Azure)
    """

    # Convert GB → bytes
    payload = {
        "storage": storage_gb * 1_000_000_000
    }

    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(AKASH_STORAGE_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Error fetching Akash storage pricing: {e}")
        if hasattr(e, "response") and e.response is not None:
            print("Response text:", e.response.text)
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("Akash Storage Pricing API Test")
    print("=" * 60)

    for gb in [10, 100, 1000]:
        print(f"\n[Test] {gb} GB Storage")
        result = get_akash_storage_pricing(storage_gb=gb)
        if result:
            print(json.dumps(result, indent=2))
            print(f"\nCost comparison (USD/month):")
            for k in ["akash", "aws", "gcp", "azure"]:
                if k in result:
                    print(f"  {k.upper():<6}: ${result[k]:.2f}")
        else:
            print("No result returned.")

    print("\n" + "=" * 60)
