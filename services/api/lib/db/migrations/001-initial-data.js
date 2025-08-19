"use strict";
/**
 * Initial Data Migration Script
 *
 * Populates Firestore with:
 * - Default analysis rules by document type
 * - Official GOV.BR templates
 * - Example organizations
 * - Default analysis configurations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialDataMigration = void 0;
const OrganizationRepository_1 = require("../repositories/OrganizationRepository");
class InitialDataMigration {
    constructor(db) {
        this.db = db;
        this.orgRepo = new OrganizationRepository_1.OrganizationRepository(db);
        this.templateRepo = new OrganizationRepository_1.TemplateRepository(db);
        this.ruleRepo = new OrganizationRepository_1.AnalysisRuleRepository(db);
        this.paramsRepo = new OrganizationRepository_1.CustomParametersRepository(db);
    }
    /**
     * Run the complete migration
     */
    async run() {
        console.log('🚀 Starting initial data migration...');
        try {
            // 1. Create example organizations
            const organizations = await this.createExampleOrganizations();
            console.log(`✅ Created ${organizations.length} example organizations`);
            // 2. Create default analysis rules for each organization
            let totalRules = 0;
            for (const org of organizations) {
                const rules = await this.createDefaultAnalysisRules(org.id);
                totalRules += rules.length;
            }
            console.log(`✅ Created ${totalRules} default analysis rules`);
            // 3. Create GOV.BR official templates for each organization
            let totalTemplates = 0;
            for (const org of organizations) {
                const templates = await this.createGovBRTemplates(org.id);
                totalTemplates += templates.length;
            }
            console.log(`✅ Created ${totalTemplates} GOV.BR templates`);
            // 4. Create default analysis configurations (🚀 CORE DIFFERENTIATOR)
            let totalConfigs = 0;
            for (const org of organizations) {
                const configs = await this.createDefaultConfigurations(org.id);
                totalConfigs += configs.length;
            }
            console.log(`✅ Created ${totalConfigs} default configurations`);
            console.log('🎉 Initial data migration completed successfully!');
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }
    /**
     * Create example organizations
     */
    async createExampleOrganizations() {
        const organizations = [
            {
                name: 'Tribunal de Contas da União',
                displayName: 'TCU',
                cnpj: '00.000.000/0001-91',
                governmentLevel: 'FEDERAL',
                organizationType: 'TRIBUNAL_CONTAS',
                contact: {
                    email: 'contato@tcu.gov.br',
                    phone: '(61) 3316-5000',
                    website: 'https://portal.tcu.gov.br',
                    address: {
                        street: 'SAFS Quadra 4, Lote 1',
                        city: 'Brasília',
                        state: 'DF',
                        zipCode: '70042-900',
                        country: 'BR'
                    }
                },
                settings: {
                    defaultAnalysisPreset: 'RIGOROUS',
                    strictMode: true,
                    requireDualApproval: true
                },
                createdBy: 'migration-script'
            },
            {
                name: 'Prefeitura Municipal de São Paulo',
                displayName: 'PMSP',
                cnpj: '46.395.000/0001-39',
                governmentLevel: 'MUNICIPAL',
                organizationType: 'PREFEITURA',
                contact: {
                    email: 'licitacoes@capital.sp.gov.br',
                    phone: '(11) 3113-9000',
                    website: 'https://capital.sp.gov.br',
                    address: {
                        street: 'Viaduto do Chá, 15',
                        city: 'São Paulo',
                        state: 'SP',
                        zipCode: '01002-020',
                        country: 'BR'
                    }
                },
                settings: {
                    defaultAnalysisPreset: 'STANDARD',
                    strictMode: false,
                    requireDualApproval: false
                },
                createdBy: 'migration-script'
            },
            {
                name: 'Instituto Nacional de Tecnologia da Informação',
                displayName: 'ITI',
                cnpj: '04.384.008/0001-81',
                governmentLevel: 'FEDERAL',
                organizationType: 'AUTARQUIA',
                contact: {
                    email: 'contato@iti.gov.br',
                    phone: '(61) 3411-2500',
                    website: 'https://www.iti.gov.br',
                    address: {
                        street: 'Quadra 515 Sul, Bloco C, Lote 4',
                        city: 'Brasília',
                        state: 'DF',
                        zipCode: '70770-503',
                        country: 'BR'
                    }
                },
                settings: {
                    defaultAnalysisPreset: 'TECHNICAL',
                    enableAIAnalysis: true,
                    strictMode: false
                },
                createdBy: 'migration-script'
            }
        ];
        const createdOrgs = [];
        for (const orgData of organizations) {
            const existing = await this.orgRepo.findByCNPJ(orgData.cnpj);
            if (!existing) {
                const org = await this.orgRepo.create(orgData);
                createdOrgs.push(org);
            }
        }
        return createdOrgs;
    }
    /**
     * Create default analysis rules by document type
     */
    async createDefaultAnalysisRules(organizationId) {
        const rules = [
            // ESTRUTURAL Rules
            {
                name: 'Verificação de Seções Obrigatórias',
                description: 'Verifica se todas as seções obrigatórias estão presentes no documento',
                category: 'ESTRUTURAL',
                severity: 'CRITICA',
                pattern: '(objeto|finalidade|prazo|valor|pagamento)',
                patternType: 'regex',
                condition: {
                    type: 'CONTAINS',
                    value: 'objeto'
                },
                action: {
                    type: 'FLAG',
                    message: 'Seção obrigatória pode estar ausente',
                    suggestion: 'Verifique se todas as seções obrigatórias estão incluídas'
                },
                appliesToDocumentTypes: ['EDITAL', 'TERMO_REFERENCIA'],
                weight: 8,
                priority: 5
            },
            {
                name: 'Numeração Sequencial',
                description: 'Verifica se os itens estão numerados sequencialmente',
                category: 'ESTRUTURAL',
                severity: 'MEDIA',
                pattern: '\\d+\\.\\d+',
                patternType: 'regex',
                condition: {
                    type: 'MATCHES',
                    value: '\\d+\\.\\d+'
                },
                action: {
                    type: 'SUGGEST',
                    message: 'Numeração pode estar inconsistente',
                    suggestion: 'Verifique a numeração sequencial dos itens'
                },
                weight: 5,
                priority: 3
            },
            // JURÍDICO Rules
            {
                name: 'Referência à Lei 14.133/2021',
                description: 'Verifica referência à nova Lei de Licitações',
                category: 'JURIDICO',
                severity: 'CRITICA',
                pattern: 'lei\\s*14\\.133',
                patternType: 'regex',
                caseSensitive: false,
                condition: {
                    type: 'CONTAINS',
                    value: 'lei 14.133'
                },
                action: {
                    type: 'FLAG',
                    message: 'Referência à Lei 14.133/2021 não encontrada',
                    suggestion: 'Inclua referência à nova Lei de Licitações (Lei 14.133/2021)'
                },
                appliesToDocumentTypes: ['EDITAL', 'CONTRATO'],
                weight: 10,
                priority: 5
            },
            {
                name: 'Modalidade de Licitação',
                description: 'Verifica se a modalidade de licitação está especificada',
                category: 'JURIDICO',
                severity: 'ALTA',
                pattern: '(pregão|concorrência|tomada de preços|convite|concurso|leilão)',
                patternType: 'regex',
                caseSensitive: false,
                condition: {
                    type: 'CONTAINS',
                    value: 'modalidade'
                },
                action: {
                    type: 'FLAG',
                    message: 'Modalidade de licitação não identificada claramente',
                    suggestion: 'Especifique claramente a modalidade de licitação'
                },
                appliesToDocumentTypes: ['EDITAL'],
                weight: 9,
                priority: 4
            },
            // CLAREZA Rules
            {
                name: 'Linguagem Técnica Excessiva',
                description: 'Identifica uso excessivo de termos técnicos sem explicação',
                category: 'CLAREZA',
                severity: 'MEDIA',
                pattern: '([A-Z]{3,})',
                patternType: 'regex',
                condition: {
                    type: 'MATCHES',
                    value: '[A-Z]{3,}'
                },
                action: {
                    type: 'SUGGEST',
                    message: 'Possível uso de siglas ou termos técnicos',
                    suggestion: 'Considere explicar siglas e termos técnicos para melhor compreensão'
                },
                weight: 6,
                priority: 3
            },
            {
                name: 'Frases Muito Longas',
                description: 'Identifica frases excessivamente longas que podem prejudicar a clareza',
                category: 'CLAREZA',
                severity: 'BAIXA',
                pattern: '[^.!?]{150,}[.!?]',
                patternType: 'regex',
                condition: {
                    type: 'MATCHES',
                    value: '[^.!?]{150,}[.!?]'
                },
                action: {
                    type: 'SUGGEST',
                    message: 'Frase muito longa detectada',
                    suggestion: 'Considere dividir frases longas para melhorar a legibilidade'
                },
                weight: 4,
                priority: 2
            },
            // ABNT Rules
            {
                name: 'Formatação de Datas',
                description: 'Verifica se as datas seguem o padrão ABNT (dd/mm/aaaa)',
                category: 'ABNT',
                severity: 'MEDIA',
                pattern: '\\d{2}/\\d{2}/\\d{4}',
                patternType: 'regex',
                condition: {
                    type: 'MATCHES',
                    value: '\\d{2}/\\d{2}/\\d{4}'
                },
                action: {
                    type: 'SUGGEST',
                    message: 'Verificar formatação de datas',
                    suggestion: 'Use o formato dd/mm/aaaa conforme padrão ABNT'
                },
                weight: 3,
                priority: 2
            },
            {
                name: 'Numeração de Páginas',
                description: 'Verifica se há indicação de numeração de páginas',
                category: 'ABNT',
                severity: 'BAIXA',
                pattern: '(página|pág|p\\.)',
                patternType: 'regex',
                caseSensitive: false,
                condition: {
                    type: 'CONTAINS',
                    value: 'página'
                },
                action: {
                    type: 'SUGGEST',
                    message: 'Verificar numeração de páginas',
                    suggestion: 'Certifique-se de que as páginas estão numeradas conforme ABNT'
                },
                weight: 2,
                priority: 1
            }
        ];
        const createdRules = [];
        for (const ruleData of rules) {
            const rule = await this.ruleRepo.createForOrganization(organizationId, Object.assign(Object.assign({}, ruleData), { createdBy: 'migration-script' }));
            createdRules.push(rule);
        }
        return createdRules;
    }
    /**
     * Create official GOV.BR templates
     */
    async createGovBRTemplates(organizationId) {
        const templates = [
            {
                name: 'Edital de Pregão Eletrônico - Padrão',
                description: 'Template padrão para editais de pregão eletrônico conforme legislação vigente',
                documentType: 'EDITAL',
                version: '1.0.0',
                sections: [
                    {
                        id: 'preambulo',
                        name: 'Preâmbulo',
                        description: 'Identificação do órgão e modalidade',
                        order: 1,
                        required: true,
                        fields: [
                            {
                                id: 'orgao_nome',
                                name: 'Nome do Órgão',
                                type: 'TEXT',
                                required: true,
                                description: 'Nome completo do órgão licitante'
                            },
                            {
                                id: 'cnpj',
                                name: 'CNPJ',
                                type: 'TEXT',
                                required: true,
                                validation: {
                                    pattern: '\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}'
                                }
                            },
                            {
                                id: 'modalidade',
                                name: 'Modalidade',
                                type: 'SELECT',
                                required: true,
                                validation: {
                                    options: ['Pregão Eletrônico', 'Concorrência', 'Tomada de Preços']
                                }
                            }
                        ]
                    },
                    {
                        id: 'objeto',
                        name: 'Objeto da Licitação',
                        description: 'Descrição detalhada do objeto',
                        order: 2,
                        required: true,
                        fields: [
                            {
                                id: 'descricao_objeto',
                                name: 'Descrição do Objeto',
                                type: 'TEXT',
                                required: true,
                                validation: {
                                    minLength: 50
                                }
                            },
                            {
                                id: 'valor_estimado',
                                name: 'Valor Estimado',
                                type: 'NUMBER',
                                required: true,
                                validation: {
                                    min: 0
                                }
                            }
                        ]
                    },
                    {
                        id: 'participacao',
                        name: 'Condições de Participação',
                        description: 'Requisitos para participação',
                        order: 3,
                        required: true,
                        fields: [
                            {
                                id: 'habilitacao',
                                name: 'Documentos de Habilitação',
                                type: 'TEXT',
                                required: true
                            }
                        ]
                    }
                ],
                isDefault: true,
                isPublic: true
            },
            {
                name: 'Termo de Referência - Serviços',
                description: 'Template para termo de referência de contratação de serviços',
                documentType: 'TERMO_REFERENCIA',
                version: '1.0.0',
                sections: [
                    {
                        id: 'introducao',
                        name: 'Introdução',
                        order: 1,
                        required: true,
                        fields: [
                            {
                                id: 'justificativa',
                                name: 'Justificativa',
                                type: 'TEXT',
                                required: true,
                                description: 'Justificativa para a contratação'
                            }
                        ]
                    },
                    {
                        id: 'especificacoes',
                        name: 'Especificações Técnicas',
                        order: 2,
                        required: true,
                        fields: [
                            {
                                id: 'detalhamento',
                                name: 'Detalhamento Técnico',
                                type: 'TEXT',
                                required: true
                            }
                        ]
                    }
                ],
                isDefault: true,
                isPublic: true
            },
            {
                name: 'Ata de Sessão Pública',
                description: 'Template para registro de sessão pública de licitação',
                documentType: 'ATA_SESSAO',
                version: '1.0.0',
                sections: [
                    {
                        id: 'identificacao',
                        name: 'Identificação',
                        order: 1,
                        required: true,
                        fields: [
                            {
                                id: 'data_sessao',
                                name: 'Data da Sessão',
                                type: 'DATE',
                                required: true
                            },
                            {
                                id: 'local',
                                name: 'Local',
                                type: 'TEXT',
                                required: true
                            }
                        ]
                    }
                ],
                isDefault: true
            }
        ];
        const createdTemplates = [];
        for (const templateData of templates) {
            const template = await this.templateRepo.createForOrganization(organizationId, Object.assign(Object.assign({}, templateData), { createdBy: 'migration-script' }));
            createdTemplates.push(template);
        }
        return createdTemplates;
    }
    /**
     * Create default analysis configurations (🚀 CORE DIFFERENTIATOR)
     */
    async createDefaultConfigurations(organizationId) {
        const configs = [
            {
                name: 'Rigoroso (Foco Jurídico)',
                description: 'Configuração com ênfase em conformidade jurídica e regulamentação',
                presetType: 'RIGOROUS',
                weights: {
                    structural: 15.0,
                    legal: 60.0,
                    clarity: 20.0,
                    abnt: 5.0
                },
                thresholds: {
                    excellent: 90,
                    good: 80,
                    acceptable: 70,
                    poor: 50,
                    critical: 30
                },
                advanced: {
                    strictCompliance: true,
                    enableContextualAnalysis: true,
                    analysisTimeout: 600
                },
                isDefault: false,
                status: 'ACTIVE'
            },
            {
                name: 'Padrão (Balanceado)',
                description: 'Configuração balanceada para análise geral de documentos',
                presetType: 'STANDARD',
                weights: {
                    structural: 25.0,
                    legal: 25.0,
                    clarity: 25.0,
                    abnt: 25.0
                },
                thresholds: {
                    excellent: 90,
                    good: 75,
                    acceptable: 60,
                    poor: 40,
                    critical: 25
                },
                advanced: {
                    enableContextualAnalysis: true,
                    analysisTimeout: 300
                },
                isDefault: true,
                status: 'ACTIVE'
            },
            {
                name: 'Técnico (Foco Estrutural)',
                description: 'Configuração com ênfase na estrutura e organização do documento',
                presetType: 'TECHNICAL',
                weights: {
                    structural: 35.0,
                    legal: 25.0,
                    clarity: 15.0,
                    abnt: 25.0
                },
                thresholds: {
                    excellent: 85,
                    good: 70,
                    acceptable: 55,
                    poor: 35,
                    critical: 20
                },
                advanced: {
                    enableSemanticAnalysis: true,
                    parallelProcessing: true
                },
                isDefault: false,
                status: 'ACTIVE'
            },
            {
                name: 'Rápido (Análise Essencial)',
                description: 'Configuração otimizada para análise rápida focada nos pontos essenciais',
                presetType: 'FAST',
                weights: {
                    structural: 30.0,
                    legal: 40.0,
                    clarity: 20.0,
                    abnt: 10.0
                },
                thresholds: {
                    excellent: 85,
                    good: 70,
                    acceptable: 55,
                    poor: 40,
                    critical: 25
                },
                advanced: {
                    analysisTimeout: 120,
                    batchSize: 20
                },
                isDefault: false,
                status: 'ACTIVE'
            }
        ];
        const createdConfigs = [];
        for (const configData of configs) {
            const config = await this.paramsRepo.createForOrganization(organizationId, Object.assign(Object.assign({}, configData), { createdBy: 'migration-script' }));
            createdConfigs.push(config);
        }
        return createdConfigs;
    }
    /**
     * Rollback migration (for testing)
     */
    async rollback() {
        console.log('🔄 Rolling back initial data migration...');
        try {
            // Get all organizations created by migration
            const organizations = await this.orgRepo.find({
                where: [{ field: 'createdBy', operator: '==', value: 'migration-script' }]
            });
            // Delete all related data for each organization
            for (const org of organizations) {
                // Delete templates
                const templates = await this.templateRepo.findByOrganization(org.id);
                for (const template of templates) {
                    await this.db.doc(`organizations/${org.id}/templates/${template.id}`).delete();
                }
                // Delete rules
                const rules = await this.ruleRepo.findByOrganization(org.id);
                for (const rule of rules) {
                    await this.db.doc(`organizations/${org.id}/analysis_rules/${rule.id}`).delete();
                }
                // Delete configurations
                const configs = await this.paramsRepo.findByOrganization(org.id);
                for (const config of configs) {
                    await this.db.doc(`organizations/${org.id}/custom_params/${config.id}`).delete();
                }
                // Delete organization
                await this.orgRepo.delete(org.id);
            }
            console.log('✅ Migration rollback completed');
        }
        catch (error) {
            console.error('❌ Rollback failed:', error);
            throw error;
        }
    }
}
exports.InitialDataMigration = InitialDataMigration;
//# sourceMappingURL=001-initial-data.js.map