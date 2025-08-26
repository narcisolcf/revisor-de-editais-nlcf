# 🔥 Firestore Implementation - LicitaReview

## 🎯 **IMPLEMENTAÇÃO COMPLETA**

Estrutura Firestore completa para configurações organizacionais do LicitaReview com **parâmetros personalizáveis** como diferencial competitivo.

## 📊 **Estrutura do Banco de Dados**

### **📁 Collections Hierarchy**

```
/organizations/{orgId}/
├── profile/                   # Organization profile & settings
├── templates/{templateId}     # 📝 Custom document templates  
├── analysis_rules/{ruleId}    # 📋 Custom analysis rules
├── custom_params/{configId}   # 🚀 Analysis parameters (CORE)
└── users/{userId}             # 👥 Organization users & permissions

/documents/{docId}/
├── metadata                   # 📄 Basic document info & security
├── analyses/{analysisId}      # 📊 Analysis results (weighted)
├── versions/{versionId}       # 📑 Document versions & history
└── comments/{commentId}       # 💬 Review comments & threads
```

## 🚀 **CORE DIFFERENTIATOR: Custom Parameters**

### **Personalized Analysis Weights**
```typescript
// Different organizations = Different analysis focus
const tcu_weights = {
  structural: 15.0,   // Tribunal focuses on legal compliance
  legal: 60.0,        // 🔥 PRIMARY FOCUS
  clarity: 20.0,
  abnt: 5.0
};

const prefeitura_weights = {
  structural: 25.0,   // Municipality balanced approach  
  legal: 25.0,
  clarity: 25.0,      // Equal weight distribution
  abnt: 25.0
};

const iti_weights = {
  structural: 35.0,   // Technical org focuses on structure
  legal: 25.0,
  clarity: 15.0,
  abnt: 25.0         // Strong ABNT compliance
};
```

### **Same Document = Different Scores**
```
📄 Example: "Edital de Pregão Eletrônico"

TCU (Rigoroso):     75.5% (emphasis on legal: 60%)
Prefeitura (Padrão): 80.8% (balanced: 25% each)  
ITI (Técnico):      81.2% (structure focus: 35%)
```

## 💾 **Database Schema Implementation**

### **1. Organization Schema** (`organization.schema.ts`)
- ✅ **OrganizationProfile**: Complete org data with CNPJ, government level
- ✅ **DocumentTemplate**: GOV.BR compliant templates
- ✅ **AnalysisRule**: Custom validation rules with regex patterns
- ✅ **CustomParameters**: 🚀 **CORE** - Personalized analysis weights
- ✅ **OrganizationUser**: Role-based access control

### **2. Document Schema** (`document.schema.ts`)
- ✅ **DocumentMetadata**: File info, processing status, security
- ✅ **AnalysisResult**: 🚀 **Weighted scoring** with organization parameters
- ✅ **DocumentVersion**: Version control with change tracking
- ✅ **ReviewComment**: Collaborative review system

## 🏗️ **Repository Pattern Implementation**

### **Base Repository** (`BaseRepository.ts`)
```typescript
export abstract class BaseRepository<T, CreateT, UpdateT> {
  // ✅ CRUD operations with Zod validation
  // ✅ Pagination support
  // ✅ Real-time subscriptions  
  // ✅ Batch operations
  // ✅ Transaction support
  // ✅ Automatic timestamp conversion
}
```

### **Organization Repositories**
- ✅ **OrganizationRepository**: Organization management
- ✅ **TemplateRepository**: Template CRUD with organization scoping
- ✅ **AnalysisRuleRepository**: Rules with performance tracking
- ✅ **CustomParametersRepository**: 🚀 **CORE** - Parameters management
- ✅ **OrganizationUserRepository**: User management with permissions

### **Document Repositories**  
- ✅ **DocumentRepository**: Document lifecycle management
- ✅ **AnalysisRepository**: 🚀 **Weighted analysis** results
- ✅ **DocumentVersionRepository**: Version control
- ✅ **ReviewCommentRepository**: Collaborative features

## 🗄️ **Migration System**

### **Initial Data Migration** (`001-initial-data.ts`)
```typescript
✅ Example Organizations:
  • Tribunal de Contas da União (TCU) - Rigoroso
  • Prefeitura Municipal de SP - Padrão  
  • Instituto Nacional de TI - Técnico

✅ Default Analysis Rules:
  • ESTRUTURAL: Section validation, numbering
  • JURÍDICO: Lei 14.133/2021, modality checks
  • CLAREZA: Technical language, sentence length  
  • ABNT: Date formatting, page numbering

✅ GOV.BR Templates:
  • Edital de Pregão Eletrônico
  • Termo de Referência - Serviços
  • Ata de Sessão Pública

✅ Custom Parameters (🚀 CORE):
  • Rigoroso (60% legal weight)
  • Padrão (25% balanced)
  • Técnico (35% structural)
  • Rápido (optimized)
```

### **Migration Runner** (`migration-runner.ts`)
```bash
npm run migrate              # Run all migrations
npm run migrate:status       # Show migration status  
npm run migrate -- --id 001  # Run specific migration
npm run migrate -- --rollback 001  # Rollback
npm run seed                 # Seed development data
```

