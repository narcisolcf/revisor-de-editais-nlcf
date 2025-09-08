/**
 * Setup para testes de segurança
 *
 * Configurações e mocks compartilhados para todos os testes de segurança.
 */
import { jest } from '@jest/globals';
import { LoggingService } from '../../services/LoggingService';
import { MetricsService } from '../../services/MetricsService';
import { AuditService } from '../../services/AuditService';
import { SecurityManager } from '../../middleware/security';
export declare const mockFirestore: any;
/**
 * Inicializar serviços de teste
 */
export declare function setupTestServices(): {
    logger: LoggingService;
    metrics: MetricsService;
    auditService: AuditService;
    securityManager: SecurityManager;
};
/**
 * Limpar recursos de teste
 */
export declare function cleanupTestServices(): void;
/**
 * Obter instâncias de teste
 */
export declare function getTestServices(): {
    logger: LoggingService;
    metrics: MetricsService;
    auditService: AuditService;
    securityManager: SecurityManager;
};
/**
 * Aguardar um tempo específico (útil para testes de rate limiting)
 */
export declare function wait(ms: number): Promise<void>;
/**
 * Criar mock de request para testes
 */
export declare function createMockRequest(overrides?: any): any;
/**
 * Criar mock de response para testes
 */
export declare function createMockResponse(): any;
/**
 * Criar mock de next function
 */
export declare function createMockNext(): jest.Mock;
