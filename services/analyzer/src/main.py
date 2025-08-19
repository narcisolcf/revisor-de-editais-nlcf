"""
LicitaReview Document Analyzer Service

FastAPI service for document analysis with personalized parameters.
🚀 CORE DIFFERENTIATOR: Organization-specific analysis weights and rules.
"""

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime

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
        
        analysis_result = await analyzer_service.analyze_document(request)
        
        logger.info("Analysis completed successfully",
                   document_id=request.document_id,
                   final_score=analysis_result.weighted_score)
        
        # Cria resposta completa da API
        response = AnalysisResponse(
            analysis_result=analysis_result,
            processing_info={
                'analysis_engine': 'adaptive-v2.0.0',
                'custom_rules_applied': len([f for f in analysis_result.findings if f.is_custom_rule]),
                'organization_preset': analysis_result.applied_config.preset_type.value,
                'cache_status': 'miss'  # Poderia vir do analyzer_service
            },
            api_metadata={
                'service_version': '1.0.0',
                'request_timestamp': datetime.utcnow().isoformat(),
                'api_endpoint': '/analyze'
            }
        )
        
        return response
        
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

@app.post("/analyze/adaptive", response_model=AnalysisResponse)
async def analyze_document_adaptive(
    request: AnalysisRequest,
    _: str = Depends(verify_api_key),
    __: None = Depends(rate_limit)
):
    """
    🚀 ENDPOINT PRINCIPAL - Análise adaptativa com parâmetros personalizados
    
    Este é o endpoint principal do diferencial competitivo do LicitaReview.
    Realiza análise de documentos aplicando:
    - Pesos personalizados por organização
    - Regras customizadas específicas
    - Templates organizacionais
    - Validações adaptativas
    
    O mesmo documento pode ter scores diferentes para organizações diferentes!
    """
    try:
        logger.info("🚀 Starting adaptive analysis", 
                   document_id=request.document_id,
                   organization_id=request.organization_config.organization_id,
                   analysis_type=request.analysis_type,
                   custom_rules_count=len(request.organization_config.get_active_rules()),
                   weight_distribution=request.organization_config.weights.get_weight_distribution_type())
        
        # Análise com motor adaptativo
        analysis_result = await analyzer_service.analyze_document(request)
        
        # Calcula métricas de personalização
        custom_findings = [f for f in analysis_result.findings if f.is_custom_rule]
        base_findings = [f for f in analysis_result.findings if not f.is_custom_rule]
        
        # Cria resposta enriquecida
        response = AnalysisResponse(
            analysis_result=analysis_result,
            processing_info={
                'analysis_engine': 'adaptive-v2.0.0',
                'custom_rules_applied': len(custom_findings),
                'base_analysis_findings': len(base_findings),
                'organization_preset': analysis_result.applied_config.preset_type.value,
                'weight_distribution': analysis_result.applied_config.weights.get_weight_distribution_type(),
                'dominant_category': analysis_result.applied_config.weights.get_dominant_category(),
                'templates_validated': len([t for t in analysis_result.applied_config.templates if t.is_active]),
                'personalization_score': len(custom_findings) / max(1, len(analysis_result.findings)) * 100,
                'cache_status': 'miss'
            },
            api_metadata={
                'service_version': '1.0.0',
                'endpoint_version': 'adaptive-v1',
                'request_timestamp': datetime.utcnow().isoformat(),
                'api_endpoint': '/analyze/adaptive',
                'differentiator_features': [
                    'custom_weights',
                    'organization_rules',
                    'adaptive_scoring',
                    'template_validation'
                ]
            }
        )
        
        logger.info("✅ Adaptive analysis completed successfully",
                   document_id=request.document_id,
                   organization_id=request.organization_config.organization_id,
                   weighted_score=analysis_result.weighted_score,
                   total_findings=len(analysis_result.findings),
                   custom_findings=len(custom_findings),
                   personalization_score=response.processing_info['personalization_score'])
        
        return response
        
    except Exception as e:
        logger.error("❌ Adaptive analysis failed", 
                    document_id=request.document_id,
                    organization_id=request.organization_config.organization_id, 
                    error=str(e),
                    error_type=type(e).__name__)
        raise HTTPException(status_code=500, detail=f"Adaptive analysis failed: {str(e)}")

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