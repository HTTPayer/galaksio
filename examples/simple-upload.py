"""
Simple Galaksio Client Example (Python)

This example shows how to upload a file to Pinata via the Galaksio broker.

NOTE: This is a simplified example for testing WITHOUT payment.
For production, you need to implement the x402 payment flow.
"""

import requests
import json
from datetime import datetime

BROKER_URL = "http://localhost:8080"


def upload_to_pinata(file_url: str, file_name: str) -> dict:
    """Upload a file to Pinata via Galaksio broker"""
    print("🚀 Uploading file to Pinata via Galaksio...")
    print(f"File URL: {file_url}")
    print(f"File Name: {file_name}")

    payload = {
        "taskType": "storage",
        "fileUrl": file_url,
        "provider": "pinata",
        "meta": {
            "name": file_name,
            "timestamp": datetime.utcnow().isoformat()
        }
    }

    try:
        response = requests.post(
            f"{BROKER_URL}/run",
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 402:
            print("\n💰 Payment required!")
            print(f"Payment details: {json.dumps(response.json(), indent=2)}")
            payment_info = response.json()
            if "accepts" in payment_info and len(payment_info["accepts"]) > 0:
                accept = payment_info["accepts"][0]
                print("\nTo proceed:")
                print(f"1. Pay {accept['maxAmountRequired']} USDC to {accept['payTo']}")
                print("2. Get transaction hash")
                print("3. Retry with x-payment header containing proof")
            return None

        response.raise_for_status()

        result = response.json()
        print("\n✅ Upload successful!")
        print(f"Job ID: {result.get('jobId')}")
        print(f"Status: {result.get('status')}")
        print(f"Result: {json.dumps(result.get('result'), indent=2)}")

        return result

    except requests.exceptions.HTTPError as e:
        print(f"\n❌ Upload failed: {e}")
        if e.response is not None:
            print(f"Response: {e.response.text}")
        raise


def check_job_status(job_id: str) -> dict:
    """Check the status of a job"""
    print(f"\n🔍 Checking job status for: {job_id}")

    try:
        response = requests.get(f"{BROKER_URL}/status/{job_id}")
        response.raise_for_status()

        status = response.json()
        print(f"Job status: {json.dumps(status, indent=2)}")
        return status

    except requests.exceptions.HTTPError as e:
        print(f"❌ Failed to check status: {e}")
        if e.response is not None:
            print(f"Response: {e.response.text}")
        raise


def main():
    """Example usage"""
    file_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    file_name = "test-document.pdf"

    try:
        result = upload_to_pinata(file_url, file_name)

        # Optionally check status
        if result and result.get("jobId"):
            import time
            time.sleep(1)  # Wait 1 second
            check_job_status(result["jobId"])

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
