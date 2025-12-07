#!/usr/bin/env python3
"""
Example: Using Galaksio Storage with QuoteEngine

Demonstrates how to get storage quotes from Galaksio Storage
and compare them with other providers.
"""

from galaksio.quote_engine import QuoteEngine, StorageSpec
import json


def example_storage_comparison():
    """Compare storage pricing across multiple providers"""
    print("\n" + "="*70)
    print("  STORAGE PRICING COMPARISON")
    print("="*70 + "\n")

    # Initialize the quote engine
    engine = QuoteEngine()

    # Define storage requirements
    storage_specs = [
        StorageSpec(size_gb=0.001, permanent=True),  # 1 MB
        StorageSpec(size_gb=0.01, permanent=True),   # 10 MB
        StorageSpec(size_gb=0.1, permanent=True),    # 100 MB
        StorageSpec(size_gb=1.0, permanent=True),    # 1 GB
    ]

    for spec in storage_specs:
        print(f"\n--- Storage Size: {spec.size_gb} GB ({spec.size_gb * 1000} MB) ---\n")

        # Get quotes from all storage providers
        comparison = engine.compare_storage(spec)

        if "error" in comparison:
            print(f"Error: {comparison['error']}")
            continue

        # Display results
        print(f"Total Providers: {comparison['total_providers']}")
        print("\nQuotes:")
        print("-" * 70)

        for quote in comparison['quotes']:
            provider = quote['provider']
            price = quote['price_usd']
            billing = quote['billing_period']
            metadata = quote.get('metadata', {})

            print(f"\nProvider: {provider}")
            print(f"  Price: ${price:.6f} USD")
            print(f"  Billing: {billing}")

            # Show additional details for galaksio_storage
            if provider == "galaksio_storage":
                if metadata.get('dynamic_pricing'):
                    print(f"  Dynamic Pricing: Yes")
                    breakdown = metadata.get('price_breakdown', {})
                    if breakdown:
                        print(f"    - Base Fee: ${breakdown.get('base_fee_usd', 0):.6f}")
                        print(f"    - Storage Cost: ${breakdown.get('storage_cost_usd', 0):.6f}")
                print(f"  Platform: {metadata.get('platform', 'N/A')}")
                print(f"  Permanent: {metadata.get('permanent', False)}")

        # Show best offer
        best = comparison.get('best_offer', {})
        if best:
            print("\n" + "="*70)
            print(f"BEST OFFER: {best['provider']} at ${best['price_usd']:.6f} USD")
            print("="*70)


def example_single_provider():
    """Get quotes from Galaksio Storage only"""
    print("\n" + "="*70)
    print("  GALAKSIO STORAGE QUOTES ONLY")
    print("="*70 + "\n")

    engine = QuoteEngine()

    test_sizes = [
        0.001,  # 1 MB
        0.01,   # 10 MB
        0.1,    # 100 MB
        1.0,    # 1 GB
    ]

    for size_gb in test_sizes:
        print(f"\n--- {size_gb} GB ({size_gb * 1000} MB) ---")

        spec = StorageSpec(size_gb=size_gb, permanent=True)
        quotes = engine.get_storage_quotes(spec, providers=["galaksio_storage"])

        if not quotes:
            print("No quotes available")
            continue

        quote = quotes[0]
        print(f"Provider: {quote.provider}")
        print(f"Price: ${quote.price_usd:.6f} USD")
        print(f"Billing: {quote.billing_period}")

        if quote.metadata.get('dynamic_pricing'):
            breakdown = quote.metadata.get('price_breakdown', {})
            print(f"\nPrice Breakdown:")
            print(f"  Base Fee: ${breakdown.get('base_fee_usd', 0):.6f}")
            print(f"  Storage Cost: ${breakdown.get('storage_cost_usd', 0):.6f}")
            print(f"  Total: ${breakdown.get('total_usd', 0):.6f}")


def example_direct_api():
    """Use the galaksio_storage module directly"""
    print("\n" + "="*70)
    print("  DIRECT API USAGE")
    print("="*70 + "\n")

    from galaksio.galaksio_storage import (
        check_galaksio_storage_health,
        get_galaksio_storage_quote
    )

    # Check API health
    print("Checking API health...")
    health = check_galaksio_storage_health()
    print(json.dumps(health, indent=2))

    if health.get('status') != 'healthy':
        print("\n⚠️  API may not be available")
        return

    # Get a quote
    print("\n\nGetting quote for 1 MB upload...")
    quote = get_galaksio_storage_quote(data_size_bytes=1_000_000)

    if 'error' in quote:
        print(f"Error: {quote['error']}")
    else:
        print(f"\nProvider: {quote.get('provider')}")
        print(f"Price: ${quote.get('price_usd', 0):.6f} USD")
        print(f"Network: {quote.get('network')}")
        print(f"Platform: {quote.get('platform')}")

        if quote.get('dynamic_pricing'):
            print(f"\nDynamic Pricing: Enabled")
            breakdown = quote.get('price_breakdown', {})
            print(f"Base Fee: ${breakdown.get('base_fee_usd', 0):.6f}")
            print(f"Storage Cost: ${breakdown.get('storage_cost_usd', 0):.6f}")


def main():
    """Run all examples"""
    print("\n" + "="*70)
    print("  GALAKSIO STORAGE INTEGRATION EXAMPLES")
    print("="*70)

    # Example 1: Compare across all providers
    try:
        example_storage_comparison()
    except Exception as e:
        print(f"\nError in storage comparison: {e}")

    # Example 2: Single provider
    try:
        example_single_provider()
    except Exception as e:
        print(f"\nError in single provider example: {e}")

    # Example 3: Direct API usage
    try:
        example_direct_api()
    except Exception as e:
        print(f"\nError in direct API example: {e}")

    print("\n" + "="*70)
    print("  EXAMPLES COMPLETE")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
