"""
Galaksio Quote Engine - Simplified API

Exposes simplified endpoints for quote operations:
- GET /health - Health check
- POST /quote_compute - Compute quotes with optional provider
- POST /quote_storage - Storage quotes with optional provider
- POST /quote - Orchestrated quote that infers job type from parameters
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uvicorn

from galaksio.quote_engine import QuoteEngine, ComputeSpec, StorageSpec, CacheSpec
from galaksio.openx402 import get_openx402_storage_quote
from galaksio.galaksio_storage import get_galaksio_storage_quote
from galaksio.x_cache import get_xcache_create_quote
from galaksio.merit_systems import get_merit_systems_quote


# ==================== Pydantic Models ====================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    version: str = "1.0.0"
    service: str = "galaksio-quote-engine"


class ComputeQuoteRequest(BaseModel):
    """Request for compute quotes"""
    provider: Optional[str] = Field(default=None, description="Specific provider (optional)")
    cpu_cores: float = Field(default=1, ge=0.1, description="Number of CPU cores")
    memory_gb: float = Field(default=1, ge=0.1, description="Memory in GB")
    storage_gb: float = Field(default=1, ge=0, description="Storage in GB")
    gpu: Optional[str] = Field(default=None, description="GPU type (optional)")

    class Config:
        schema_extra = {
            "example": {
                "provider": "akash",
                "cpu_cores": 2,
                "memory_gb": 4,
                "storage_gb": 50
            }
        }


class StorageQuoteRequest(BaseModel):
    """Request for storage quotes"""
    provider: Optional[str] = Field(default=None, description="Specific provider (optional)")
    size_gb: float = Field(default=1, ge=0.001, description="Storage size in GB")
    duration_days: Optional[int] = Field(default=None, ge=1, description="Duration in days")
    permanent: bool = Field(default=False, description="Permanent storage")

    class Config:
        schema_extra = {
            "example": {
                "provider": "arweave",
                "size_gb": 100,
                "permanent": True
            }
        }


class CacheQuoteRequest(BaseModel):
    """Request for cache quotes"""
    provider: Optional[str] = Field(default=None, description="Specific provider (optional)")
    size_mb: float = Field(default=100, ge=0.1, description="Cache size in MB")
    operation: str = Field(default="create", description="Operation type (create, get, set, delete, list, ttl)")
    ttl_hours: Optional[int] = Field(default=None, ge=1, description="Time-to-live in hours")

    class Config:
        schema_extra = {
            "example": {
                "provider": "xcache",
                "size_mb": 100,
                "operation": "create",
                "ttl_hours": 24
            }
        }


class OrchestrationRequest(BaseModel):
    """Request for orchestrated quote - infers job type from parameters"""
    # Compute parameters (optional)
    cpu_cores: Optional[float] = Field(default=None, ge=0.1, description="Number of CPU cores")
    memory_gb: Optional[float] = Field(default=None, ge=0.1, description="Memory in GB")
    storage_gb: Optional[float] = Field(default=None, ge=0, description="Storage in GB (for compute)")
    gpu: Optional[str] = Field(default=None, description="GPU type")

    # Storage parameters (optional)
    size_gb: Optional[float] = Field(default=None, ge=0.001, description="Storage size in GB")
    duration_days: Optional[int] = Field(default=None, ge=1, description="Duration for storage")
    permanent: Optional[bool] = Field(default=None, description="Permanent storage")

    # Cache parameters (optional)
    size_mb: Optional[float] = Field(default=None, ge=0.1, description="Cache size in MB")
    cache_operation: Optional[str] = Field(default=None, description="Cache operation type")
    ttl_hours: Optional[int] = Field(default=None, ge=1, description="Cache TTL in hours")

    # General
    provider: Optional[str] = Field(default=None, description="Specific provider (optional)")

    class Config:
        schema_extra = {
            "example": {
                "cpu_cores": 2,
                "memory_gb": 4,
                "storage_gb": 50,
                "size_gb": 100,
                "permanent": True
            }
        }


# ==================== V2 API Models ====================

class StoreQuoteRequestV2(BaseModel):
    """V2 API: Request for storage quotes"""
    fileSize: int
    permanent: bool = False
    ttl: Optional[int] = 3600  # Default 1 hour TTL
    fileName: Optional[str] = None
    fileContent: Optional[str] = None
    provider: Optional[str] = None  # Optional specific provider


class RunQuoteRequestV2(BaseModel):
    """V2 API: Request for compute quotes"""
    codeSize: int
    language: str = "python"


class CacheQuoteRequestV2(BaseModel):
    """V2 API: Request for cache creation quotes"""
    region: str = "us-east-1"

class BestQuoteRequest(BaseModel):
    """Request for the best quote among multiple providers"""
    spec: dict

class QuoteV2(BaseModel):
    """V2 API: Quote response"""
    provider: str
    price_usd: float
    currency: Optional[str] = None
    network: Optional[str] = None
    recipient: Optional[str] = None
    x402_instructions: Optional[Any] = None
    file_size_bytes: Optional[int] = None
    file_size_mb: Optional[float] = None
    code_size_bytes: Optional[int] = None
    language: Optional[str] = None
    ttl: Optional[int] = None
    operation: Optional[str] = None
    metadata: Optional[Any] = None


class StoreQuotesResponseV2(BaseModel):
    """V2 API: Storage quotes response"""
    quotes: List[Dict[str, Any]]
    best: Dict[str, Any]
    count: int


# ==================== FastAPI App ====================

app = FastAPI(
    title="Galaksio Quote Engine - Simplified API",
    description="Simplified multi-cloud pricing API with intelligent job orchestration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize QuoteEngine
quote_engine = QuoteEngine()


# ==================== Helper Functions ====================

def _infer_job_type(request: OrchestrationRequest) -> str:
    """
    Infer the job type from the request parameters

    Returns: "compute", "storage", "cache", or "hybrid"
    """
    has_compute = any([
        request.cpu_cores is not None,
        request.memory_gb is not None,
        request.gpu is not None
    ])

    has_storage = any([
        request.size_gb is not None,
        request.permanent is not None,
        request.duration_days is not None
    ])

    has_cache = any([
        request.size_mb is not None,
        request.cache_operation is not None,
        request.ttl_hours is not None
    ])

    # Count how many types are present
    type_count = sum([has_compute, has_storage, has_cache])

    if type_count > 1:
        return "hybrid"
    elif has_compute:
        return "compute"
    elif has_storage:
        return "storage"
    elif has_cache:
        return "cache"
    else:
        return "unknown"


# ==================== Endpoints ====================

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint

    Provides basic information about the Galaksio Quote Engine API
    """
    return {
        "service": "Galaksio Quote Engine",
        "version": "2.0.0",
        "description": "Multi-cloud pricing API with intelligent job orchestration",
        "endpoints": {
            "health": "/health",
            "store": "/quote/store",
            "run": "/quote/run",
            "cache": "/quote/cache",
            "best": "/quote/best"
        },
        "providers": {
            "storage": ["openx402", "galaksio_storage"],
            "compute": ["merit-systems"],
            "cache": ["xcache"]
        },
        "documentation": {
            "openx402": "https://ipfs.openx402.ai - IPFS storage, max 100MB, 0.01 USDC per file",
            "galaksio_storage": "https://storage.galaksio.cloud - Arweave permanent storage, dynamic pricing",
            "merit_systems": "E2B code execution service",
            "xcache": "Redis cache creation service, 50K ops included"
        }
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint

    Returns the current status and timestamp of the service
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat()
    )

