import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.analytics import router as analytics_router
from routers.processing import router as processing_router

app = FastAPI(
    title="MediCore Clinical Analytics & Processing Microservice",
    description="Python FastAPI Microservice responsible for clinical dataset validation, data quality benchmarking, and operational analytics reporting for the MediCore Hospital Platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "http://localhost:3010,http://127.0.0.1:3010").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router)
app.include_router(processing_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "revision": os.getenv("RENDER_GIT_COMMIT", "local"),
        "service": "MediCore Clinical Analytics Microservice",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("ANALYTICS_PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
