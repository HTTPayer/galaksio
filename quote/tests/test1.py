import requests
import json

AKASH_PRICING_URL = "https://console-api.akash.network/v1/pricing"

def get_akash_pricing(cpu_cores=1, memory_gb=1, storage_gb=1):
    """
    Fetch pricing from Akash Network API.
    """

    # Units: CPU in millicores, memory/storage in bytes
    payload = {
        "cpu": cpu_cores * 1000,
        "memory": memory_gb * 1_000_000_000,
        "storage": storage_gb * 1_000_000_000
    }

    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(AKASH_PRICING_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Error fetching Akash pricing: {e}")
        if hasattr(e, "response") and e.response is not None:
            print("Response text:", e.response.text)
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("Akash Pricing API Test")
    print("=" * 60)

    configs = [
        ("Small", dict(cpu_cores=1, memory_gb=1, storage_gb=1)),
        ("Medium", dict(cpu_cores=2, memory_gb=4, storage_gb=100)),
        ("Large", dict(cpu_cores=4, memory_gb=8, storage_gb=500)),
    ]

    for label, cfg in configs:
        print(f"\n[{label}] instance: {cfg['cpu_cores']} CPU, {cfg['memory_gb']}GB RAM, {cfg['storage_gb']}GB storage")
        result = get_akash_pricing(**cfg)
        if result:
            print(json.dumps(result, indent=2))
        else:
            print("No result returned.")

    print("\n" + "=" * 60)