@app.get("/providers", tags=["Providers"])
async def list_providers():
    """
    List available providers for compute, storage, and cache quotes
    """
    compute_providers = quote_engine.compute_providers
    storage_providers = quote_engine.storage_providers
    cache_providers = quote_engine.cache_providers

    return {
        "compute_providers": compute_providers,
        "storage_providers": storage_providers,
        "cache_providers": cache_providers
    }

# ==================== V2 API Endpoints (for Broker) ====================

@app.post("/quote/store")
async def get_store_quotes_v2(req: StoreQuoteRequestV2):
    """
    V2 API: Get storage quotes from openx402 and galaksio_storage

    This endpoint is used by the broker to get storage quotes.
    Returns list of quotes sorted by price (cheapest first).

    Providers:
    - openx402: IPFS storage (max 100MB, 0.01 USDC)
    - galaksio_storage: Arweave permanent storage (dynamic pricing)

    If fileSize > 100MB, openx402 will be automatically excluded.
    """
    quotes = []

    # Get quotes from both storage providers (or specific provider if requested)
    if not req.provider or req.provider == "openx402":
        openx402_quote = get_openx402_storage_quote(
            file_size_bytes=req.fileSize,
            file_name=req.fileName,
            file_content=req.fileContent,
            permanent=req.permanent,
            ttl=req.ttl
        )
        # Only add if not error (e.g., file too large)
        if "error" not in openx402_quote:
            quotes.append(openx402_quote)

    if not req.provider or req.provider == "galaksio_storage":
        galaksio_quote = get_galaksio_storage_quote(
            data_size_bytes=req.fileSize
        )
        if "error" not in galaksio_quote:
            quotes.append(galaksio_quote)

    if not quotes:
        raise HTTPException(
            status_code=503,
            detail="No storage providers available for this file size"
        )

    # Filter out failed quotes - keep quotes with 402 status (payment required)
    valid_quotes = [
        q for q in quotes
        if q.get('metadata', {}).get('status_code') == 402
        or q.get('price_usd') is not None
    ]

    # If no valid quotes, return all quotes for transparency
    if not valid_quotes:
        valid_quotes = quotes

    # Sort by price (lowest first)
    valid_quotes.sort(key=lambda q: q.get('price_usd', float('inf')))

    return {
        "quotes": quotes,  # Return all quotes for transparency
        "best": valid_quotes[0] if valid_quotes else None,
        "count": len(quotes),
        "file_size_mb": round(req.fileSize / 1_000_000, 2)
    }


