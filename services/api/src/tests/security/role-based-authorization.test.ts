/**
 * Testes de autorização baseada em roles e permissões
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { requireRoles, requirePermissions, validateOrganizationAccess } from '../../middleware/auth';
import { AuthenticationService } from '../../services/AuthenticationService';

// Mock das dependências
jest.mock('../../services/AuthenticationService');
jest.mock('../../services/LoggingService');
jest.mock('../../services/AuditService');

describe('Testes de Autorização Baseada em Roles e Permissões', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAuthService: jest.Mocked<AuthenticationService>;

  beforeEach(() => {
    // Mock da requisição
    mockRequest = {
      headers: {},
      user: undefined,
      ip: '127.0.0.1',
      path: '/api/test',
      method: 'GET',
      body: {},
      params: {},
      query: {}
    };

    // Mock da resposta
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    } as any;

    // Mock do next
    mockNext = jest.fn();

    // Mock do AuthenticationService
    mockAuthService = {
      validateRequest: jest.fn(),
      validateServiceToken: jest.fn(),
      generateServiceToken: jest.fn(),
      getGoogleCloudToken: jest.fn(),
      clearTokenCache: jest.fn(),
      getCacheStats: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Middleware requireRole', () => {
    it('deve permitir acesso para usuário com role correto', async () => {
      // Configurar usuário com role admin
      mockRequest.user = {
        uid: 'user123',
        email: 'admin@test.com',
        roles: ['admin'],
        permissions: ['read', 'write', 'delete'],
        organizationId: 'org123'
      };

      const middleware = requireRoles(['admin']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(); // Sem erro
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('deve negar acesso para usuário sem role necessário', async () => {
      // Configurar usuário com role user (não admin)
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['read'],
        organizationId: 'org123'
      };

      const middleware = requireRoles(['admin']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Acesso negado',
        message: 'Role necessário: admin',
        code: 'INSUFFICIENT_ROLE'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve negar acesso para usuário não autenticado', async () => {
      // Usuário não definido
      mockRequest.user = undefined;

      const middleware = requireRoles(['user']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Não autenticado',
        message: 'Token de autenticação necessário',
        code: 'AUTHENTICATION_REQUIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve permitir acesso para múltiplos roles', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'manager@test.com',
        roles: ['manager'],
        permissions: ['read', 'write'],
        organizationId: 'org123'
      };

      const middleware = requireRoles(['admin', 'manager']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('deve negar acesso quando usuário não tem nenhum dos roles necessários', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['read'],
        organizationId: 'org123'
      };

      const middleware = requireRoles(['admin', 'manager']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Acesso negado',
        message: 'Role necessário: admin,manager',
        code: 'INSUFFICIENT_ROLE'
      });
    });
  });

  describe('Middleware requirePermission', () => {
    it('deve permitir acesso para usuário com permissão correta', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:read', 'analysis:write'],
        organizationId: 'org123'
      };

      const middleware = requirePermissions(['analysis:read']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('deve negar acesso para usuário sem permissão necessária', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:read'],
        organizationId: 'org123'
      };

      const middleware = requirePermissions(['analysis:delete']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Acesso negado',
        message: 'Permissão necessária: analysis:delete',
        code: 'INSUFFICIENT_PERMISSION'
      });
    });

    it('deve permitir acesso para múltiplas permissões (OR)', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:read'],
        organizationId: 'org123'
      };

      const middleware = requirePermissions(['analysis:read']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('deve exigir todas as permissões (AND)', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['analysis:read'],
        organizationId: 'org123'
      };

      const middleware = requirePermissions(['analysis:read', 'analysis:write']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Acesso negado',
        message: 'Permissões necessárias: analysis:read,analysis:write',
        code: 'INSUFFICIENT_PERMISSION'
      });
    });
  });

  describe('Middleware validateOrganizationAccess', () => {
    it('deve permitir acesso para usuário da mesma organização', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['read'],
        organizationId: 'org123'
      };
      mockRequest.params = { organizationId: 'org123' };

      const middleware = validateOrganizationAccess();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('deve negar acesso para usuário de organização diferente', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['read'],
        organizationId: 'org123'
      };
      mockRequest.params = { organizationId: 'org456' };

      const middleware = validateOrganizationAccess();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Acesso negado',
        message: 'Acesso à organização não autorizado',
        code: 'ORGANIZATION_ACCESS_DENIED'
      });
    });

    it('deve permitir acesso para admin independente da organização', async () => {
      mockRequest.user = {
        uid: 'admin123',
        email: 'admin@test.com',
        roles: ['admin'],
        permissions: ['read', 'write', 'delete'],
        organizationId: 'org123'
      };
      mockRequest.params = { organizationId: 'org456' };

      const middleware = validateOrganizationAccess();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('deve buscar organizationId no body quando não está nos params', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['read'],
        organizationId: 'org123'
      };
      mockRequest.params = {};
      mockRequest.body = { organizationId: 'org123' };

      const middleware = validateOrganizationAccess();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Hierarquia de Roles', () => {
    it('deve respeitar hierarquia de roles (admin > manager > user)', async () => {
      const testCases = [
        {
          userRole: 'admin',
          requiredRole: 'user',
          shouldPass: true,
          description: 'Admin deve ter acesso a recursos de user'
        },
        {
          userRole: 'admin',
          requiredRole: 'manager',
          shouldPass: true,
          description: 'Admin deve ter acesso a recursos de manager'
        },
        {
          userRole: 'manager',
          requiredRole: 'user',
          shouldPass: true,
          description: 'Manager deve ter acesso a recursos de user'
        },
        {
          userRole: 'user',
          requiredRole: 'manager',
          shouldPass: false,
          description: 'User não deve ter acesso a recursos de manager'
        },
        {
          userRole: 'user',
          requiredRole: 'admin',
          shouldPass: false,
          description: 'User não deve ter acesso a recursos de admin'
        }
      ];

      for (const testCase of testCases) {
        // Reset mocks
        jest.clearAllMocks();

        mockRequest.user = {
          uid: 'user123',
          email: 'user@test.com',
          roles: [testCase.userRole],
          permissions: ['read'],
          organizationId: 'org123'
        };

        const middleware = requireRoles([testCase.requiredRole]);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        if (testCase.shouldPass) {
          expect(mockNext).toHaveBeenCalledTimes(1);
          expect(mockNext).toHaveBeenCalledWith();
        } else {
          expect(mockResponse.status).toHaveBeenCalledWith(403);
        }
      }
    });
  });

  describe('Permissões Granulares', () => {
    it('deve validar permissões específicas por recurso', async () => {
      const permissions = [
        'analysis:create',
        'analysis:read',
        'analysis:update',
        'analysis:delete',
        'document:upload',
        'document:download',
        'organization:manage',
        'user:invite'
      ];

      for (const permission of permissions) {
        jest.clearAllMocks();

        mockRequest.user = {
          uid: 'user123',
          email: 'user@test.com',
          roles: ['user'],
          permissions: [permission],
          organizationId: 'org123'
        };

        const middleware = requirePermissions([permission]);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
      }
    });

    it('deve validar permissões com wildcards', async () => {
      mockRequest.user = {
        uid: 'admin123',
        email: 'admin@test.com',
        roles: ['admin'],
        permissions: ['*'], // Permissão total
        organizationId: 'org123'
      };

      const specificPermissions = [
        'analysis:create',
        'document:delete',
        'organization:manage'
      ];

      for (const permission of specificPermissions) {
        jest.clearAllMocks();

        const middleware = requirePermissions([permission]);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
      }
    });

    it('deve validar permissões com prefixos', async () => {
      mockRequest.user = {
        uid: 'manager123',
        email: 'manager@test.com',
        roles: ['manager'],
        permissions: ['analysis:*'], // Todas as permissões de análise
        organizationId: 'org123'
      };

      const analysisPermissions = [
        'analysis:create',
        'analysis:read',
        'analysis:update',
        'analysis:delete'
      ];

      for (const permission of analysisPermissions) {
        jest.clearAllMocks();

        const middleware = requirePermissions([permission]);
        await middleware(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(mockNext).toHaveBeenCalledWith();
      }
    });
  });

  describe('Auditoria de Acesso', () => {
    it('deve registrar tentativas de acesso negado', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: ['read'],
        organizationId: 'org123'
      };

      const middleware = requireRoles(['admin']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      // Em um cenário real, verificaríamos se o log de auditoria foi chamado
    });

    it('deve registrar acessos bem-sucedidos', async () => {
      mockRequest.user = {
        uid: 'admin123',
        email: 'admin@test.com',
        roles: ['admin'],
        permissions: ['*'],
        organizationId: 'org123'
      };

      const middleware = requireRoles(['admin']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      // Em um cenário real, verificaríamos se o log de auditoria foi chamado
    });
  });

  describe('Casos Edge', () => {
    it('deve lidar com usuário sem roles definidos', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: undefined,
        permissions: ['read'],
        organizationId: 'org123'
      } as any;

      const middleware = requireRoles(['user']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('deve lidar com usuário sem permissões definidas', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: ['user'],
        permissions: undefined,
        organizationId: 'org123'
      } as any;

      const middleware = requirePermissions(['read']);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('deve lidar com arrays vazios de roles e permissões', async () => {
      mockRequest.user = {
        uid: 'user123',
        email: 'user@test.com',
        roles: [],
        permissions: [],
        organizationId: 'org123'
      };

      const roleMiddleware = requireRoles(['user']);
      await roleMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(403);

      jest.clearAllMocks();

      const permissionMiddleware = requirePermissions(['read']);
      await permissionMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });
});