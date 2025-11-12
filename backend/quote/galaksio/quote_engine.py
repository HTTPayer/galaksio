"""
Galaksio Quote Engine - Multi-cloud pricing aggregator

Provides a unified interface for fetching and comparing pricing across
Web2 (AWS, GCP, Azure) and Web3 (Akash, Arweave, Filecoin, Pinata) providers.
"""

from typing import Dict, List, Optional, Literal
from dataclasses import dataclass, asdict
from datetime import datetime
import json

# Import provider-specific fetchers
from galaksio.akash import get_akash_pricing
from galaksio.arweave import get_arweave_pricing
from galaksio.pinata import get_pinata_storage_quote
from galaksio.x_cache import get_xcache_create_quote


@dataclass
class ComputeSpec:
    """Specification for compute resources"""
    cpu_cores: float = 1
    memory_gb: float = 1
    storage_gb: float = 1
    gpu: Optional[str] = None  # GPU type (for future use)


@dataclass
class StorageSpec:
    """Specification for storage resources"""
    size_gb: float = 1
    duration_days: Optional[int] = None  # For temporary storage
    permanent: bool = False  # For Arweave-style permanent storage


@dataclass
class CacheSpec:
    """Specification for cache resources"""
    size_mb: float = 100  # Cache size in MB
    operation: str = "create"  # Operation type (create, get, set, delete, etc.)
    ttl_hours: Optional[int] = None  # Time-to-live in hours


@dataclass
class Quote:
    """Standardized quote from any provider"""
    provider: str
    category: Literal["compute", "storage", "cache", "hybrid"]
    price_usd: float
    currency: str = "USD"
    billing_period: str = "month"  # month, year, one-time, pay-per-request, etc.
    timestamp: str = None
    metadata: Dict = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()
        if self.metadata is None:
            self.metadata = {}