@app.post("/quote/run")
async def get_run_quote_v2(req: RunQuoteRequestV2):
    """
    V2 API: Get compute quote from merit-systems

    This endpoint is used by the broker to get compute quotes.
    Returns quote with x402 payment instructions
    """
    quote = get_merit_systems_quote(req.codeSize, req.language)

    if "error" in quote:
        raise HTTPException(status_code=503, detail=quote["error"])

    return quote


@app.post("/quote/cache")
async def get_cache_quote_v2(req: CacheQuoteRequestV2):
    """
    V2 API: Get cache creation quote from xCache

    This endpoint is used by the broker to get cache creation quotes.
    Returns quote with x402 payment instructions for creating a new cache instance.
    """
    quote = get_xcache_create_quote(req.region)

    if "error" in quote:
        raise HTTPException(status_code=503, detail=quote["error"])

    return quote


@app.post("/quote/best")
async def get_best_quote_v2(spec: dict):
    """
    V2 API: Get best quote for any operation (orchestration endpoint)

    This endpoint is used by the broker for orchestrated quote requests.
    Accepts a generic spec and returns the best available quote
    based on the operation type and requirements.
    """
    operation = spec.get("operation")

    if operation == "store":
        # Convert spec to StoreQuoteRequestV2 format
        store_req = StoreQuoteRequestV2(
            fileSize=spec.get("fileSize", spec.get("file_size", 0)),
            permanent=spec.get("permanent", False),
            ttl=spec.get("ttl", 3600)
        )
        result = await get_store_quotes_v2(store_req)
        return result.get("best")

    elif operation == "run":
        # Convert spec to RunQuoteRequestV2 format
        run_req = RunQuoteRequestV2(
            codeSize=spec.get("codeSize", spec.get("code_size", 0)),
            language=spec.get("language", "python")
        )
        return await get_run_quote_v2(run_req)

    elif operation == "cache":
        # Convert spec to CacheQuoteRequestV2 format
        cache_req = CacheQuoteRequestV2(
            region=spec.get("region", "us-east-1")
        )
        return await get_cache_quote_v2(cache_req)

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown operation type: {operation}. Supported: 'store', 'run', 'cache'"
        )


# ==================== Run Server ====================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8081,
        reload=True,
        log_level="info"
    )
