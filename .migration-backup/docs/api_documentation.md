# API_DOCUMENTATION.md - Documentação de APIs

## 🚀 Visão Geral

### Arquitetura da API
O sistema de análise de documentos jurídicos expõe uma API RESTful para integração com sistemas externos e operações internas. A API segue padrões REST e utiliza JSON para comunicação.

### Base URL
```
Desenvolvimento: http://localhost:5173/api/v1
Staging: https://staging-api.docanalysis.com/v1  
Produção: https://api.docanalysis.com/v1
```

### Versionamento
- **Estratégia**: URL-based versioning (`/v1`, `/v2`)
- **Versão Atual**: v1.0
- **Compatibilidade**: Mínimo 12 meses para versões anteriores
- **Deprecação**: 6 meses de aviso antes da remoção

### Autenticação
```http
Authorization: Bearer {jwt_token}
```

---

## 🚨 Error Reporting

### Report Error

#### `POST /errors/report`

Submit error report from client application (sistema de tratamento de erros).

**Corpo da Requisição:**
```json
{
  "errorId": "error_12345",
  "userDescription": "Descrição do problema pelo usuário",
  "userEmail": "usuario@example.com",
  "reproducibleSteps": "1. Cliquei em analisar\n2. Sistema travou",
  "severity": "high",
  "errorData": {
    "message": "Network request failed",
    "stack": "Error stack trace...",
    "component": "DocumentAnalysis",
    "action": "analyzeDocument",
    "userAgent": "Mozilla/5.0...",
    "url": "/documents/123/analyze",
    "timestamp": "2025-08-11T10:30:00Z",
    "userId": "user_456"
  },
  "context": {
    "documentId": "doc_789",
    "analysisType": "full",
    "browser": "Chrome 120"
  }
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "reportId": "report_12345",
    "errorId": "error_12345",
    "status": "received",
    "estimatedResolution": "2025-08-12T10:30:00Z"
  }
}
```

### Get Error Statistics

#### `GET /errors/stats`

Retorna estatísticas de erro do sistema (admin endpoint).

**Parâmetros de Query:**
```typescript
interface ErrorStatsQuery {
  period?: '24h' | '7d' | '30d' | '90d'; // Período (padrão: 7d)
  severity?: 'low' | 'medium' | 'high' | 'critical'; // Filtro por severidade
  category?: 'network' | 'validation' | 'auth' | 'business' | 'ui'; // Filtro por categoria
  component?: string; // Filtro por componente
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "summary": {
      "totalErrors": 247,
      "uniqueErrors": 89,
      "affectedUsers": 34,
      "errorRate": 2.1
    },
    "bySeverity": {
      "critical": 3,
      "high": 12,
      "medium": 145,
      "low": 87
    },
    "byCategory": {
      "network": 89,
      "validation": 67,
      "business": 45,
      "ui": 34,
      "auth": 12
    },
    "topErrors": [
      {
        "message": "Failed to analyze document",
        "count": 23,
        "lastOccurrence": "2025-08-11T09:15:00Z",
        "component": "DocumentAnalysis"
      }
    ],
    "trends": {
      "dailyErrors": [12, 15, 8, 23, 19, 14, 11],
      "resolutionTime": {
        "avg": 4.2,
        "p95": 8.7
      }
    }
  }
}
```

---

## 📋 Convenções

### Códigos de Status HTTP
```
200 OK              - Sucesso
201 Created         - Recurso criado
204 No Content      - Sucesso sem retorno
400 Bad Request     - Erro na requisição
401 Unauthorized    - Não autenticado
403 Forbidden       - Sem permissão
404 Not Found       - Recurso não encontrado
409 Conflict        - Conflito de estado
422 Unprocessable   - Validação falhada
429 Rate Limited    - Limite de taxa excedido
500 Internal Error  - Erro interno
```

### Formato de Resposta Padrão
```json
{
  "success": true,
  "data": {
    // Dados da resposta
  },
  "meta": {
    "timestamp": "2025-08-11T10:30:00Z",
    "version": "1.0.0",
    "request_id": "uuid-v4"
  }
}
```

