"""
Test the unified QuoteEngine class
"""

from galaksio.quote_engine import QuoteEngine, ComputeSpec, StorageSpec
import json


def test_compute_comparison():
    """Test compute pricing comparison"""
    print("=" * 70)
    print("COMPUTE PRICING COMPARISON")
    print("=" * 70)

    engine = QuoteEngine()

    # Define compute requirements
    specs = [
        ComputeSpec(cpu_cores=1, memory_gb=2, storage_gb=10),
        ComputeSpec(cpu_cores=2, memory_gb=4, storage_gb=50),
        ComputeSpec(cpu_cores=4, memory_gb=8, storage_gb=100),
    ]

    for spec in specs:
        print(f"\n--- Spec: {spec.cpu_cores} CPU, {spec.memory_gb}GB RAM, {spec.storage_gb}GB Storage ---")

        comparison = engine.compare_compute(spec)

        if "error" in comparison:
            print(f"Error: {comparison['error']}")
            continue

        print(f"\nFound {comparison['total_providers']} provider(s)")

        print("\nAll Quotes:")
        for quote in comparison['quotes']:
            provider = quote['provider']
            price = quote['price_usd']
            period = quote['billing_period']
            print(f"  • {provider.upper()}: ${price:.2f}/{period}")

        print("\n✅ Best Offer:")
        best = comparison['best_offer']
        print(f"  Provider: {best['provider'].upper()}")
        print(f"  Price: ${best['price_usd']:.2f}/{best['billing_period']}")

        # Show competitor pricing if available
        if 'metadata' in best and 'competitors' in best['metadata']:
            print("\n  Competitors (from Akash API):")
            for comp, price in best['metadata']['competitors'].items():
                if price:
                    print(f"    - {comp.upper()}: ${price:.2f}/month")


def test_storage_comparison():
    """Test storage pricing comparison"""
    print("\n\n" + "=" * 70)
    print("STORAGE PRICING COMPARISON")
    print("=" * 70)

    engine = QuoteEngine()

    # Define storage requirements
    specs = [
        StorageSpec(size_gb=1, permanent=True),
        StorageSpec(size_gb=10, permanent=True),
        StorageSpec(size_gb=100, permanent=True),
    ]

    for spec in specs:
        print(f"\n--- Spec: {spec.size_gb}GB Storage (Permanent: {spec.permanent}) ---")

        comparison = engine.compare_storage(spec)

        if "error" in comparison:
            print(f"Error: {comparison['error']}")
            continue

        print(f"\nFound {comparison['total_providers']} provider(s)")

        print("\nAll Quotes:")
        for quote in comparison['quotes']:
            provider = quote['provider']
            price = quote['price_usd']
            period = quote['billing_period']
            print(f"  • {provider.upper()}: ${price:.2f} ({period})")

        print("\n✅ Best Offer:")
        best = comparison['best_offer']
        print(f"  Provider: {best['provider'].upper()}")
        print(f"  Price: ${best['price_usd']:.2f} ({best['billing_period']})")


def test_best_offer():
    """Test getting the single best offer across compute + storage"""
    print("\n\n" + "=" * 70)
    print("BEST OVERALL OFFER (Compute + Storage)")
    print("=" * 70)

    engine = QuoteEngine()

    compute_spec = ComputeSpec(cpu_cores=2, memory_gb=4, storage_gb=50)
    storage_spec = StorageSpec(size_gb=100, permanent=True)

    best = engine.get_best_offer(compute_spec=compute_spec, storage_spec=storage_spec)

    if best:
        print(f"\n✅ Best Offer:")
        print(f"  Provider: {best.provider.upper()}")
        print(f"  Category: {best.category}")
        print(f"  Price: ${best.price_usd:.2f}/{best.billing_period}")
        print(f"  Metadata: {json.dumps(best.metadata, indent=4)}")
    else:
        print("No offers available")


def test_export_formats():
    """Test exporting comparison in different formats"""
    print("\n\n" + "=" * 70)
    print("EXPORT FORMATS TEST")
    print("=" * 70)

    engine = QuoteEngine()
    spec = ComputeSpec(cpu_cores=2, memory_gb=4, storage_gb=50)
    comparison = engine.compare_compute(spec)

    # JSON export
    print("\n--- JSON Export ---")
    json_output = engine.export_comparison(comparison, format="json")
    print(json_output[:500] + "..." if len(json_output) > 500 else json_output)

    # Markdown export
    print("\n--- Markdown Export ---")
    md_output = engine.export_comparison(comparison, format="markdown")
    print(md_output)


def main():
    """Run all tests"""
    test_compute_comparison()
    test_storage_comparison()
    test_best_offer()
    test_export_formats()

    print("\n\n" + "=" * 70)
    print("✅ All tests completed!")
    print("=" * 70)


if __name__ == "__main__":
    main()
