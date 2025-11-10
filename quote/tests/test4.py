import requests
import json

PINATA_BASE = "https://402.pinata.cloud/v1"

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
            usd = amount  # since USDC ≈ 1 USD

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


if __name__ == "__main__":
    print("=" * 60)
    print("Pinata x402 Storage Pricing Test")
    print("=" * 60)

    for size_mb in [1, 10, 100]:
        size_bytes = size_mb * 1_000_000
        quote = get_pinata_storage_quote(size_bytes)
        print(f"\n[Test] {size_mb} MB")
        print(json.dumps(quote, indent=2))
    
    print("\n" + "=" * 60)
