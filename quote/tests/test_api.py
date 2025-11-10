"""
Refactored Test Script for Galaksio Quote Engine API

Run the API server first:
    python main.py

Then run this test script:
    python tests/test_api_refactored.py
"""

import requests
import json
from time import sleep

API_BASE = "http://localhost:4284"  # match your FastAPI server


# -------------------- Helpers --------------------

def print_section(title):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)


def post(endpoint: str, payload: dict):
    print(f"\nRequest Payload:\n{json.dumps(payload, indent=2)}")
    response = requests.post(f"{API_BASE}{endpoint}", json=payload)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        return data
    else:
        print(f"❌ Error: {response.text}")
        return None


def get(endpoint: str, params: dict = None):
    response = requests.get(f"{API_BASE}{endpoint}", params=params)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        return data
    else:
        print(f"❌ Error: {response.text}")
        return None


# -------------------- Tests --------------------

def test_health():
    print_section("Health Check")
    data = get("/health")
    assert data and data["status"] == "healthy"
    print("✅ Health check passed")


def test_root():
    print_section("Root Endpoint")
    data = get("/")
    assert data and "endpoints" in data
    print("✅ Root endpoint passed")


def test_providers():
    print_section("Providers List")
    data = get("/providers")
    assert data and "compute_providers" in data and "storage_providers" in data
    print("✅ Providers list passed")


def test_compute_quote():
    print_section("Compute Quote")
    payload = {
        "cpu_cores": 2,
        "memory_gb": 4,
        "storage_gb": 50
    }
    data = post("/quote/compute", payload)
    assert data and "quotes" in data or "quote" in data
    print("✅ Compute quote test passed")


def test_storage_quote():
    print_section("Storage Quote")
    payload = {
        "size_gb": 100,
        "permanent": True
    }
    data = post("/quote/storage", payload)
    assert data and "quotes" in data or "quote" in data
    print("✅ Storage quote test passed")


def test_orchestrated_quote():
    print_section("Orchestrated Quote (Hybrid)")
    payload = {
        "cpu_cores": 2,
        "memory_gb": 4,
        "storage_gb": 50,
        "size_gb": 100,
        "permanent": True
    }
    data = post("/quote", payload)
    assert data and "job_type" in data
    print(f"✅ Orchestrated quote detected job_type: {data['job_type']}")


def test_error_handling():
    print_section("Error Handling - Invalid Compute")
    payload = {"cpu_cores": -1, "memory_gb": 4, "storage_gb": 50}
    response = requests.post(f"{API_BASE}/quote/compute", json=payload)
    assert response.status_code == 422
    print("✅ Correctly rejected invalid input")


# -------------------- Run All --------------------

def main():
    print("=" * 70)
    print(" Galaksio Quote Engine API - Test Suite")
    print("=" * 70)
    print(f"\nAPI Base URL: {API_BASE}")
    print("Make sure the API server is running: python main.py")

    sleep(1)

    try:
        test_root()
        test_health()
        test_providers()
        test_compute_quote()
        test_storage_quote()
        test_orchestrated_quote()
        test_error_handling()

        print("\n" + "=" * 70)
        print(" ✅ All API Tests Completed Successfully!")
        print("=" * 70)

    except requests.exceptions.ConnectionError:
        print("\n❌ Could not connect to API server. Start the server first.")

    except AssertionError as e:
        print(f"\n❌ Assertion failed: {e}")


if __name__ == "__main__":
    main()