### Formato de Erro Padrão
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos fornecidos",
    "details": [
      {
        "field": "document_type",
        "message": "Tipo de documento é obrigatório",
        "code": "REQUIRED_FIELD"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-08-11T10:30:00Z",
    "version": "1.0.0",
    "request_id": "uuid-v4"
  }
}
```

---

## 📄 Documentos

### Listar Documentos

#### `GET /documents`

Retorna lista paginada de documentos com filtros opcionais.

**Parâmetros de Query:**
```typescript
interface DocumentsQuery {
  page?: number;           // Página (padrão: 1)
  limit?: number;          // Items por página (padrão: 20, máx: 100)
  type?: DocumentType;     // Filtro por tipo
  status?: DocumentStatus; // Filtro por status
  search?: string;         // Busca em título/conteúdo
  sort?: string;          // Campo de ordenação
  order?: 'asc' | 'desc'; // Direção da ordenação
  date_from?: string;     // Data início (ISO 8601)
  date_to?: string;       // Data fim (ISO 8601)
}
```

**Exemplo de Requisição:**
```bash
curl -X GET "https://api.docanalysis.com/v1/documents?type=edital&status=analyzed&page=1&limit=10" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_12345",
        "title": "Edital de Licitação 001/2025",
        "type": "edital",
        "status": "analyzed",
        "file_name": "edital_001_2025.pdf",
        "file_size": 2048576,
        "upload_date": "2025-08-10T14:30:00Z",
        "analysis_date": "2025-08-10T15:45:00Z",
        "conformity_score": 85,
        "problem_count": 3,
        "created_by": {
          "id": "user_123",
          "name": "João Silva",
          "email": "joao.silva@org.gov.br"
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total_pages": 5,
      "total_items": 47,
      "has_next": true,
      "has_prev": false
    }
  },
  "meta": {
    "timestamp": "2025-08-11T10:30:00Z",
    "version": "1.0.0",
    "request_id": "req_abc123"
  }
}
```

### Obter Documento

#### `GET /documents/{id}`

Retorna detalhes completos de um documento específico.

**Parâmetros de Path:**
- `id` (string, required): ID único do documento

**Parâmetros de Query:**
```typescript
interface DocumentDetailQuery {
  include_content?: boolean; // Incluir conteúdo completo (padrão: false)
  include_analysis?: boolean; // Incluir análise detalhada (padrão: true)
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "doc_12345",
    "title": "Edital de Licitação 001/2025",
    "type": "edital",
    "modalidade": "pregao_eletronico",
    "status": "analyzed",
    "file_name": "edital_001_2025.pdf",
    "file_size": 2048576,
    "upload_date": "2025-08-10T14:30:00Z",
    "analysis_date": "2025-08-10T15:45:00Z",
    "metadata": {
      "process_number": "23456.789012/2025-01",
      "organ": "Secretaria Municipal de Obras",
      "estimated_value": 150000.00,
      "currency": "BRL",
      "bid_opening_date": "2025-09-15T09:00:00Z",
      "object": "Contratação de empresa para reforma de prédio público"
    },
    "analysis": {
      "id": "analysis_789",
      "conformity_score": 85,
      "execution_time": 45.2,
      "problems_summary": {
        "total": 3,
        "by_severity": {
          "critica": 0,
          "alta": 1,
          "media": 2,
          "baixa": 0
        },
        "by_category": {
          "juridico": 1,
          "tecnico": 0,
          "orcamentario": 1,
          "formal": 1
        }
      }
    },
    "created_by": {
      "id": "user_123",
      "name": "João Silva",
      "email": "joao.silva@org.gov.br"
    }
  }
}
```

### Criar Documento

#### `POST /documents`

Cria um novo documento com upload de arquivo.

**Content-Type:** `multipart/form-data`

**Campos do Formulário:**
```typescript
interface CreateDocumentForm {
  file: File;                    // Arquivo do documento (PDF, DOC, DOCX)
  title: string;                 // Título do documento
  type: DocumentType;            // Tipo do documento
  modalidade?: string;           // Modalidade (se aplicável)
  metadata?: string;             // JSON com metadados adicionais
  auto_analyze?: boolean;        // Iniciar análise automaticamente (padrão: true)
}
```

**Exemplo de Requisição:**
```bash
curl -X POST "https://api.docanalysis.com/v1/documents" \
  -H "Authorization: Bearer {token}" \
  -F "file=@edital.pdf" \
  -F "title=Edital de Licitação 002/2025" \
  -F "type=edital" \
  -F "modalidade=pregao_eletronico" \
  -F "auto_analyze=true"
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "data": {
    "id": "doc_12346",
    "title": "Edital de Licitação 002/2025",
    "type": "edital",
    "status": "processing",
    "file_name": "edital.pdf",
    "file_size": 1536789,
    "upload_date": "2025-08-11T10:30:00Z",
    "analysis_status": "queued"
  }
}
```

### Atualizar Documento

#### `PUT /documents/{id}`

Atualiza metadados do documento (não o arquivo).

**Parâmetros de Path:**
- `id` (string, required): ID único do documento

**Corpo da Requisição:**
```json
{
  "title": "Novo título do documento",
  "metadata": {
    "process_number": "23456.789012/2025-02",
    "estimated_value": 200000.00
  }
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "doc_12345",
    "title": "Novo título do documento",
    // ... outros campos atualizados
    "updated_at": "2025-08-11T10:45:00Z"
  }
}
```

### Excluir Documento

#### `DELETE /documents/{id}`

Remove permanentemente um documento e suas análises.

**Parâmetros de Path:**
- `id` (string, required): ID único do documento

**Resposta de Sucesso (204):**
```
(Sem conteúdo)
```

---

## 🔍 Análises

### Iniciar Análise

#### `POST /documents/{id}/analyze`

Inicia uma nova análise para o documento especificado.

**Parâmetros de Path:**
- `id` (string, required): ID único do documento

**Corpo da Requisição:**
```json
{
  "analysis_type": "full",           // full | quick | custom
  "rules": ["edital_basic", "tcr"],  // IDs das regras a aplicar (opcional)
  "ai_enabled": true,                // Usar análise por IA (padrão: true)
  "priority": "normal"               // high | normal | low
}
```

**Resposta de Sucesso (202):**
```json
{
  "success": true,
  "data": {
    "analysis_id": "analysis_790",
    "document_id": "doc_12345",
    "status": "queued",
    "estimated_duration": 60,
    "queue_position": 3
  }
}
```

### Obter Status da Análise

#### `GET /documents/{id}/analysis`

Retorna o status atual da análise do documento.

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "analysis_790",
    "document_id": "doc_12345",
    "status": "completed",
    "started_at": "2025-08-11T10:30:00Z",
    "completed_at": "2025-08-11T10:31:15Z",
    "execution_time": 75.3,
    "progress": 100,
    "conformity_score": 85,
    "ai_analysis_used": true,
    "rules_applied": ["edital_basic", "tcr_standard"]
  }
}
```

