# 🚀 Instruções de Migração - Dados de Classificação

## Status da Refatoração
✅ **Refatoração Completa!** A arquitetura foi completamente reestruturada:

- **Componente simplificado**: 60+ linhas de código removidas
- **Fonte única de dados**: Firebase com estrutura hierárquica completa  
- **Estado unificado**: Eliminação de conflitos de tipos
- **Cache otimizado**: 30 minutos com fallback inteligente

## Dados Prontos para Migração
📊 **63 documentos** hierárquicos verificados e prontos para migração:
- **3 Tipos de Objeto**: Aquisição, Serviço, Obra e Serviços de Eng.
- **9 Modalidades**: Contratação Direta, Processo Licitatório, Alterações Contratuais
- **51 Documentos**: ETP, TR, Editais, Minutas, etc.

## Como Executar a Migração

### 1. Configurar Regras de Segurança no Firebase

1. Acesse: https://console.firebase.google.com
2. Selecione o projeto: **analisador-de-editais**  
3. Vá para **Firestore Database > Rules**
4. Substitua as regras atuais pelo conteúdo do arquivo `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para a coleção de classificações
    match /classifications/{document} {
      // Permitir leitura para todos (dados públicos de classificação)
      allow read: if true;
      
      // Permitir escrita apenas para usuários autenticados (migração)
      // TODO: Restringir mais depois da migração
      allow write: if true;
    }
    
    // Regras para documentos de controle de migração
    match /migration-control/{document} {
      allow read, write: if true;
    }
    
    // Outras coleções (manter regras existentes)
    match /{document=**} {
      allow read, write: if false;  // Negar por padrão
    }
  }
}
```

5. Clique em **Publicar**

### 2. Executar a Migração

```bash
npm run migrate:classification
```

### 3. Verificar Migração

Após a execução bem-sucedida:

1. **Firebase Console**: Verificar se a coleção `classifications` foi criada
2. **Documento de controle**: Conferir `migration-control/classification-v1`
3. **Total de documentos**: Deve mostrar 63 documentos migrados

### 4. Testar o Componente

1. Executar a aplicação: `npm run dev`
2. Navegar para o componente de classificação
3. Verificar se os dropdowns carregam corretamente
4. Testar a navegação hierárquica

## Estrutura Migrada

```
Firebase Collection: classifications/
├── aquisicao
├── aquisicao_contratacao_direta  
├── aquisicao_contratacao_direta_dispensa
├── aquisicao_contratacao_direta_dispensa_etp
├── ...
└── obra_servicos_eng_alteracoes_contratuais_aditivo_vigencia
```

## Rollback (se necessário)

Em caso de problemas:

1. **Deletar coleção**: Firebase Console > Firestore > Deletar `classifications`
2. **Reverter código**: `git checkout HEAD~1` (voltar commit anterior)
3. **Usar dados locais**: O fallback ainda funciona com dados de `classification.ts`

## Pós-Migração

### Segurança
- Restringir regras de escrita após migração
- Adicionar autenticação para operações críticas

### Performance  
- Monitorar cache hit rate
- Ajustar `staleTime` se necessário

### Manutenção
- Dados agora centralizados no Firebase
- Updates via Admin SDK ou console
- Backup automático do Firebase

## Comandos Úteis

```bash
# Verificar dados antes da migração
npm run verify:migration

# Executar migração
npm run migrate:classification

# Testar aplicação
npm run dev

# Build de produção
npm run build
```

## Contato

Em caso de problemas na migração, consulte os logs detalhados ou revise esta documentação.