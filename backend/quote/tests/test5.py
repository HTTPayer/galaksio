from galaksio.akash import (get_akash_pricing)
from galaksio.arweave import (get_arweave_pricing)
from galaksio.pinata import (get_pinata_storage_quote)
import json

def main():
    print("=" * 60)
    print("Pinata x402 Storage Pricing Test")
    print("=" * 60)

    for size_mb in [1, 10, 100]:
        size_bytes = size_mb * 1_000_000
        quote = get_pinata_storage_quote(size_bytes)
        print(f"\n[Test] {size_mb} MB")
        print(json.dumps(quote, indent=2))

    print("\n" + "=" * 60)
    print("Arweave Storage Pricing Test")
    print("=" * 60)

    for size_gb in [1, 10, 100]:
        quote = get_arweave_pricing(size_gb)
        print(f"\n[Test] {size_gb} GB")
        print(json.dumps(quote, indent=2))

    print("\n" + "=" * 60)
    print("Akash Compute Pricing Test")
    print("=" * 60)

    compute_quote = get_akash_pricing(cpu_cores=2, memory_gb=4, storage_gb=50)
    print("\n[Compute Pricing]")
    print(json.dumps(compute_quote, indent=2))

if __name__ == "__main__":
    main()