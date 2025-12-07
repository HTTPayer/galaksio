#!/usr/bin/env python3
"""
Test script for Galaksio Storage integration

Demonstrates fetching quotes from the Galaksio Storage API
"""

from galaksio.galaksio_storage import (
    get_galaksio_storage_quote,
    get_galaksio_data_retrieve_quote,
    get_galaksio_query_quote,
    check_galaksio_storage_health,
    get_galaksio_storage_info
)
import json


def print_section(title):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def test_health_check():
    """Test API health check"""
    print_section("Health Check")

    health = check_galaksio_storage_health()
    print(json.dumps(health, indent=2))

    if health.get("status") == "healthy":
        print("\n✓ Galaksio Storage API is healthy and ready!")
    else:
        print(f"\n✗ Health check failed: {health.get('error')}")

    return health.get("status") == "healthy"


def test_api_info():
    """Test API information endpoint"""
    print_section("API Information")

    info = get_galaksio_storage_info()
    print(json.dumps(info, indent=2))


def test_upload_quote():
    """Test upload quote with different file sizes"""
    print_section("Upload Quotes (Dynamic Pricing)")

    test_sizes = [
        (100, "100 bytes"),
        (1_000, "1 KB"),
        (10_000, "10 KB"),
        (100_000, "100 KB"),
        (1_000_000, "1 MB"),
    ]

    for size_bytes, label in test_sizes:
        print(f"\n--- {label} ---")
        quote = get_galaksio_storage_quote(data_size_bytes=size_bytes)

        if "error" in quote:
            print(f"Error: {quote['error']}")
        else:
            print(f"Provider: {quote.get('provider')}")
            print(f"Price: ${quote.get('price_usd', 0):.6f} USD")
            print(f"Network: {quote.get('network')}")
            print(f"Platform: {quote.get('platform')}")
            print(f"Permanent: {quote.get('permanent')}")

            if 'price_breakdown' in quote:
                breakdown = quote['price_breakdown']
                print(f"\nPrice Breakdown:")
                print(f"  - Base fee: ${breakdown.get('base_fee_usd', 0):.6f}")
                print(f"  - Storage cost: ${breakdown.get('storage_cost_usd', 0):.6f}")
                print(f"  - Total: ${breakdown.get('total_usd', 0):.6f}")


def test_retrieve_quote():
    """Test data retrieval quote"""
    print_section("Data Retrieval Quote")

    quote = get_galaksio_data_retrieve_quote()

    if "error" in quote:
        print(f"Error: {quote['error']}")
    else:
        print(f"Operation: {quote.get('operation')}")
        print(f"Price: ${quote.get('price_usd', 0):.6f} USD")
        print(f"Billing: {quote.get('billing_period')}")


def test_query_quote():
    """Test query quote"""
    print_section("Query Quote")

    quote = get_galaksio_query_quote()

    if "error" in quote:
        print(f"Error: {quote['error']}")
    else:
        print(f"Operation: {quote.get('operation')}")
        print(f"Price: ${quote.get('price_usd', 0):.6f} USD")
        print(f"Billing: {quote.get('billing_period')}")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  GALAKSIO STORAGE INTEGRATION TEST")
    print("="*60)

    # Test health check first
    is_healthy = test_health_check()

    if not is_healthy:
        print("\n⚠️  Warning: API may not be available. Continuing with tests...")

    # Test API info
    test_api_info()

    # Test upload quotes
    test_upload_quote()

    # Test retrieve quote
    test_retrieve_quote()

    # Test query quote
    test_query_quote()

    print_section("Test Complete")
    print("All Galaksio Storage integration tests completed!\n")


if __name__ == "__main__":
    main()
