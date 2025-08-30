# Script de Diagnóstico Firebase

## Descrição
Script para validar a conectividade e funcionalidade do ambiente Firebase após a resolução dos problemas de propriedade do projeto `licitareview-prod`.

## Arquivo
`diagnose-firebase-environment.cjs`

## Funcionalidades
- ✅ Autenticação via service account
- ✅ Teste de conectividade Firestore
- ✅ Teste de conectividade Storage (com fallback gracioso)
- ✅ Listagem de arquivos mais recentes
- ✅ Correlação de dados Storage + Firestore
- ✅ Relatório detalhado formatado
- ✅ Tratamento robusto de erros

## Pré-requisitos
- Node.js >= 18.0.0
- Dependência `firebase-admin` (já instalada)
- Arquivo de credenciais: `credentials/licitareview-prod-b6b067fdd7e4.json`

## Como Executar

```bash
# Executar o script
node diagnose-firebase-environment.cjs

# Ou com permissões de execução
./diagnose-firebase-environment.cjs
```

## Output de Exemplo

```
🔧 Firebase Admin inicializado com sucesso

=== DIAGNÓSTICO DO AMBIENTE FIREBASE ===

🔐 Testando autenticação...
   ✅ Autenticado no projeto: licitareview-prod
   ✅ Permissões Firestore: OK
   ⚠️  Storage: Bucket não existe ou sem permissão

📁 Testando conectividade Storage...
   📋 Listando arquivos do Storage...
   ⚠️  Storage não configurado, retornando lista vazia

🗄️  Testando conectividade Firestore...
   📄 Documentos na coleção 'documentos': 0
   ✍️  Teste de escrita: OK (doc: abc123)
   🗑️  Documento de teste removido

🔗 Correlacionando dados Storage + Firestore...
   ⚠️  Nenhum arquivo para correlacionar

✅ DIAGNÓSTICO CONCLUÍDO COM SUCESSO

🔌 Conexões finalizadas

🎉 Script finalizado
```

## Status Atual

### ✅ Funcionando
- Autenticação Firebase Admin
- Conectividade Firestore
- Operações de leitura/escrita Firestore
- Tratamento de erros

### ⚠️ Observações
- **Storage**: Bucket não configurado ou não existe
  - Isso é normal para projetos que ainda não configuraram Storage
  - O script continua funcionando normalmente
  - Quando Storage for configurado, o script detectará automaticamente

### 🔧 Configuração Storage (Opcional)
Para habilitar testes de Storage:
1. Acesse [Firebase Console](https://console.firebase.google.com/project/licitareview-prod/storage)
2. Ative o Firebase Storage
3. Configure regras de segurança
4. Execute o script novamente

## Próximos Passos

Com o ambiente validado:
1. ✅ **Ambiente Firebase**: Conectado e funcional
2. 🚀 **Desenvolvimento**: Pode prosseguir com segurança
3. 🔄 **AnalysisOrchestrator**: Implementar próxima funcionalidade
4. 🔗 **Comunicação bidirecional**: Cloud Functions ↔ Cloud Run

## Troubleshooting

### Erro: "require is not defined"
- **Solução**: Usar arquivo `.cjs` (já implementado)

### Erro: "Bucket does not exist"
- **Solução**: Tratamento implementado, script continua funcionando

### Erro: "Permission denied"
- **Verificar**: Credenciais em `credentials/licitareview-prod-b6b067fdd7e4.json`
- **Verificar**: Permissões IAM da service account

---
*Diagnóstico criado em: Janeiro 2025*
*Status: ✅ Funcional e validado*