### Obter Resultado da Análise

#### `GET /documents/{id}/analysis/result`

Retorna os resultados completos da análise.

**Parâmetros de Query:**
```typescript
interface AnalysisResultQuery {
  format?: 'json' | 'pdf' | 'excel'; // Formato da resposta (padrão: json)
  include_suggestions?: boolean;       // Incluir sugestões (padrão: true)
  severity_filter?: string[];         // Filtrar por severidade
  category_filter?: string[];         // Filtrar por categoria
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "analysis_id": "analysis_790",
    "document_id": "doc_12345",
    "conformity_score": 85,
    "execution_time": 75.3,
    "analysis_method": "hybrid",
    "problems": [
      {
        "id": "problem_001",
        "category": "juridico",
        "severity": "alta",
        "title": "Ausência de critério de julgamento",
        "description": "O edital não especifica claramente o critério de julgamento das propostas, conforme exigido pela Lei 14.133/21.",
        "suggestion": "Incluir seção específica detalhando o critério de julgamento (menor preço, melhor técnica, etc.).",
        "legal_reference": "Art. 34 da Lei 14.133/21",
        "location": "Seção 5 - Do Julgamento",
        "rule_id": "edital_criterio_julgamento",
        "confidence": 0.95
      },
      {
        "id": "problem_002",
        "category": "orcamentario",
        "severity": "media",
        "title": "Planilha orçamentária incompleta",
        "description": "A planilha orçamentária não detalha adequadamente os custos unitários de alguns itens.",
        "suggestion": "Detalhar custos unitários para todos os itens da planilha orçamentária.",
        "location": "Anexo II - Planilha Orçamentária",
        "rule_id": "orcamento_detalhamento",
        "confidence": 0.87
      }
    ],
    "summary": {
      "total_problems": 2,
      "by_severity": {
        "critica": 0,
        "alta": 1,
        "media": 1,
        "baixa": 0
      },
      "by_category": {
        "juridico": 1,
        "tecnico": 0,
        "orcamentario": 1,
        "formal": 0
      }
    },
    "recommendations": [
      "Revisar seção de critérios de julgamento",
      "Detalhar planilha orçamentária",
      "Validar conformidade com Lei 14.133/21"
    ],
    "ai_insights": {
      "overall_quality": "boa",
      "main_concerns": ["clareza dos critérios", "detalhamento orçamentário"],
      "compliance_level": "alto"
    }
  }
}
```

