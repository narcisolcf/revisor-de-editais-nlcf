# ✅ Checklist Pré-Deploy - LicitaReview

## 📋 Antes de Fazer Deploy

### 🧪 Testes e Qualidade

- [ ] **Todos os testes unitários passando**
  ```bash
  cd services/analyzer
  pytest tests/ -v
  # Resultado esperado: 14/14 passed
  ```

- [ ] **Coverage adequada** (mínimo 60% nos módulos críticos)
  ```bash
  pytest tests/ --cov=src --cov-report=term
  ```

- [ ] **Testes E2E passando** (se aplicável)
  ```bash
  npx playwright test
  ```

- [ ] **Lint sem erros**
  ```bash
  npm run lint
  ```

- [ ] **Type checking passando**
  ```bash
  npm run type-check
  ```

### 🔐 Segurança

- [ ] **Secrets configurados** no Google Secret Manager
  - openai-api-key (se aplicável)
  - firebase-admin-key
  - database credentials

- [ ] **Variáveis de ambiente** revisadas
  - Sem API keys hardcoded
  - Sem senhas em código
  - `.env` files não commitados

- [ ] **Dependências auditadas**
  ```bash
  npm audit
  pip check
  ```

- [ ] **Vulnerabilidades corrigidas**
  ```bash
  npm audit fix
  pip-audit
  ```

### 📝 Documentação

- [ ] **CHANGELOG atualizado** com as mudanças
- [ ] **README reflete** as mudanças (se necessário)
- [ ] **Versão atualizada** em:
  - package.json
  - cloudbuild.yaml
  - deploy.sh

### 🔧 Infraestrutura

- [ ] **Service account existe** e tem permissões corretas
  ```bash
  gcloud iam service-accounts describe analyzer-rag@PROJECT_ID.iam.gserviceaccount.com
  ```

- [ ] **GCS bucket criado** (para RAG corpus)
  ```bash
  gsutil ls gs://PROJECT_ID-rag-corpus
  ```

- [ ] **APIs habilitadas**
  - aiplatform.googleapis.com
  - storage.googleapis.com
  - run.googleapis.com
  - cloudbuild.googleapis.com
  - firestore.googleapis.com

- [ ] **Quotas verificadas** (especialmente Vertex AI)
  ```bash
  gcloud compute project-info describe --project=PROJECT_ID
  ```

### 🎯 Build e Deploy

- [ ] **Build local sucede**
  ```bash
  cd services/analyzer
  docker build -t analyzer-test .
  docker run -p 8080:8080 analyzer-test
  # Testar: curl http://localhost:8080/health
  ```

- [ ] **Variáveis de ambiente** do Cloud Run revisadas
  - GCP_PROJECT_ID
  - GCP_LOCATION
  - GCS_RAG_BUCKET
  - RAG_DEFAULT_MODEL
  - PYTHONPATH

- [ ] **Recursos dimensionados** adequadamente
  - Memory: 4Gi (mínimo)
  - CPU: 2 (mínimo)
  - Max instances: 20
  - Min instances: 1 (prod) ou 0 (staging)

### 🌍 Ambiente

- [ ] **Ambiente correto** selecionado
  ```bash
  gcloud config get-value project
  # Deve ser: licitareview-prod ou licitareview-staging
  ```

- [ ] **Branch correto** no git
  - Production: `main`
  - Staging: `staging`
  - Development: `develop`

- [ ] **Tag de versão** criada (para production)
  ```bash
  git tag -a v2.0.0 -m "Release v2.0.0"
  git push origin v2.0.0
  ```

### 📊 Monitoramento

- [ ] **Alertas configurados** (se primeiro deploy)
  - Error rate > 5%
  - Latency P95 > 2s
  - Disponibilidade < 99.5%

- [ ] **Dashboard preparado** para monitorar deploy
  - Cloud Run dashboard aberto
  - Cloud Logging aberto
  - Cloud Monitoring dashboard

### 🔄 Rollback Plan

- [ ] **Revisão anterior identificada** (para rollback rápido)
  ```bash
  gcloud run revisions list --service=analyzer-rag --region=us-central1
  ```

- [ ] **Script de rollback** testado
  ```bash
  ./services/analyzer/rollback.sh
  # Deve listar revisões disponíveis
  ```

- [ ] **Backup de dados** realizado (se aplicável)

### 📣 Comunicação

- [ ] **Equipe notificada** sobre deploy
- [ ] **Janela de manutenção** comunicada (se necessário)
- [ ] **Stakeholders informados** sobre mudanças

---

## 🚀 Durante o Deploy

### Monitoramento Ativo

- [ ] **Logs sendo monitorados**
  ```bash
  gcloud logs tail --project=PROJECT_ID --service=analyzer-rag --limit=50
  ```

- [ ] **Métricas sendo observadas**
  - Latência
  - Taxa de erro
  - Throughput

- [ ] **Health checks passando**
  ```bash
  curl -X GET "https://SERVICE_URL/health"
  ```

### Validação Progressiva

- [ ] **Smoke tests executados**
  - Health endpoint responde
  - Endpoints principais acessíveis
  - Integração com Vertex AI funcionando

- [ ] **Tráfego gradual** (se deploy canário)
  - 10% → 25% → 50% → 100%

---

## ✅ Após o Deploy

### Verificação Imediata (0-5 min)

- [ ] **Health check verde**
- [ ] **Sem erros nos logs**
- [ ] **Latência normal** (< 2s P95)
- [ ] **CPU/Memory** em níveis normais

### Verificação Curto Prazo (5-30 min)

- [ ] **Taxa de erro** < 1%
- [ ] **Todas as features** funcionando
- [ ] **Integrações externas** OK
- [ ] **Testes E2E** passando em produção

### Verificação Médio Prazo (30 min - 2h)

- [ ] **Performance estável**
- [ ] **Sem memory leaks**
- [ ] **Cold starts** aceitáveis
- [ ] **Usuários reportam** sucesso

### Documentação Pós-Deploy

- [ ] **Deploy registrado** no CHANGELOG
- [ ] **Versão taggeada** no git
- [ ] **Post-mortem** (se houve issues)
- [ ] **Lições aprendidas** documentadas

---

## 🆘 Ações em Caso de Problema

### Se algo der errado:

1. **Rollback imediato** (se critical)
   ```bash
   ./services/analyzer/rollback.sh PREVIOUS_REVISION
   ```

2. **Investigar logs**
   ```bash
   gcloud logs read --project=PROJECT_ID --service=analyzer-rag --limit=100
   ```

3. **Notificar equipe** via Slack/Email

4. **Documentar issue** para post-mortem

---

## 📞 Contatos de Emergência

- **DevOps Lead**: [email/slack]
- **Backend Team**: [email/slack]
- **On-Call**: [phone/pager]
- **GCP Support**: [ticket system]

---

**Última atualização**: 21/11/2025
**Versão**: 1.0.0
**Aprovado por**: DevOps Team

---

## 💡 Dicas

- ✅ Deploy em horários de baixo tráfego
- ✅ Mantenha a equipe de sobreaviso
- ✅ Tenha rollback plan claro
- ✅ Monitore ativamente por 1-2 horas
- ✅ Documente tudo
- ❌ Nunca deploy às sextas-feiras 😅
- ❌ Nunca deploy sem testes passando
- ❌ Nunca deploy sem rollback plan
