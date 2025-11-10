import requests
import json
from galaksio.constants import constants

AKASH_PRICING_URL = constants.get("AKASH_PRICING_URL")

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