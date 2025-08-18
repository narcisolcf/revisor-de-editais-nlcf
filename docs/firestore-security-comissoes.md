# Regras de Segurança do Firestore para Comissões

Este documento descreve as regras de segurança implementadas para a coleção de comissões no Firestore, garantindo controle de acesso adequado e proteção dos dados.

## Visão Geral

As regras implementadas seguem o princípio de **menor privilégio**, onde:
- **Leitura**: Apenas usuários autenticados com permissões adequadas
- **Escrita**: Apenas administradores e membros autorizados da comissão
- **Exclusão**: Restrita a administradores do sistema

## Estrutura de Permissões

### Níveis de Acesso

1. **Usuários Autenticados**: Podem ler comissões públicas
2. **Membros da Comissão**: Podem ler dados da comissão da qual fazem parte
3. **Presidente da Comissão**: Pode editar dados da comissão
4. **Administradores**: Controle total sobre todas as comissões
5. **Administradores do Sistema**: Podem excluir dados (para auditoria)

### Funções Auxiliares

```javascript
// Verifica se o usuário está autenticado
function isAuthenticated()

// Verifica se o usuário é administrador
function isAdmin()

// Verifica se o usuário é administrador do sistema
function isSystemAdmin()

// Verifica se o usuário pode ler uma comissão
function canReadComissao(comissaoData)

// Verifica se o usuário pode escrever em uma comissão
function canWriteComissao(comissaoData)
```

## Regras por Coleção

### Coleção Principal: `/comissoes/{comissaoId}`

#### Leitura (`allow read`)
- ✅ Usuários autenticados que são administradores
- ✅ Usuários que são membros da comissão
- ✅ Usuários autenticados para comissões públicas
- ❌ Usuários não autenticados
- ❌ Usuários sem permissão para comissões privadas

#### Criação (`allow create`)
- ✅ Apenas administradores
- ❌ Todos os outros usuários

**Validações obrigatórias:**
- Dados devem conter campos obrigatórios: `nome`, `tipo`, `status`, `dataInicio`, `membros`, `configuracoes`
- Campo `criadoPor` deve ser o ID do usuário atual
- Campo `criadoEm` deve ser o timestamp da requisição

#### Atualização (`allow update`)
- ✅ Administradores
- ✅ Presidente da comissão
- ❌ Outros membros da comissão
- ❌ Usuários externos

**Proteções:**
- Campos de auditoria (`criadoPor`, `criadoEm`) são protegidos contra alteração
- Campos `atualizadoPor` e `atualizadoEm` são obrigatórios

#### Exclusão (`allow delete`)
- ✅ Apenas administradores do sistema
- ❌ Todos os outros usuários

### Sub-coleção: `/comissoes/{comissaoId}/membros/{membroId}`

#### Leitura
- ✅ Usuários que podem ler a comissão pai

#### Escrita
- ✅ Administradores
- ✅ Presidente da comissão
- ❌ Outros usuários

**Validações:**
- Dados devem conter: `usuarioId`, `papel`, `dataInicio`
- Campo `papel` deve ser um dos valores válidos: `PRESIDENTE`, `VICE_PRESIDENTE`, `SECRETARIO`, `MEMBRO`, `SUPLENTE`

### Sub-coleção: `/comissoes/{comissaoId}/reunioes/{reuniaoId}`

#### Leitura
- ✅ Usuários que podem ler a comissão pai

#### Escrita
- ✅ Administradores
- ✅ Membros da comissão
- ❌ Usuários externos

#### Exclusão
- ✅ Apenas administradores

### Sub-coleção: `/comissoes/{comissaoId}/decisoes/{decisaoId}`

#### Leitura
- ✅ Usuários que podem ler a comissão pai

#### Escrita
- ✅ Administradores
- ✅ Membros da comissão
- ❌ Usuários externos

#### Exclusão
- ✅ Apenas administradores do sistema (para preservar auditoria)

## Configuração do Firebase Auth

### Custom Claims Necessários

Para que as regras funcionem corretamente, configure os seguintes custom claims no Firebase Auth:

```javascript
// Para administradores
const customClaims = {
  admin: true
};

// Aplicar o claim
await admin.auth().setCustomUserClaims(uid, customClaims);
```

### Exemplo de Configuração no Backend (Node.js)

```javascript
const admin = require('firebase-admin');

// Função para tornar um usuário administrador
async function makeUserAdmin(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`Usuário ${uid} agora é administrador`);
  } catch (error) {
    console.error('Erro ao definir claims:', error);
  }
}

// Função para remover privilégios de administrador
async function removeAdminPrivileges(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: false });
    console.log(`Privilégios de administrador removidos do usuário ${uid}`);
  } catch (error) {
    console.error('Erro ao remover claims:', error);
  }
}
```

## Estrutura de Dados Esperada

### Documento de Comissão