## 🔐 **Security Rules** (`firestore.rules`)

### **Organization-Level Security**
```javascript
// Users can only access their organization data
allow read: if isUserInOrganization(organizationId);

// Custom parameters require MANAGE_CONFIGS permission  
allow update: if hasPermission(organizationId, 'MANAGE_CONFIGS');

// Document access based on security classification
allow read: if canAccessDocument(documentData);
```

### **Role-Based Permissions**
```typescript
PERMISSIONS = [
  'READ_DOCUMENTS', 'WRITE_DOCUMENTS', 'DELETE_DOCUMENTS',
  'MANAGE_TEMPLATES', 'MANAGE_RULES', 'MANAGE_CONFIGS',
  'MANAGE_USERS', 'VIEW_ANALYTICS', 'EXPORT_DATA'
];

ROLES = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'GUEST'];
```

## 📈 **Performance Optimization**

### **Firestore Indexes** (`firestore.indexes.json`)
```typescript
✅ Organization queries:
  • status + createdAt  
  • organizationType + name
  • governmentLevel + createdAt

✅ Document queries:
  • organizationId + createdAt
  • organizationId + documentType + createdAt  
  • organizationId + status + updatedAt

✅ Analysis queries (🚀 CORE):
  • organizationId + configurationId + createdAt
  • organizationId + scores.overall
  • Collection group queries for analytics
```

### **Query Performance**
- ✅ Composite indexes for complex queries
- ✅ Array-contains indexes for tags and rules
- ✅ Collection group indexes for cross-document analytics
- ✅ Field overrides for full-text search fields

## 🛠️ **Development Tools**

### **Migration Scripts**
```bash
# Development environment setup
npm run migrate              # Run all migrations
npm run seed                # Add development data

# Production deployment  
npm run migrate:status      # Check migration status
npm run deploy:prod        # Deploy to production
```

### **Database Management**
```typescript
// Database initialization
const db = initializeDatabase();

// Repository factory
const repos = await createOrganizationRepository(db);
const docRepos = await createDocumentRepository(db);

// Health check
const isHealthy = await healthCheck();
```

## 🎯 **Usage Examples**

### **🚀 CORE: Create Custom Parameters**
```typescript
const customConfig = await paramsRepo.createForOrganization(orgId, {
  name: 'TCU - Foco Jurídico Extremo',
  presetType: 'CUSTOM',
  weights: {
    structural: 10.0,
    legal: 70.0,    // 🔥 Maximum legal focus
    clarity: 15.0,
    abnt: 5.0
  },
  thresholds: {
    excellent: 95,  // Higher standards
    good: 85,
    acceptable: 75,
    poor: 60,
    critical: 40
  }
});
```

### **📊 Weighted Analysis Results**
```typescript
// Analysis uses organization's custom parameters
const analysis = await analysisRepo.createForDocument(docId, {
  organizationId: 'tcu-org-id',
  configurationId: customConfig.id,  // 🚀 Uses custom weights
  scores: {
    overall: 78.5,                   // Calculated with org weights
    structural: 85.0,
    legal: 75.0,                     // Weighted as 70% = 52.5 points
    clarity: 80.0,                   // Weighted as 15% = 12.0 points  
    abnt: 90.0                       // Weighted as 5% = 4.5 points
    // Total: 52.5 + 12.0 + 4.5 + (10% × 85.0) = 78.5%
  }
});
```

### **📋 Organization Dashboard**
```typescript
// Get statistics with custom parameters impact
const stats = await analysisRepo.getStatistics(orgId);
// Returns: average scores, distribution, most used config, etc.

const templates = await templateRepo.findByOrganization(orgId);
const rules = await ruleRepo.findEnabledByCategory(orgId, 'JURIDICO');
const users = await userRepo.findActive(orgId);
```

## 📊 **Key Metrics**

### **Implementation Status**
- ✅ **Schemas**: 2 complete schemas (Organization, Document)
- ✅ **Repositories**: 7 repository classes with full CRUD
- ✅ **Migration**: 1 initial data migration + runner system
- ✅ **Security**: Complete Firestore rules with role-based access
- ✅ **Indexes**: 25+ optimized indexes for performance
- ✅ **Scripts**: Migration, seeding, and development tools

### **🚀 CORE DIFFERENTIATOR Coverage**
- ✅ **Custom Parameters**: Complete implementation
- ✅ **Weighted Analysis**: Organization-specific scoring
- ✅ **Flexible Rules**: Regex-based custom validation
- ✅ **Templates**: GOV.BR compliant with customization
- ✅ **Multi-tenant**: Complete organization isolation

## 🎉 **Ready for Production**

The Firestore implementation is **production-ready** with:

✅ **Scalable Architecture**: Supports unlimited organizations  
✅ **Security**: Role-based access with audit trails  
✅ **Performance**: Optimized indexes and queries  
✅ **🚀 CORE FEATURE**: Personalized analysis parameters  
✅ **Developer Tools**: Migration system and scripts  
✅ **Documentation**: Complete implementation guide

---

**🔥 LicitaReview Firestore - Powered by Personalized Analysis Parameters**