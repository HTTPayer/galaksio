import requests
from galaksio.constants import constants

PINATA_BASE = constants.get("PINATA_BASE")

def get_pinata_storage_quote(file_size_bytes=1_000_000):
    """
    Request a Pinata x402 upload endpoint and extract the payment requirement.

    Returns:
        dict: quote info (amount, currency, network, USD equivalent)
    """
    payload = {
        "fileSize": file_size_bytes,
        "name": "testfile.txt",
        "keyvalues": {"test": "quote_probe"}
    }

    try:
        resp = requests.post(f"{PINATA_BASE}/pin/public", json=payload, timeout=15)
        
        if resp.status_code == 402:
            # print(json.dumps(resp.json(), indent=2))
            # Extract pricing headers
            headers = resp.headers
            data = resp.json().get("accepts")[0]
            amount = float(data.get("maxAmountRequired", 0))
            currency = headers.get("asset")
            network = headers.get("network")
            recipient = headers.get("payTo")
            
            # Optionally convert USDC → USD (1:1)
            usd = amount / 1e6  # since USDC ≈ 1 USD

            return {
                "file_size_bytes": file_size_bytes,
                "file_size_mb": round(file_size_bytes / 1_000_000, 2),
                "amount": amount,
                "currency": currency,
                "network": network,
                "recipient": recipient,
                "price_usd": usd
            }

        elif resp.ok:
            return {"note": "Request succeeded without payment (free tier?)"}
        else:
            return {"error": f"Unexpected status {resp.status_code}", "body": resp.text}

    except Exception as e:
        return {"error": str(e)}
