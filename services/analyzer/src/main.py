"""
LicitaReview Document Analyzer Service

FastAPI service for document analysis with personalized parameters.
🚀 CORE DIFFERENTIATOR: Organization-specific analysis weights and rules.
"""

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog

from .config import settings
from .services.analyzer_service import AnalyzerService
from .services.ocr_service import OCRService
from .models.analysis_models import (
    AnalysisRequest,
    AnalysisResponse,
    DocumentUploadResponse
)
from .models.config_models import OrganizationConfig
from .middleware.auth import verify_api_key
from .middleware.rate_limit import rate_limit
from .utils.logger import setup_logging

# Setup logging
logger = setup_logging()

# Initialize services
analyzer_service = AnalyzerService()
ocr_service = OCRService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("🚀 Starting LicitaReview Analyzer Service")
    
    # Initialize services
    await analyzer_service.initialize()
    await ocr_service.initialize()
    
    yield
    
    # Cleanup
    await analyzer_service.cleanup()
    await ocr_service.cleanup()
    logger.info("👋 Analyzer Service shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="LicitaReview Document Analyzer",
    description="Intelligent document analysis with personalized parameters",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "analyzer",
        "version": "1.0.0"
    }

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_document(
    request: AnalysisRequest,
    _: str = Depends(verify_api_key),
    __: None = Depends(rate_limit)
):
    """
    🚀 CORE FEATURE: Analyze document with personalized parameters
    
    This endpoint uses organization-specific weights and rules to provide
    customized analysis results for the same document.
    """
    try:
        logger.info("Starting document analysis", 
                   document_id=request.document_id,
                   organization_id=request.organization_config.organization_id)
        
        result = await analyzer_service.analyze_document(request)
        
        logger.info("Analysis completed successfully",
                   document_id=request.document_id,
                   final_score=result.overall_score)
        
        return result
        
    except Exception as e:
        logger.error("Analysis failed", 
                    document_id=request.document_id, 
                    error=str(e))
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
    __: None = Depends(rate_limit)
):
    """Upload and process document for analysis"""
    try:
        # Validate file
        if not file.filename or not file.content_type:
            raise HTTPException(status_code=400, detail="Invalid file")
        
        allowed_types = ["application/pdf", "application/msword", 
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Process document
        logger.info("Processing uploaded document", filename=file.filename)
        
        result = await analyzer_service.process_upload(file)
        
        logger.info("Document processed successfully", 
                   document_id=result.document_id,
                   filename=file.filename)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Document upload failed", filename=file.filename, error=str(e))
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key)
):
    """Extract text from document using OCR"""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        logger.info("Extracting text from document", filename=file.filename)
        
        extracted_text = await ocr_service.extract_text(file)
        
        return {
            "filename": file.filename,
            "text": extracted_text,
            "character_count": len(extracted_text),
            "word_count": len(extracted_text.split())
        }
        
    except Exception as e:
        logger.error("Text extraction failed", filename=file.filename, error=str(e))
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

@app.get("/config/presets")
async def get_analysis_presets():
    """Get available analysis presets"""
    return await analyzer_service.get_analysis_presets()

@app.post("/config/validate")
async def validate_config(config: OrganizationConfig):
    """Validate organization configuration"""
    try:
        validation_result = await analyzer_service.validate_config(config)
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error("Unhandled exception", 
                path=request.url.path,
                method=request.method,
                error=str(exc))
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8080, 
        reload=True,
        log_level="info"
    )