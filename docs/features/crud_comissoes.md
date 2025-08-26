# Feature: CRUD de Comissões
**Documento de Planejamento Backend**

---

## 📋 Visão Geral

### Objetivo
Implementar um sistema completo de CRUD (Create, Read, Update, Delete) para a entidade **Comissão**, permitindo o gerenciamento de comissões organizacionais com seus respectivos membros.

### Contexto
As comissões são grupos de trabalho formados por servidores para executar tarefas específicas dentro de uma organização. Cada comissão possui características próprias como tipo (Permanente/Temporária), data de criação e uma lista de membros que são referências a servidores existentes.

### Benefícios Esperados
- **Organização:** Melhor gestão de grupos de trabalho
- **Rastreabilidade:** Histórico de participação de servidores
- **Eficiência:** Automatização do processo de formação de comissões
- **Compliance:** Atendimento a requisitos de governança

---

## 🏗️ Estrutura de Dados

### Entidade Comissão

```typescript
interface Comissao {
  // Identificação
  readonly id: string;
  
  // Dados Básicos
  nomeDaComissao: string;
  tipo: 'Permanente' | 'Temporaria';
  dataDeCriacao: Date;
  dataDeEncerramento?: Date; // Opcional, para comissões temporárias
  
  // Descrição e Objetivo
  descricao?: string;
  objetivo?: string;
  
  // Membros (Referências a Servidores)
  membros: MembroComissao[];
  
  // Status
  status: 'Ativa' | 'Inativa' | 'Suspensa' | 'Encerrada';
  
  // Organização
  organizationId: string;
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy?: string;
  
  // Configurações
  configuracoes?: {
    requererQuorum: boolean;
    quorumMinimo?: number;
    permitirSubstituicoes: boolean;
    notificarMembros: boolean;
  };
}

interface MembroComissao {
  // Referência ao Servidor
  servidorId: string; // FK para entidade Servidor
  
  // Papel na Comissão
  papel: 'Presidente' | 'Vice-Presidente' | 'Secretario' | 'Membro' | 'Suplente';
  
  // Período de Participação
  dataDeIngresso: Date;
  dataDeSaida?: Date;
  
  // Status
  ativo: boolean;
  
  // Observações
  observacoes?: string;
}

// Tipos auxiliares
type TipoComissao = 'Permanente' | 'Temporaria';
type StatusComissao = 'Ativa' | 'Inativa' | 'Suspensa' | 'Encerrada';
type PapelMembro = 'Presidente' | 'Vice-Presidente' | 'Secretario' | 'Membro' | 'Suplente';
```

---

## 🚀 API Endpoints

### Base URL
```
/api/v1/organizations/{organizationId}/comissoes
```

### 1. Listar Comissões
```http
GET /api/v1/organizations/{organizationId}/comissoes
```

**Query Parameters:**
- `page?: number` - Página (default: 1)
- `limit?: number` - Itens por página (default: 20)
- `tipo?: TipoComissao` - Filtrar por tipo
- `status?: StatusComissao` - Filtrar por status
- `search?: string` - Busca por nome
- `sortBy?: string` - Campo para ordenação (default: 'dataDeCriacao')
- `sortOrder?: 'asc' | 'desc'` - Ordem (default: 'desc')