class QuoteEngine:
    """
    Main QuoteEngine class for fetching and comparing multi-cloud pricing
    """

    def __init__(self, cache_ttl: int = 300):
        """
        Initialize QuoteEngine

        Args:
            cache_ttl: Cache time-to-live in seconds (default: 5 minutes)
        """
        self.cache_ttl = cache_ttl
        self._cache = {}
        self.compute_providers = ["akash", "aws", "gcp", "azure"]
        self.storage_providers = ["arweave", "pinata", "filecoin"]
        self.cache_providers = ["xcache", "redis", "memcached"]
        self.providers = self.compute_providers + self.storage_providers + self.cache_providers
    # ==================== COMPUTE QUOTES ====================

    def get_compute_quotes(
        self,
        spec: ComputeSpec,
        providers: Optional[List[str]] = None
    ) -> List[Quote]:
        """
        Get compute pricing from multiple providers

        Args:
            spec: ComputeSpec with CPU, memory, storage requirements
            providers: List of providers to query (default: all compute providers)

        Returns:
            List of Quote objects
        """
        if providers is None:
            providers = ["akash", "aws", "gcp", "azure"]  # Will expand as we add more

        quotes = []

        if "akash" in providers:
            akash_quote = self._get_akash_compute(spec)
            if akash_quote:
                quotes.append(akash_quote)

        # TODO: Add AWS, GCP, Azure fetchers
        if "aws" in providers:
            # quotes.append(self._get_aws_compute(spec))
            pass

        if "gcp" in providers:
            # quotes.append(self._get_gcp_compute(spec))
            pass

        if "azure" in providers:
            # quotes.append(self._get_azure_compute(spec))
            pass

        return quotes

    def _get_akash_compute(self, spec: ComputeSpec) -> Optional[Quote]:
        """Fetch Akash compute pricing"""
        result = get_akash_pricing(
            cpu_cores=spec.cpu_cores,
            memory_gb=spec.memory_gb,
            storage_gb=spec.storage_gb
        )

        if not result:
            return None

        # Akash returns prices for multiple providers
        # We'll create a Quote for Akash specifically
        return Quote(
            provider="akash",
            category="compute",
            price_usd=result.get("akash", 0),
            billing_period="month",
            metadata={
                "spec": {
                    "cpu_cores": spec.cpu_cores,
                    "memory_gb": spec.memory_gb,
                    "storage_gb": spec.storage_gb
                },
                "competitors": {
                    "aws": result.get("aws"),
                    "gcp": result.get("gcp"),
                    "azure": result.get("azure")
                }
            }
        )

    # ==================== STORAGE QUOTES ====================

    def get_storage_quotes(
        self,
        spec: StorageSpec,
        providers: Optional[List[str]] = None
    ) -> List[Quote]:
        """
        Get storage pricing from multiple providers

        Args:
            spec: StorageSpec with size and duration requirements
            providers: List of providers (default: all storage providers)

        Returns:
            List of Quote objects
        """
        if providers is None:
            providers = ["arweave", "pinata", "filecoin"]

        quotes = []

        if "arweave" in providers and spec.permanent:
            arweave_quote = self._get_arweave_storage(spec)
            if arweave_quote:
                quotes.append(arweave_quote)

        if "pinata" in providers:
            pinata_quote = self._get_pinata_storage(spec)
            if pinata_quote:
                quotes.append(pinata_quote)

        # TODO: Add Filecoin, Storj, etc.

        return quotes

    def _get_arweave_storage(self, spec: StorageSpec) -> Optional[Quote]:
        """Fetch Arweave permanent storage pricing"""
        result = get_arweave_pricing(storage_gb=spec.size_gb)

        if not result:
            return None

        return Quote(
            provider="arweave",
            category="storage",
            price_usd=result.get("price_usd", 0),
            currency="AR",
            billing_period="one-time",  # Permanent storage
            metadata={
                "spec": {"size_gb": spec.size_gb},
                "price_ar": result.get("price_ar"),
                "price_winston": result.get("price_winston"),
                "permanent": True
            }
        )

    def _get_pinata_storage(self, spec: StorageSpec) -> Optional[Quote]:
        """Fetch Pinata x402 storage pricing"""
        size_bytes = int(spec.size_gb * 1_000_000_000)
        result = get_pinata_storage_quote(file_size_bytes=size_bytes)

        if not result or "error" in result:
            return None

        return Quote(
            provider="pinata",
            category="storage",
            price_usd=result.get("price_usd", 0),
            currency=result.get("currency", "USDC"),
            billing_period="one-time",
            metadata={
                "spec": {"size_gb": spec.size_gb},
                "network": result.get("network"),
                "recipient": result.get("recipient")
            }
        )

    # ==================== CACHE QUOTES ====================

    def get_cache_quotes(
        self,
        spec: CacheSpec,
        providers: Optional[List[str]] = None
    ) -> List[Quote]:
        """
        Get cache pricing from multiple providers

        Args:
            spec: CacheSpec with size and operation requirements
            providers: List of providers (default: all cache providers)

        Returns:
            List of Quote objects
        """
        if providers is None:
            providers = ["xcache"]  # Start with xcache, expand later

        quotes = []

        if "xcache" in providers:
            xcache_quote = self._get_xcache_cache(spec)
            if xcache_quote:
                quotes.append(xcache_quote)

        # TODO: Add Redis, Memcached, etc.

        return quotes

    def _get_xcache_cache(self, spec: CacheSpec) -> Optional[Quote]:
        """Fetch xcache pricing via 402 response for cache creation"""
        # Only support 'create' operation through Galaksio
        if spec.operation != "create":
            return None

        result = get_xcache_create_quote(region="us-east-1")

        if not result or "error" in result:
            return None

        return Quote(
            provider="xcache",
            category="cache",
            price_usd=result.get("price_usd", 0),
            currency=result.get("currency", "USDC"),
            billing_period="one-time",
            metadata={
                "operation": "create",
                "region": result.get("region", "us-east-1"),
                "operations_included": result.get("operations_included", 50000),
                "network": result.get("network"),
                "recipient": result.get("recipient"),
                "x402_instructions": result.get("x402_instructions"),
                "raw_response": result.get("metadata", {})
            }
        )

    # ==================== COMPARISON & AGGREGATION ====================

    def compare_compute(self, spec: ComputeSpec) -> Dict:
        """
        Compare compute pricing across all providers

        Returns:
            Dictionary with comparison data and best offer
        """
        quotes = self.get_compute_quotes(spec)

        if not quotes:
            return {"error": "No quotes available"}

        # Sort by price (lowest first)
        sorted_quotes = sorted(quotes, key=lambda q: q.price_usd)

        return {
            "spec": asdict(spec),
            "quotes": [asdict(q) for q in sorted_quotes],
            "best_offer": asdict(sorted_quotes[0]),
            "total_providers": len(sorted_quotes),
            "timestamp": datetime.utcnow().isoformat()
        }

    def compare_storage(self, spec: StorageSpec) -> Dict:
        """
        Compare storage pricing across all providers

        Returns:
            Dictionary with comparison data and best offer
        """
        quotes = self.get_storage_quotes(spec)

        if not quotes:
            return {"error": "No quotes available"}

        # Sort by price (lowest first)
        sorted_quotes = sorted(quotes, key=lambda q: q.price_usd)

        return {
            "spec": asdict(spec),
            "quotes": [asdict(q) for q in sorted_quotes],
            "best_offer": asdict(sorted_quotes[0]),
            "total_providers": len(sorted_quotes),
            "timestamp": datetime.utcnow().isoformat()
        }

    def compare_cache(self, spec: CacheSpec) -> Dict:
        """
        Compare cache pricing across all providers

        Returns:
            Dictionary with comparison data and best offer
        """
        quotes = self.get_cache_quotes(spec)

        if not quotes:
            return {"error": "No quotes available"}

        # Sort by price (lowest first)
        sorted_quotes = sorted(quotes, key=lambda q: q.price_usd)

        return {
            "spec": asdict(spec),
            "quotes": [asdict(q) for q in sorted_quotes],
            "best_offer": asdict(sorted_quotes[0]),
            "total_providers": len(sorted_quotes),
            "timestamp": datetime.utcnow().isoformat()
        }

    def get_best_offer(
        self,
        compute_spec: Optional[ComputeSpec] = None,
        storage_spec: Optional[StorageSpec] = None,
        cache_spec: Optional[CacheSpec] = None
    ) -> Optional[Quote]:
        """
        Get the single best offer across all providers

        Args:
            compute_spec: Optional compute requirements
            storage_spec: Optional storage requirements
            cache_spec: Optional cache requirements

        Returns:
            Single Quote object with the best price
        """
        all_quotes = []

        if compute_spec:
            all_quotes.extend(self.get_compute_quotes(compute_spec))

        if storage_spec:
            all_quotes.extend(self.get_storage_quotes(storage_spec))

        if cache_spec:
            all_quotes.extend(self.get_cache_quotes(cache_spec))

        if not all_quotes:
            return None

        # Return the lowest priced option
        return min(all_quotes, key=lambda q: q.price_usd)

    # ==================== EXPORT & UTILITY ====================

    def export_comparison(self, comparison: Dict, format: str = "json") -> str:
        """
        Export comparison results in various formats

        Args:
            comparison: Comparison dict from compare_compute or compare_storage
            format: Output format (json, csv, markdown)

        Returns:
            Formatted string
        """
        if format == "json":
            return json.dumps(comparison, indent=2)

        elif format == "markdown":
            return self._format_markdown(comparison)

        # TODO: Add CSV export
        return str(comparison)

    def _format_markdown(self, comparison: Dict) -> str:
        """Format comparison as Markdown table"""
        lines = ["# Cloud Pricing Comparison\n"]

        if "spec" in comparison:
            lines.append("## Specification")
            for key, val in comparison["spec"].items():
                lines.append(f"- **{key}**: {val}")
            lines.append("")

        if "quotes" in comparison:
            lines.append("## Quotes\n")
            lines.append("| Provider | Price (USD) | Billing Period |")
            lines.append("|----------|-------------|----------------|")

            for quote in comparison["quotes"]:
                provider = quote.get("provider", "unknown")
                price = quote.get("price_usd", 0)
                period = quote.get("billing_period", "month")
                lines.append(f"| {provider} | ${price:.2f} | {period} |")

        return "\n".join(lines)
    
    def normalize_to_usd(self, amount: float, currency: str) -> float:
        """
        Normalize amount from given currency to USD

        Args:
            amount: Amount in original currency
            currency: Currency code (e.g., USD, AR, USDC)

        Returns:
            Normalized amount in USD
        """
        if currency == "USD":
            return amount

        # TODO: Implement actual currency conversion
        if currency in ["USDC", "USD Coin"]:
            return amount / 1e6

