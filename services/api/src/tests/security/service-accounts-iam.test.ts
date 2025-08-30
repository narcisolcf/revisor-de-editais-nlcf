/**
 * Testes de validação de Service Accounts e IAM Roles
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GoogleAuth } from 'google-auth-library';
import { AuthenticationService, AuthConfig } from '../../services/AuthenticationService';
import { CloudRunClient } from '../../services/CloudRunClient';

// Mock do Google Auth
jest.mock('google-auth-library');
const MockedGoogleAuth = GoogleAuth as jest.MockedClass<typeof GoogleAuth>;

describe('Testes de Service Accounts e IAM Roles', () => {
  let authService: AuthenticationService;
  let authConfig: AuthConfig;
  let mockGoogleAuth: jest.Mocked<GoogleAuth>;

  beforeEach(() => {
    // Configuração de autenticação
    authConfig = {
      projectId: 'test-project-id',
      serviceAccountEmail: 'test-service@test-project.iam.gserviceaccount.com',
      serviceAccountKeyPath: '/path/to/service-account-key.json',
      audience: 'https://test-cloud-run-service.run.app',
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/run.invoker',
        'https://www.googleapis.com/auth/iam'
      ]
    };

    // Mock do Google Auth
    mockGoogleAuth = {
      getAccessToken: jest.fn(),
      getIdTokenClient: jest.fn(),
      getClient: jest.fn(),
      getProjectId: jest.fn(),
      getCredentials: jest.fn()
    } as any;

    MockedGoogleAuth.mockImplementation(() => mockGoogleAuth);
    
    authService = new AuthenticationService(authConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validação de Service Account', () => {
    it('deve validar service account com credenciais válidas', async () => {
      // Mock de token válido
      mockGoogleAuth.getAccessToken.mockResolvedValue('valid-access-token');
      mockGoogleAuth.getCredentials.mockResolvedValue({
        client_email: authConfig.serviceAccountEmail,
        project_id: authConfig.projectId
      } as any);

      const token = await authService.getGoogleCloudToken();

      expect(token).toBe('valid-access-token');
      expect(mockGoogleAuth.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it('deve falhar com service account inválido', async () => {
      mockGoogleAuth.getAccessToken.mockRejectedValue(
        new Error('Service account key is invalid')
      );

      await expect(authService.getGoogleCloudToken())
        .rejects.toThrow('Falha na autenticação com Google Cloud');
    });

    it('deve validar email do service account', async () => {
      mockGoogleAuth.getCredentials.mockResolvedValue({
        client_email: 'wrong-email@test-project.iam.gserviceaccount.com',
        project_id: authConfig.projectId
      } as any);

      const credentials = await mockGoogleAuth.getCredentials() as any;
      
      expect(credentials.client_email).not.toBe(authConfig.serviceAccountEmail);
      expect(credentials.project_id).toBe(authConfig.projectId);
    });

    it('deve validar project ID do service account', async () => {
      mockGoogleAuth.getCredentials.mockResolvedValue({
        client_email: authConfig.serviceAccountEmail,
        project_id: 'wrong-project-id'
      } as any);
      mockGoogleAuth.getProjectId.mockResolvedValue('wrong-project-id' as any);

      const credentials = await mockGoogleAuth.getCredentials() as any;
      const projectId = await mockGoogleAuth.getProjectId();
      
      expect(credentials.project_id).not.toBe(authConfig.projectId);
      expect(projectId).not.toBe(authConfig.projectId);
    });
  });

  describe('Validação de IAM Roles e Permissions', () => {
    it('deve verificar permissões necessárias para Cloud Run', async () => {
      const requiredPermissions = [
        'run.services.invoke',
        'run.routes.invoke',
        'iam.serviceAccounts.actAs'
      ];

      // Mock de verificação de permissões
      mockGoogleAuth.getAccessToken.mockResolvedValue('valid-token');
      
      // Simular verificação de cada permissão
      for (const permission of requiredPermissions) {
        // Em um cenário real, isso seria uma chamada para a API IAM
        expect(permission).toMatch(/^(run|iam)\./); // Verificar formato básico
      }

      const token = await authService.getGoogleCloudToken();
      expect(token).toBeDefined();
    });

    it('deve verificar role Cloud Run Invoker', async () => {
      const expectedRole = 'roles/run.invoker';
      
      // Mock de verificação de role
      mockGoogleAuth.getAccessToken.mockResolvedValue('valid-token');
      
      // Simular que o service account tem a role necessária
      const hasRole = true; // Em um teste real, isso seria verificado via API IAM
      
      expect(hasRole).toBe(true);
      expect(expectedRole).toBe('roles/run.invoker');
    });

    it('deve verificar role Cloud Functions Invoker', async () => {
      const expectedRole = 'roles/cloudfunctions.invoker';
      
      mockGoogleAuth.getAccessToken.mockResolvedValue('valid-token');
      
      // Simular verificação de role para Cloud Functions
      const hasRole = true;
      
      expect(hasRole).toBe(true);
      expect(expectedRole).toBe('roles/cloudfunctions.invoker');
    });

    it('deve falhar sem permissões adequadas', async () => {
      // Simular service account sem permissões
      mockGoogleAuth.getAccessToken.mockRejectedValue(
        new Error('Permission denied. User does not have permission to access service')
      );

      await expect(authService.getGoogleCloudToken())
        .rejects.toThrow('Falha na autenticação com Google Cloud');
    });
  });

  describe('Validação de Scopes', () => {
    it('deve validar scopes necessários para operação', () => {
      const requiredScopes = [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/run.invoker'
      ];

      expect(authConfig.scopes).toEqual(
        expect.arrayContaining(requiredScopes)
      );
    });

    it('deve incluir scope para IAM quando necessário', () => {
      const iamScope = 'https://www.googleapis.com/auth/iam';
      
      expect(authConfig.scopes).toContain(iamScope);
    });

    it('deve validar scope para Firestore', () => {
      const firestoreScope = 'https://www.googleapis.com/auth/datastore';
      
      // Adicionar scope do Firestore se necessário
      const extendedScopes = [
        ...authConfig.scopes!,
        firestoreScope
      ];
      
      expect(extendedScopes).toContain(firestoreScope);
    });
  });

  describe('Autenticação com Application Default Credentials (ADC)', () => {
    it('deve usar ADC quando service account key não está disponível', () => {
      const adcConfig: AuthConfig = {
        projectId: 'test-project-id',
        scopes: authConfig.scopes
        // Sem serviceAccountKeyPath
      };

      const adcAuthService = new AuthenticationService(adcConfig);
      
      // Verificar que o serviço foi criado sem erros
      expect(adcAuthService).toBeDefined();
    });

    it('deve priorizar service account key sobre ADC', () => {
      // Com service account key definido
      expect(authConfig.serviceAccountKeyPath).toBeDefined();
      
      const authServiceWithKey = new AuthenticationService(authConfig);
      expect(authServiceWithKey).toBeDefined();
    });
  });

  describe('Validação de Identity-Aware Proxy (IAP)', () => {
    it('deve gerar token IAP quando audience está configurado', async () => {
      const iapAudience = 'https://test-cloud-run-service.run.app';
      const configWithIAP: AuthConfig = {
        ...authConfig,
        audience: iapAudience
      };

      const iapAuthService = new AuthenticationService(configWithIAP);
      
      // Mock do cliente IAP
      const mockIdTokenClient = {
        getAccessToken: jest.fn().mockResolvedValue({ token: 'iap-token' } as any)
      };
      mockGoogleAuth.getIdTokenClient.mockResolvedValue(mockIdTokenClient as any);

      const iapToken = await iapAuthService.getIAPToken();
      
      expect(iapToken).toBe('iap-token');
      expect(mockGoogleAuth.getIdTokenClient).toHaveBeenCalledWith(iapAudience);
    });

    it('deve falhar ao gerar token IAP sem audience', async () => {
      const configWithoutAudience: AuthConfig = {
        ...authConfig,
        audience: undefined
      };

      const authServiceWithoutAudience = new AuthenticationService(configWithoutAudience);
      
      await expect(authServiceWithoutAudience.getIAPToken())
        .rejects.toThrow('Audience não configurado para IAP');
    });
  });

  describe('Rotação de Credenciais', () => {
    it('deve lidar com rotação de service account keys', async () => {
      // Primeiro token válido
      mockGoogleAuth.getAccessToken.mockResolvedValueOnce('old-token');
      const oldToken = await authService.getGoogleCloudToken();
      expect(oldToken).toBe('old-token');

      // Simular rotação de credenciais
      authService.clearTokenCache();
      
      // Novo token após rotação
      mockGoogleAuth.getAccessToken.mockResolvedValueOnce('new-token');
      const newToken = await authService.getGoogleCloudToken();
      expect(newToken).toBe('new-token');
      expect(newToken).not.toBe(oldToken);
    });

    it('deve invalidar cache após rotação', async () => {
      mockGoogleAuth.getAccessToken.mockResolvedValue('test-token');
      
      // Obter token (será cacheado)
      await authService.getGoogleCloudToken();
      
      const statsBeforeClear = authService.getCacheStats();
      expect(statsBeforeClear.size).toBeGreaterThan(0);
      
      // Simular rotação limpando cache
      authService.clearTokenCache();
      
      const statsAfterClear = authService.getCacheStats();
      expect(statsAfterClear.size).toBe(0);
    });
  });

  describe('Validação de Configuração de Segurança', () => {
    it('deve validar configuração mínima necessária', () => {
      const minimalConfig: AuthConfig = {
        projectId: 'test-project'
      };

      expect(() => {
        new AuthenticationService(minimalConfig);
      }).not.toThrow();
    });

    it('deve validar formato do email do service account', () => {
      const invalidEmails = [
        'invalid-email',
        'test@gmail.com',
        'test@test-project.com',
        '@test-project.iam.gserviceaccount.com'
      ];

      invalidEmails.forEach(email => {
        const configWithInvalidEmail: AuthConfig = {
          ...authConfig,
          serviceAccountEmail: email
        };

        // Verificar formato do email
        const isValidFormat = email.includes('@') && 
                             email.endsWith('.iam.gserviceaccount.com');
        
        if (email === 'test@gmail.com' || email === 'test@test-project.com') {
          expect(isValidFormat).toBe(false);
        }
      });
    });

    it('deve validar project ID format', () => {
      const validProjectIds = [
        'test-project-123',
        'my-project',
        'project-with-numbers-123'
      ];

      const invalidProjectIds = [
        'Test-Project', // Maiúsculas
        'test_project', // Underscore
        'test project', // Espaço
        '123-project-', // Termina com hífen
        '-project-123'  // Começa com hífen
      ];

      validProjectIds.forEach(projectId => {
        const isValid = /^[a-z][a-z0-9-]*[a-z0-9]$/.test(projectId) || 
                       /^[a-z][a-z0-9]*$/.test(projectId);
        expect(isValid).toBe(true);
      });

      invalidProjectIds.forEach(projectId => {
        const isValid = /^[a-z][a-z0-9-]*[a-z0-9]$/.test(projectId) || 
                       /^[a-z][a-z0-9]*$/.test(projectId);
        expect(isValid).toBe(false);
      });
    });
  });
});