**Response:**
```typescript
interface ListComissoesResponse {
  success: boolean;
  data: Comissao[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### 2. Obter Comissão por ID
```http
GET /api/v1/organizations/{organizationId}/comissoes/{comissaoId}
```

**Response:**
```typescript
interface GetComissaoResponse {
  success: boolean;
  data: Comissao & {
    membrosDetalhados: (MembroComissao & {
      servidor: {
        id: string;
        nome: string;
        email: string;
        cargo: string;
      };
    })[];
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### 3. Criar Nova Comissão
```http
POST /api/v1/organizations/{organizationId}/comissoes
```

**Request Body:**
```typescript
interface CreateComissaoRequest {
  nomeDaComissao: string;
  tipo: TipoComissao;
  dataDeCriacao: string; // ISO date
  dataDeEncerramento?: string; // ISO date, obrigatório se tipo = 'Temporaria'
  descricao?: string;
  objetivo?: string;
  membros: Omit<MembroComissao, 'dataDeIngresso' | 'ativo'>[];
  configuracoes?: {
    requererQuorum?: boolean;
    quorumMinimo?: number;
    permitirSubstituicoes?: boolean;
    notificarMembros?: boolean;
  };
}
```

**Response:**
```typescript
interface CreateComissaoResponse {
  success: boolean;
  data: Comissao;
  message: string;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### 4. Atualizar Comissão
```http
PUT /api/v1/organizations/{organizationId}/comissoes/{comissaoId}
```

**Request Body:**
```typescript
interface UpdateComissaoRequest {
  nomeDaComissao?: string;
  tipo?: TipoComissao;
  dataDeEncerramento?: string;
  descricao?: string;
  objetivo?: string;
  status?: StatusComissao;
  configuracoes?: {
    requererQuorum?: boolean;
    quorumMinimo?: number;
    permitirSubstituicoes?: boolean;
    notificarMembros?: boolean;
  };
}
```

### 5. Deletar Comissão
```http
DELETE /api/v1/organizations/{organizationId}/comissoes/{comissaoId}
```

**Response:**
```typescript
interface DeleteComissaoResponse {
  success: boolean;
  message: string;
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

---

## 🔧 Endpoints Auxiliares

### Gerenciamento de Membros

#### Adicionar Membro
```http
POST /api/v1/organizations/{organizationId}/comissoes/{comissaoId}/membros
```

#### Remover Membro
```http
DELETE /api/v1/organizations/{organizationId}/comissoes/{comissaoId}/membros/{servidorId}
```

#### Atualizar Papel do Membro
```http
PUT /api/v1/organizations/{organizationId}/comissoes/{comissaoId}/membros/{servidorId}
```

### Relatórios e Analytics

#### Estatísticas da Comissão
```http
GET /api/v1/organizations/{organizationId}/comissoes/{comissaoId}/stats
```

#### Histórico de Alterações
```http
GET /api/v1/organizations/{organizationId}/comissoes/{comissaoId}/history
```

---

## 🗄️ Estrutura do Banco de Dados

### Firestore Collections

```
organizations/{organizationId}/
├── comissoes/{comissaoId}
│   ├── id: string
│   ├── nomeDaComissao: string
│   ├── tipo: string
│   ├── dataDeCriacao: timestamp
│   ├── dataDeEncerramento?: timestamp
│   ├── descricao?: string
│   ├── objetivo?: string
│   ├── status: string
│   ├── organizationId: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── createdBy: string
│   ├── lastModifiedBy?: string
│   ├── configuracoes?: object
│   └── membros: array[
│       {
│         servidorId: string,
│         papel: string,
│         dataDeIngresso: timestamp,
│         dataDeSaida?: timestamp,
│         ativo: boolean,
│         observacoes?: string
│       }
│     ]
└── servidores/{servidorId} // Referência existente
```

### Índices Necessários

```javascript
// Índices compostos para otimização de queries
[
  { fields: ['organizationId', 'status'] },
  { fields: ['organizationId', 'tipo'] },
  { fields: ['organizationId', 'dataDeCriacao'] },
  { fields: ['organizationId', 'nomeDaComissao'] },
  { fields: ['membros.servidorId', 'membros.ativo'] }
]
```

---

## 🔒 Validações e Regras de Negócio

### Validações de Entrada

1. **Nome da Comissão:**
   - Obrigatório
   - Mínimo 3 caracteres
   - Máximo 100 caracteres
   - Único por organização

2. **Tipo:**
   - Obrigatório
   - Valores: 'Permanente' | 'Temporaria'

3. **Data de Criação:**
   - Obrigatória
   - Não pode ser futura

4. **Data de Encerramento:**
   - Obrigatória se tipo = 'Temporaria'
   - Deve ser posterior à data de criação

5. **Membros:**
   - Mínimo 1 membro
   - Máximo 1 presidente por comissão
   - ServidorId deve existir na organização
   - Não permitir membros duplicados

### Regras de Negócio

1. **Hierarquia de Papéis:**
   - Presidente > Vice-Presidente > Secretário > Membro > Suplente

2. **Restrições de Status:**
   - Comissões 'Encerradas' não podem ser editadas
   - Apenas comissões 'Ativas' podem ter novos membros

3. **Auditoria:**
   - Todas as alterações devem ser logadas
   - Manter histórico de mudanças de membros

---

## 🧪 Casos de Teste

### Testes Unitários

1. **Validação de Dados:**
   - Teste criação com dados válidos
   - Teste validação de campos obrigatórios
   - Teste validação de datas
   - Teste validação de membros

2. **Regras de Negócio:**
   - Teste unicidade de nome por organização
   - Teste restrições de papel
   - Teste mudanças de status

3. **Operações CRUD:**
   - Teste criação, leitura, atualização e exclusão
   - Teste paginação e filtros
   - Teste gerenciamento de membros

### Testes de Integração

1. **API Endpoints:**
   - Teste todos os endpoints com dados válidos
   - Teste tratamento de erros
   - Teste autenticação e autorização

2. **Banco de Dados:**
   - Teste persistência de dados
   - Teste integridade referencial
   - Teste performance de queries

---

## 📊 Monitoramento e Métricas

### Métricas de Negócio
- Número total de comissões por organização
- Distribuição por tipo (Permanente vs Temporária)
- Taxa de comissões ativas vs inativas
- Média de membros por comissão
- Tempo médio de vida das comissões temporárias

### Métricas Técnicas
- Tempo de resposta dos endpoints
- Taxa de erro por endpoint
- Volume de requisições
- Uso de recursos do banco de dados

---

## 🚀 Próximos Passos

1. **Implementação Backend:**
   - Criar schemas de validação
   - Implementar handlers dos endpoints
   - Configurar rotas
   - Implementar testes

2. **Integração:**
   - Conectar com sistema de servidores existente
   - Implementar notificações
   - Configurar auditoria

3. **Documentação:**
   - Atualizar documentação da API
   - Criar guias de uso
   - Documentar casos de uso

---

*Documento criado em: $(date)*
*Versão: 1.0*
*Próxima revisão: $(date +30 days)*