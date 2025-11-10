"""
Galaksio Quote Engine API

FastAPI application exposing cloud compute and storage pricing endpoints
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uvicorn

from galaksio.quote_engine import QuoteEngine, ComputeSpec, StorageSpec


# ==================== Pydantic Models ====================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    version: str = "1.0.0"
    service: str = "galaksio-quote-engine"


class ComputeQuoteRequest(BaseModel):
    """Request model for compute pricing"""
    cpu_cores: float = Field(default=1, ge=0.1, description="Number of CPU cores")
    memory_gb: float = Field(default=1, ge=0.1, description="Memory in GB")
    storage_gb: float = Field(default=1, ge=0, description="Storage in GB")
    gpu: Optional[str] = Field(default=None, description="GPU type (optional)")
    providers: Optional[List[str]] = Field(
        default=None,
        description="List of providers to query (default: all)"
    )

    class Config:
        schema_extra = {
            "example": {
                "cpu_cores": 2,
                "memory_gb": 4,
                "storage_gb": 50,
                "providers": ["akash", "aws", "gcp"]
            }
        }


class StorageQuoteRequest(BaseModel):
    """Request model for storage pricing"""
    size_gb: float = Field(default=1, ge=0.001, description="Storage size in GB")
    duration_days: Optional[int] = Field(
        default=None,
        ge=1,
        description="Storage duration in days (for temporary storage)"
    )
    permanent: bool = Field(default=False, description="Permanent storage (e.g., Arweave)")
    providers: Optional[List[str]] = Field(
        default=None,
        description="List of providers to query (default: all)"
    )

    class Config:
        schema_extra = {
            "example": {
                "size_gb": 100,
                "permanent": True,
                "providers": ["arweave", "pinata"]
            }
        }


class BestOfferRequest(BaseModel):
    """Request model for finding the best offer across compute and storage"""
    compute: Optional[ComputeQuoteRequest] = None
    storage: Optional[StorageQuoteRequest] = None

    class Config:
        schema_extra = {
            "example": {
                "compute": {
                    "cpu_cores": 2,
                    "memory_gb": 4,
                    "storage_gb": 50
                },
                "storage": {
                    "size_gb": 100,
                    "permanent": True
                }
            }
        }


class QuoteResponse(BaseModel):
    """Individual quote response"""
    provider: str
    category: str
    price_usd: float
    currency: str
    billing_period: str
    timestamp: str
    metadata: Dict[str, Any]


class ComparisonResponse(BaseModel):
    """Comparison response with all quotes"""
    spec: Dict[str, Any]
    quotes: List[Dict[str, Any]]
    best_offer: Dict[str, Any]
    total_providers: int
    timestamp: str


# ==================== FastAPI App ====================

app = FastAPI(
    title="Galaksio Quote Engine API",
    description="Multi-cloud pricing aggregator for Web2 and Web3 providers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize QuoteEngine
quote_engine = QuoteEngine()


# ==================== Endpoints ====================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "service": "Galaksio Quote Engine API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
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


@app.post("/quotes/compute", response_model=ComparisonResponse, tags=["Quotes"])
async def get_compute_quotes(request: ComputeQuoteRequest):
    """
    Get compute pricing quotes from multiple cloud providers

    Returns a comparison of pricing across Web2 (AWS, GCP, Azure) and
    Web3 (Akash, etc.) providers.

    - **cpu_cores**: Number of CPU cores required
    - **memory_gb**: Memory in gigabytes
    - **storage_gb**: Storage in gigabytes
    - **gpu**: Optional GPU type
    - **providers**: Optional list of specific providers to query
    """
    try:
        spec = ComputeSpec(
            cpu_cores=request.cpu_cores,
            memory_gb=request.memory_gb,
            storage_gb=request.storage_gb,
            gpu=request.gpu
        )

        comparison = quote_engine.compare_compute(spec)

        if "error" in comparison:
            raise HTTPException(status_code=404, detail=comparison["error"])

        return comparison

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching compute quotes: {str(e)}")


@app.post("/quotes/storage", response_model=ComparisonResponse, tags=["Quotes"])
async def get_storage_quotes(request: StorageQuoteRequest):
    """
    Get storage pricing quotes from multiple providers

    Returns a comparison of pricing across Web2 cloud storage and
    Web3 decentralized storage (Arweave, Filecoin, Pinata, etc.).

    - **size_gb**: Storage size in gigabytes
    - **duration_days**: Duration for temporary storage (optional)
    - **permanent**: Whether permanent storage is required (e.g., Arweave)
    - **providers**: Optional list of specific providers to query
    """
    try:
        spec = StorageSpec(
            size_gb=request.size_gb,
            duration_days=request.duration_days,
            permanent=request.permanent
        )

        comparison = quote_engine.compare_storage(spec)

        if "error" in comparison:
            raise HTTPException(status_code=404, detail=comparison["error"])

        return comparison

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching storage quotes: {str(e)}")


@app.post("/quotes/best-offer", tags=["Quotes"])
async def get_best_offer(request: BestOfferRequest):
    """
    Get the single best offer across compute and/or storage requirements

    Returns the lowest-priced option across all categories and providers.

    Provide either compute specs, storage specs, or both.
    """
    try:
        compute_spec = None
        storage_spec = None

        if request.compute:
            compute_spec = ComputeSpec(
                cpu_cores=request.compute.cpu_cores,
                memory_gb=request.compute.memory_gb,
                storage_gb=request.compute.storage_gb,
                gpu=request.compute.gpu
            )

        if request.storage:
            storage_spec = StorageSpec(
                size_gb=request.storage.size_gb,
                duration_days=request.storage.duration_days,
                permanent=request.storage.permanent
            )

        best = quote_engine.get_best_offer(
            compute_spec=compute_spec,
            storage_spec=storage_spec
        )

        if not best:
            raise HTTPException(status_code=404, detail="No quotes available")

        return {
            "provider": best.provider,
            "category": best.category,
            "price_usd": best.price_usd,
            "currency": best.currency,
            "billing_period": best.billing_period,
            "timestamp": best.timestamp,
            "metadata": best.metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding best offer: {str(e)}")


@app.get("/providers", tags=["Providers"])
async def list_providers():
    """
    List all supported cloud providers

    Returns information about Web2 and Web3 providers integrated into the system
    """
    return {
        "web2": {
            "compute": ["aws", "gcp", "azure"],
            "storage": ["aws_s3", "gcp_storage", "azure_blob"]
        },
        "web3": {
            "compute": ["akash", "render", "io_net"],
            "storage": ["arweave", "filecoin", "pinata", "lighthouse", "storj"]
        },
        "active": {
            "compute": ["akash"],  # Currently implemented
            "storage": ["arweave", "pinata"]  # Currently implemented
        }
    }


@app.get("/quotes/compute/simple", tags=["Quotes"])
async def get_compute_quotes_simple(
    cpu_cores: float = Query(1, ge=0.1, description="Number of CPU cores"),
    memory_gb: float = Query(1, ge=0.1, description="Memory in GB"),
    storage_gb: float = Query(1, ge=0, description="Storage in GB")
):
    """
    Simple GET endpoint for compute quotes (query parameters instead of POST body)

    Useful for quick testing and simple integrations.
    """
    request = ComputeQuoteRequest(
        cpu_cores=cpu_cores,
        memory_gb=memory_gb,
        storage_gb=storage_gb
    )
    return await get_compute_quotes(request)


@app.get("/quotes/storage/simple", tags=["Quotes"])
async def get_storage_quotes_simple(
    size_gb: float = Query(1, ge=0.001, description="Storage size in GB"),
    permanent: bool = Query(False, description="Permanent storage")
):
    """
    Simple GET endpoint for storage quotes (query parameters instead of POST body)

    Useful for quick testing and simple integrations.
    """
    request = StorageQuoteRequest(
        size_gb=size_gb,
        permanent=permanent
    )
    return await get_storage_quotes(request)


# ==================== Run Server ====================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