---

## ⚙️ Regras de Análise

### Listar Regras

#### `GET /rules`

Retorna lista de regras de análise disponíveis.

**Parâmetros de Query:**
```typescript
interface RulesQuery {
  document_type?: DocumentType;  // Filtrar por tipo de documento
  category?: RuleCategory;       // Filtrar por categoria
  active_only?: boolean;         // Apenas regras ativas (padrão: true)
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "edital_criterio_julgamento",
        "name": "Critério de Julgamento",
        "description": "Verifica se o critério de julgamento está especificado",
        "category": "juridico",
        "severity": "alta",
        "document_types": ["edital"],
        "active": true,
        "version": "1.2.0",
        "created_at": "2025-01-15T00:00:00Z",
        "updated_at": "2025-08-01T00:00:00Z"
      }
    ],
    "total": 25,
    "by_category": {
      "juridico": 10,
      "tecnico": 8,
      "orcamentario": 5,
      "formal": 2
    }
  }
}
```

### Obter Regra

#### `GET /rules/{id}`

Retorna detalhes completos de uma regra específica.

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "edital_criterio_julgamento",
    "name": "Critério de Julgamento",
    "description": "Verifica se o critério de julgamento está especificado no edital",
    "category": "juridico",
    "severity": "alta",
    "document_types": ["edital"],
    "active": true,
    "version": "1.2.0",
    "implementation": {
      "type": "keyword_any",
      "keywords": ["critério", "criterio", "julgamento"],
      "case_sensitive": false
    },
    "legal_reference": "Art. 34 da Lei 14.133/21",
    "suggestion_template": "Incluir seção específica detalhando o critério de julgamento.",
    "examples": [
      "Critério de julgamento: menor preço",
      "O critério de julgamento será..."
    ],
    "created_by": "system",
    "created_at": "2025-01-15T00:00:00Z",
    "updated_at": "2025-08-01T00:00:00Z"
  }
}
```

---

## 👤 Usuários

### Obter Perfil do Usuário

#### `GET /users/me`

Retorna o perfil do usuário autenticado.

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "João Silva",
    "email": "joao.silva@org.gov.br",
    "role": "analyst",
    "permissions": [
      "documents.read",
      "documents.create",
      "documents.update",
      "analysis.run"
    ],
    "preferences": {
      "language": "pt-BR",
      "timezone": "America/Sao_Paulo",
      "notifications": {
        "email": true,
        "analysis_complete": true,
        "errors": true
      }
    },
    "organization": {
      "id": "org_456",
      "name": "Prefeitura Municipal",
      "type": "government"
    },
    "created_at": "2025-01-10T00:00:00Z",
    "last_login": "2025-08-11T08:00:00Z"
  }
}
```

---

## 📊 Estatísticas

### Dashboard Geral

#### `GET /stats/dashboard`

Retorna estatísticas gerais para dashboard.

**Parâmetros de Query:**
```typescript
interface DashboardQuery {
  period?: '7d' | '30d' | '90d' | '1y'; // Período de análise (padrão: 30d)
  timezone?: string;                     // Timezone para agregações
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "summary": {
      "total_documents": 247,
      "analyzed_documents": 235,
      "average_score": 78.5,
      "total_problems": 1456,
      "analysis_time_avg": 45.2
    },
    "trends": {
      "documents_uploaded": {
        "current": 247,
        "previous": 189,
        "change_percent": 30.7
      },
      "conformity_score": {
        "current": 78.5,
        "previous": 75.2,
        "change_percent": 4.4
      }
    },
    "problems_by_severity": {
      "critica": 23,
      "alta": 145,
      "media": 678,
      "baixa": 610
    },
    "problems_by_category": {
      "juridico": 456,
      "tecnico": 234,
      "orcamentario": 567,
      "formal": 199
    },
    "recent_activity": [
      {
        "type": "document_analyzed",
        "document_id": "doc_12345",
        "document_title": "Edital 001/2025",
        "score": 85,
        "timestamp": "2025-08-11T09:30:00Z"
      }
    ]
  }
}
```

---

## 🔧 Sistema

### Health Check

#### `GET /health`

