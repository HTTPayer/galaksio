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
from typing import Optional, Dict, Any
from datetime import datetime
import uvicorn

from galaksio.quote_engine import QuoteEngine, ComputeSpec, StorageSpec, CacheSpec


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
        "version": "1.0.0",
        "description": "Simplified multi-cloud pricing API with intelligent job orchestration",
        "endpoints": {
            "health": "/health",
            "compute_quote": "/quote/compute",
            "storage_quote": "/quote/storage",
            "cache_quote": "/quote/cache",
            "orchestrated_quote": "/quote"
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

@app.post("/quote/compute", tags=["Quotes"])
async def compute_quote(request: ComputeQuoteRequest) -> Dict[str, Any]:
    """
    Get compute pricing quotes

    Optionally specify a provider, otherwise queries all available compute providers.

    Parameters:
    - **provider**: Optional specific provider (e.g., "akash", "aws", "gcp", "azure")
    - **cpu_cores**: Number of CPU cores required
    - **memory_gb**: Memory in gigabytes
    - **storage_gb**: Storage in gigabytes
    - **gpu**: Optional GPU type
    """
    try:
        spec = ComputeSpec(
            cpu_cores=request.cpu_cores,
            memory_gb=request.memory_gb,
            storage_gb=request.storage_gb,
            gpu=request.gpu
        )

        providers = [request.provider] if request.provider else None

        if providers:
            # Get quotes for specific provider
            quotes = quote_engine.get_compute_quotes(spec, providers=providers)

            if not quotes:
                raise HTTPException(
                    status_code=404,
                    detail=f"No quotes available for provider: {request.provider}"
                )

            return {
                "job_type": "compute",
                "provider": request.provider,
                "quote": {
                    "provider": quotes[0].provider,
                    "category": quotes[0].category,
                    "price_usd": quotes[0].price_usd,
                    "currency": quotes[0].currency,
                    "billing_period": quotes[0].billing_period,
                    "timestamp": quotes[0].timestamp,
                    "metadata": quotes[0].metadata
                }
            }
        else:
            # Compare across all providers
            comparison = quote_engine.compare_compute(spec)

            if "error" in comparison:
                raise HTTPException(status_code=404, detail=comparison["error"])

            return {
                "job_type": "compute",
                "spec": comparison["spec"],
                "quotes": comparison["quotes"],
                "best_offer": comparison["best_offer"],
                "total_providers": comparison["total_providers"],
                "timestamp": comparison["timestamp"]
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching compute quotes: {str(e)}"
        )


@app.post("/quote/storage", tags=["Quotes"])
async def storage_quote(request: StorageQuoteRequest) -> Dict[str, Any]:
    """
    Get storage pricing quotes

    Optionally specify a provider, otherwise queries all available storage providers.

    Parameters:
    - **provider**: Optional specific provider (e.g., "arweave", "pinata", "filecoin")
    - **size_gb**: Storage size in gigabytes
    - **duration_days**: Duration for temporary storage (optional)
    - **permanent**: Whether permanent storage is required
    """
    try:
        spec = StorageSpec(
            size_gb=request.size_gb,
            duration_days=request.duration_days,
            permanent=request.permanent
        )

        providers = [request.provider] if request.provider else None

        if providers:
            # Get quotes for specific provider
            quotes = quote_engine.get_storage_quotes(spec, providers=providers)

            if not quotes:
                raise HTTPException(
                    status_code=404,
                    detail=f"No quotes available for provider: {request.provider}"
                )

            return {
                "job_type": "storage",
                "provider": request.provider,
                "quote": {
                    "provider": quotes[0].provider,
                    "category": quotes[0].category,
                    "price_usd": quotes[0].price_usd,
                    "currency": quotes[0].currency,
                    "billing_period": quotes[0].billing_period,
                    "timestamp": quotes[0].timestamp,
                    "metadata": quotes[0].metadata
                }
            }
        else:
            # Compare across all providers
            comparison = quote_engine.compare_storage(spec)

            if "error" in comparison:
                raise HTTPException(status_code=404, detail=comparison["error"])

            return {
                "job_type": "storage",
                "spec": comparison["spec"],
                "quotes": comparison["quotes"],
                "best_offer": comparison["best_offer"],
                "total_providers": comparison["total_providers"],
                "timestamp": comparison["timestamp"]
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching storage quotes: {str(e)}"
        )


@app.post("/quote/cache", tags=["Quotes"])
async def cache_quote(request: CacheQuoteRequest) -> Dict[str, Any]:
    """
    Get cache pricing quotes

    Queries cache providers (like xcache) to get pricing via 402 payment responses.

    Parameters:
    - **provider**: Optional specific provider (e.g., "xcache")
    - **size_mb**: Cache size in MB
    - **operation**: Cache operation type (create, get, set, delete, list, ttl)
    - **ttl_hours**: Time-to-live in hours
    """
    try:
        spec = CacheSpec(
            size_mb=request.size_mb,
            operation=request.operation,
            ttl_hours=request.ttl_hours
        )

        providers = [request.provider] if request.provider else None

        if providers:
            # Get quotes for specific provider
            quotes = quote_engine.get_cache_quotes(spec, providers=providers)

            if not quotes:
                raise HTTPException(
                    status_code=404,
                    detail=f"No quotes available for provider: {request.provider}"
                )

            return {
                "job_type": "cache",
                "provider": request.provider,
                "quote": {
                    "provider": quotes[0].provider,
                    "category": quotes[0].category,
                    "price_usd": quotes[0].price_usd,
                    "currency": quotes[0].currency,
                    "billing_period": quotes[0].billing_period,
                    "timestamp": quotes[0].timestamp,
                    "metadata": quotes[0].metadata
                }
            }
        else:
            # Compare across all providers
            comparison = quote_engine.compare_cache(spec)

            if "error" in comparison:
                raise HTTPException(status_code=404, detail=comparison["error"])

            return {
                "job_type": "cache",
                "spec": comparison["spec"],
                "quotes": comparison["quotes"],
                "best_offer": comparison["best_offer"],
                "total_providers": comparison["total_providers"],
                "timestamp": comparison["timestamp"]
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching cache quotes: {str(e)}"
        )


@app.post("/quote", tags=["Quotes"])
async def orchestrated_quote(request: OrchestrationRequest) -> Dict[str, Any]:
    """
    Intelligent quote orchestration

    Infers the job type (compute, storage, cache, or hybrid) from the provided parameters
    and automatically orchestrates the appropriate quote operations.

    Parameters:
    - **Compute params**: cpu_cores, memory_gb, storage_gb, gpu
    - **Storage params**: size_gb, duration_days, permanent
    - **Cache params**: size_mb, cache_operation, ttl_hours
    - **provider**: Optional specific provider

    Returns quotes based on detected requirements.
    """
    print("Orchestration request received:", request.dict())
    try:
        job_type = _infer_job_type(request)

        if job_type == "unknown":
            raise HTTPException(
                status_code=400,
                detail="Could not infer job type. Please provide compute, storage, or cache parameters."
            )

        providers = [request.provider] if request.provider else None
        result = {
            "job_type": job_type,
            "timestamp": datetime.utcnow().isoformat()
        }

        if job_type == "compute":
            spec = ComputeSpec(
                cpu_cores=request.cpu_cores or 1,
                memory_gb=request.memory_gb or 1,
                storage_gb=request.storage_gb or 1,
                gpu=request.gpu
            )

            if providers:
                quotes = quote_engine.get_compute_quotes(spec, providers=providers)
                if not quotes:
                    raise HTTPException(status_code=404, detail="No quotes available")
                result["quote"] = {
                    "provider": quotes[0].provider,
                    "category": quotes[0].category,
                    "price_usd": quotes[0].price_usd,
                    "currency": quotes[0].currency,
                    "billing_period": quotes[0].billing_period,
                    "metadata": quotes[0].metadata
                }
            else:
                comparison = quote_engine.compare_compute(spec)
                if "error" in comparison:
                    raise HTTPException(status_code=404, detail=comparison["error"])
                result.update(comparison)

        elif job_type == "storage":
            spec = StorageSpec(
                size_gb=request.size_gb or 1,
                duration_days=request.duration_days,
                permanent=request.permanent or False
            )

            if providers:
                quotes = quote_engine.get_storage_quotes(spec, providers=providers)
                if not quotes:
                    raise HTTPException(status_code=404, detail="No quotes available")
                result["quote"] = {
                    "provider": quotes[0].provider,
                    "category": quotes[0].category,
                    "price_usd": quotes[0].price_usd,
                    "currency": quotes[0].currency,
                    "billing_period": quotes[0].billing_period,
                    "metadata": quotes[0].metadata
                }
            else:
                comparison = quote_engine.compare_storage(spec)
                if "error" in comparison:
                    raise HTTPException(status_code=404, detail=comparison["error"])
                result.update(comparison)

        elif job_type == "cache":
            spec = CacheSpec(
                size_mb=request.size_mb or 100,
                operation=request.cache_operation or "create",
                ttl_hours=request.ttl_hours
            )

            if providers:
                quotes = quote_engine.get_cache_quotes(spec, providers=providers)
                if not quotes:
                    raise HTTPException(status_code=404, detail="No quotes available")
                result["quote"] = {
                    "provider": quotes[0].provider,
                    "category": quotes[0].category,
                    "price_usd": quotes[0].price_usd,
                    "currency": quotes[0].currency,
                    "billing_period": quotes[0].billing_period,
                    "metadata": quotes[0].metadata
                }
            else:
                comparison = quote_engine.compare_cache(spec)
                if "error" in comparison:
                    raise HTTPException(status_code=404, detail=comparison["error"])
                result.update(comparison)

        elif job_type == "hybrid":
            compute_spec = ComputeSpec(
                cpu_cores=request.cpu_cores or 1,
                memory_gb=request.memory_gb or 1,
                storage_gb=request.storage_gb or 1,
                gpu=request.gpu
            )

            storage_spec = StorageSpec(
                size_gb=request.size_gb or 1,
                duration_days=request.duration_days,
                permanent=request.permanent or False
            )

            compute_comparison = quote_engine.compare_compute(compute_spec)
            storage_comparison = quote_engine.compare_storage(storage_spec)

            result["compute"] = compute_comparison
            result["storage"] = storage_comparison

            # Check if cache is also requested
            cache_spec = None
            if request.size_mb or request.cache_operation:
                cache_spec = CacheSpec(
                    size_mb=request.size_mb or 100,
                    operation=request.cache_operation or "create",
                    ttl_hours=request.ttl_hours
                )
                cache_comparison = quote_engine.compare_cache(cache_spec)
                result["cache"] = cache_comparison

            # Find overall best offer
            best_offer = quote_engine.get_best_offer(
                compute_spec=compute_spec,
                storage_spec=storage_spec,
                cache_spec=cache_spec
            )

            if best_offer:
                result["overall_best_offer"] = {
                    "provider": best_offer.provider,
                    "category": best_offer.category,
                    "price_usd": best_offer.price_usd,
                    "currency": best_offer.currency,
                    "billing_period": best_offer.billing_period,
                    "metadata": best_offer.metadata
                }

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error in orchestrated quote: {str(e)}"
        )


# ==================== Run Server ====================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