```typescript
interface Comissao {
  id: string;
  nome: string;
  tipo: 'PERMANENTE' | 'TEMPORARIA' | 'ESPECIAL';
  status: 'ATIVA' | 'INATIVA' | 'SUSPENSA' | 'ENCERRADA';
  dataInicio: Timestamp;
  dataFim?: Timestamp;
  membros: { [userId: string]: MembroComissao };
  configuracoes: {
    publica: boolean;
    permiteConvidados: boolean;
    // outras configurações...
  };
  criadoPor: string;
  criadoEm: Timestamp;
  atualizadoPor?: string;
  atualizadoEm?: Timestamp;
}
```

### Documento de Membro

```typescript
interface MembroComissao {
  usuarioId: string;
  papel: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'SECRETARIO' | 'MEMBRO' | 'SUPLENTE';
  dataInicio: Timestamp;
  dataFim?: Timestamp;
  ativo: boolean;
  comissaoId: string;
  adicionadoPor: string;
  adicionadoEm: Timestamp;
  atualizadoPor?: string;
  atualizadoEm?: Timestamp;
}
```

## Testando as Regras

### Usando o Emulador do Firebase

1. **Instalar o Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Iniciar o emulador:**
```bash
firebase emulators:start --only firestore
```

3. **Executar testes:**
```bash
firebase emulators:exec --only firestore "npm test"
```

### Exemplo de Teste com Jest

```javascript
const { initializeTestApp, clearFirestoreData } = require('@firebase/rules-unit-testing');

describe('Regras de Comissões', () => {
  let app;
  
  beforeEach(async () => {
    app = initializeTestApp({
      projectId: 'test-project',
      auth: { uid: 'user1', admin: true }
    });
  });
  
  afterEach(async () => {
    await clearFirestoreData({ projectId: 'test-project' });
  });
  
  test('Administrador pode criar comissão', async () => {
    const db = app.firestore();
    const comissaoRef = db.collection('comissoes').doc('test-comissao');
    
    await expect(
      comissaoRef.set({
        nome: 'Comissão de Teste',
        tipo: 'TEMPORARIA',
        status: 'ATIVA',
        dataInicio: new Date(),
        membros: {},
        configuracoes: { publica: false },
        criadoPor: 'user1',
        criadoEm: new Date()
      })
    ).resolves.not.toThrow();
  });
  
  test('Usuário comum não pode criar comissão', async () => {
    const appUser = initializeTestApp({
      projectId: 'test-project',
      auth: { uid: 'user2', admin: false }
    });
    
    const db = appUser.firestore();
    const comissaoRef = db.collection('comissoes').doc('test-comissao');
    
    await expect(
      comissaoRef.set({
        nome: 'Comissão de Teste',
        tipo: 'TEMPORARIA',
        status: 'ATIVA',
        dataInicio: new Date(),
        membros: {},
        configuracoes: { publica: false },
        criadoPor: 'user2',
        criadoEm: new Date()
      })
    ).rejects.toThrow();
  });
});
```

## Implementação

### 1. Arquivo Principal (Produção)
Use o arquivo `/firestore.rules` para regras básicas em produção.

### 2. Arquivo Avançado (Desenvolvimento)
Use o arquivo `/services/api/firestore-comissoes.rules` para regras mais robustas durante o desenvolvimento.

### 3. Deploy das Regras

```bash
# Deploy das regras para o Firebase
firebase deploy --only firestore:rules
```

## Monitoramento e Auditoria

### Logs de Segurança

As regras incluem coleções especiais para auditoria:

- `/comissoes-stats/{statId}`: Estatísticas (somente leitura)
- `/comissoes-audit/{logId}`: Logs de auditoria (somente administradores do sistema)

### Alertas Recomendados

1. **Tentativas de acesso negado**: Monitore logs do Firestore
2. **Criação de comissões**: Alerte sobre novas comissões criadas
3. **Mudanças de membros**: Monitore adições/remoções de membros
4. **Exclusões**: Alerte sobre qualquer exclusão de dados

## Considerações de Segurança

1. **Princípio do Menor Privilégio**: Usuários têm apenas as permissões mínimas necessárias
2. **Validação de Dados**: Todas as escritas são validadas quanto à estrutura
3. **Proteção de Auditoria**: Campos de auditoria são protegidos contra alteração
4. **Segregação de Dados**: Comissões privadas são isoladas de usuários não autorizados
5. **Logs Imutáveis**: Decisões e logs de auditoria não podem ser excluídos por usuários comuns

## Troubleshooting

### Erro: "Permission denied"
- Verifique se o usuário está autenticado
- Confirme se os custom claims estão configurados corretamente
- Verifique se a estrutura de dados está correta

### Erro: "Invalid data"
- Confirme se todos os campos obrigatórios estão presentes
- Verifique se os tipos de dados estão corretos
- Confirme se os valores enum estão dentro dos valores permitidos

### Performance
- Use índices compostos para consultas complexas
- Limite o tamanho das consultas
- Use paginação para listas grandes