Verifica a saúde do sistema e dependências.

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2025-08-11T10:30:00Z",
    "uptime": 86400,
    "services": {
      "database": {
        "status": "healthy",
        "response_time": 12
      },
      "ai_service": {
        "status": "healthy",
        "response_time": 245
      },
      "file_storage": {
        "status": "healthy",
        "response_time": 8
      }
    },
    "metrics": {
      "cpu_usage": 45.2,
      "memory_usage": 67.8,
      "disk_usage": 23.1
    }
  }
}
```

### Informações da API

#### `GET /info`

Retorna informações sobre a versão e recursos da API.

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "name": "Document Analysis API",
    "version": "1.0.0",
    "description": "API para análise de documentos jurídicos",
    "documentation_url": "https://docs.docanalysis.com",
    "support_email": "suporte@docanalysis.com",
    "features": [
      "document_upload",
      "ai_analysis",
      "rule_engine",
      "export_reports"
    ],
    "rate_limits": {
      "requests_per_minute": 100,
      "uploads_per_hour": 50,
      "analysis_per_day": 500
    },
    "supported_formats": [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
  }
}
```

---

## 📋 Códigos de Erro

### Erros de Validação

#### `VALIDATION_ERROR` (422)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos fornecidos",
    "details": [
      {
        "field": "document_type",
        "message": "Deve ser um dos valores: edital, termo_referencia, contrato",
        "code": "INVALID_ENUM"
      }
    ]
  }
}
```

### Erros de Negócio

#### `DOCUMENT_NOT_FOUND` (404)
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado",
    "details": {
      "document_id": "doc_invalid"
    }
  }
}
```

#### `ANALYSIS_IN_PROGRESS` (409)
```json
{
  "success": false,
  "error": {
    "code": "ANALYSIS_IN_PROGRESS",
    "message": "Análise já está em andamento para este documento",
    "details": {
      "analysis_id": "analysis_789",
      "status": "processing",
      "progress": 45
    }
  }
}
```

### Erros de Sistema

#### `AI_SERVICE_UNAVAILABLE` (503)
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "Serviço de IA temporariamente indisponível",
    "details": {
      "fallback": "rules_only",
      "retry_after": 300
    }
  }
}
```

---

## 🔐 Autenticação e Autorização

### Obter Token JWT

#### `POST /auth/login`

Autentica usuário e retorna token JWT.

**Corpo da Requisição:**
```json
{
  "email": "joao.silva@org.gov.br",
  "password": "senha_segura"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "refresh_token_here",
    "user": {
      "id": "user_123",
      "name": "João Silva",
      "email": "joao.silva@org.gov.br",
      "role": "analyst"
    }
  }
}
```

### Renovar Token

#### `POST /auth/refresh`

Renova token JWT usando refresh token.

**Corpo da Requisição:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "novo_jwt_token",
    "expires_in": 3600
  }
}
```

### Permissões

#### Níveis de Acesso
- **viewer**: Visualizar documentos e análises
- **analyst**: Visualizar, criar e analisar documentos
- **manager**: Todas as ações + gerenciar regras
- **admin**: Acesso completo ao sistema

#### Matriz de Permissões
| Recurso | Viewer | Analyst | Manager | Admin |
|---------|--------|---------|---------|-------|
| Ver documentos | ✅ | ✅ | ✅ | ✅ |
| Criar documentos | ❌ | ✅ | ✅ | ✅ |
| Analisar documentos | ❌ | ✅ | ✅ | ✅ |
| Gerenciar regras | ❌ | ❌ | ✅ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ❌ | ✅ |

---

## 📏 Rate Limiting

### Limites por Plano

#### Plano Básico
- **Requisições**: 100/minuto
- **Uploads**: 20/hora
- **Análises**: 100/dia

#### Plano Professional
- **Requisições**: 500/minuto
- **Uploads**: 100/hora
- **Análises**: 1000/dia

#### Headers de Rate Limit
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1628697600
X-RateLimit-Retry-After: 60
```

### Resposta de Rate Limit (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Limite de requisições excedido",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retry_after": 60
    }
  }
}
```

---

## 🧪 Testes da API

### Coleção Postman
```bash
# Importar coleção
curl -O https://api.docanalysis.com/postman/collection.json

# Variáveis de ambiente
BASE_URL=https://api.docanalysis.com/v1
API_TOKEN=your_jwt_token_here
```

### Exemplos de Teste

#### Teste de Upload e Análise Completa
```bash
#!/bin/bash

# 1. Fazer login
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r '.data.access_token')

# 2. Upload de documento
DOC_ID=$(curl -s -X POST "$BASE_URL/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_edital.pdf" \
  -F "title=Teste Edital" \
  -F "type=edital" \
  | jq -r '.data.id')

# 3. Aguardar análise
while true; do
  STATUS=$(curl -s -X GET "$BASE_URL/documents/$DOC_ID/analysis" \
    -H "Authorization: Bearer $TOKEN" \
    | jq -r '.data.status')
  
  if [ "$STATUS" = "completed" ]; then
    break
  fi
  
  echo "Status: $STATUS, aguardando..."
  sleep 5
done

# 4. Obter resultado
curl -s -X GET "$BASE_URL/documents/$DOC_ID/analysis/result" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.problems'
```

---

## 📚 SDKs e Bibliotecas

### JavaScript/TypeScript

#### Instalação
```bash
npm install @docanalysis/sdk
```

#### Uso Básico
```typescript
import { DocAnalysisClient } from '@docanalysis/sdk';

const client = new DocAnalysisClient({
  baseUrl: 'https://api.docanalysis.com/v1',
  apiKey: 'your-api-key'
});

// Upload e análise
const document = await client.documents.create({
  file: fileBuffer,
  title: 'Meu Edital',
  type: 'edital',
  autoAnalyze: true
});

// Aguardar análise
const analysis = await client.documents.waitForAnalysis(document.id);

console.log(`Score: ${analysis.conformity_score}%`);
console.log(`Problemas: ${analysis.problems.length}`);
```

### Python

#### Instalação
```bash
pip install docanalysis-sdk
```

#### Uso Básico
```python
from docanalysis import DocAnalysisClient

client = DocAnalysisClient(
    base_url='https://api.docanalysis.com/v1',
    api_key='your-api-key'
)

# Upload e análise
with open('edital.pdf', 'rb') as f:
    document = client.documents.create(
        file=f,
        title='Meu Edital',
        type='edital',
        auto_analyze=True
    )

# Aguardar análise
analysis = client.documents.wait_for_analysis(document['id'])

print(f"Score: {analysis['conformity_score']}%")
print(f"Problemas: {len(analysis['problems'])}")
```

---

## 🔄 Webhooks

### Configuração

#### `POST /webhooks`

Configura webhook para receber notificações.

**Corpo da Requisição:**
```json
{
  "url": "https://your-app.com/webhooks/docanalysis",
  "events": [
    "document.created",
    "analysis.completed",
    "analysis.failed"
  ],
  "secret": "webhook-secret-key"
}
```

### Eventos Disponíveis

#### `document.created`
```json
{
  "event": "document.created",
  "timestamp": "2025-08-11T10:30:00Z",
  "data": {
    "document_id": "doc_12345",
    "title": "Edital 001/2025",
    "type": "edital",
    "created_by": "user_123"
  }
}
```

#### `analysis.completed`
```json
{
  "event": "analysis.completed",
  "timestamp": "2025-08-11T10:31:15Z",
  "data": {
    "analysis_id": "analysis_790",
    "document_id": "doc_12345",
    "conformity_score": 85,
    "problems_count": 3,
    "execution_time": 75.3
  }
}
```

### Verificação de Assinatura

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computed = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature.replace('sha256=', '')),
    Buffer.from(computed)
  );
}
```

---

## 📈 Monitoramento e Logs

### Logs de Auditoria

#### `GET /audit/logs`

Retorna logs de auditoria das operações.

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_123",
        "timestamp": "2025-08-11T10:30:00Z",
        "user_id": "user_123",
        "action": "document.analyze",
        "resource": "doc_12345",
        "ip_address": "192.168.1.100",
        "user_agent": "DocAnalysis SDK v1.0.0",
        "metadata": {
          "analysis_type": "full",
          "ai_enabled": true
        }
      }
    ]
  }
}
```

### Métricas de Performance

#### `GET /metrics`

Retorna métricas de performance da API.

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "requests": {
      "total": 15420,
      "per_minute": 25.7,
      "success_rate": 99.2
    },
    "response_times": {
      "avg": 245,
      "p50": 180,
      "p95": 450,
      "p99": 890
    },
    "analyses": {
      "total": 1250,
      "avg_duration": 45.3,
      "success_rate": 98.8
    }
  }
}
```

---

*API Documentation v1.0*
*Última atualização: 11 de Agosto, 2025*
*Próxima revisão: 11 de Setembro, 2025*
*Owner: Backend Team*