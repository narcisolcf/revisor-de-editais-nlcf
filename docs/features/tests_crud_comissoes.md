# Feature: Testes para CRUD de Comissões
**Documento de Planejamento de Testes**

---

## 📋 Visão Geral

### Objetivo
Definir uma estratégia abrangente de testes para o módulo de Comissões, garantindo a qualidade, confiabilidade e robustez de todas as funcionalidades implementadas.

### Contexto
Este documento serve como guia para o **@Engenheiro de Testes** implementar uma suíte completa de testes que cubra:
- Testes de unidade para handlers e serviços
- Testes de integração para APIs
- Testes de validação de dados
- Testes de regras de negócio
- Testes de performance e carga

### Escopo dos Testes
- **Backend**: Handlers, serviços, validações, repositórios
- **API**: Endpoints REST, autenticação, autorização
- **Banco de Dados**: Operações CRUD, índices, consultas
- **Regras de Negócio**: Validações, relacionamentos, estados

---

## 🧪 Estratégia de Testes

### Pirâmide de Testes
```
    /\     E2E Tests (10%)
   /  \    - Fluxos completos
  /____\   - Cenários críticos
 /      \  
/________\ Integration Tests (30%)
          - APIs endpoints
          - Banco de dados
          - Serviços externos

__________ Unit Tests (60%)
          - Handlers individuais
          - Validações
          - Lógica de negócio
```

### Ferramentas e Frameworks
- **Go Testing**: Framework nativo do Go
- **Testify**: Assertions e mocks
- **GoMock**: Geração de mocks
- **Dockertest**: Testes com banco de dados
- **HTTPTest**: Testes de endpoints HTTP

---

## 🔧 Configuração do Ambiente de Testes

### Arquivo: `internal/comissoes/testing/setup.go`

```go
package testing

import (
	"context"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"
	"google.golang.org/api/option"
)

type TestSuite struct {
	Client     *firestore.Client
	Pool       *dockertest.Pool
	Resource   *dockertest.Resource
	ProjectID  string
	CleanupFns []func()
}

func SetupTestSuite(m *testing.M) {
	// Setup do ambiente de teste
	pool, err := dockertest.NewPool("")
	if err != nil {
		log.Fatalf("Could not connect to docker: %s", err)
	}

	// Configurar Firestore Emulator
	resource, err := pool.RunWithOptions(&dockertest.RunOptions{
		Repository: "gcr.io/google.com/cloudsdktool/cloud-sdk",
		Tag:        "latest",
		Cmd: []string{
			"gcloud", "beta", "emulators", "firestore", "start",
			"--host-port=0.0.0.0:8080",
			"--project=test-project",
		},
		ExposedPorts: []string{"8080"},
	})
	if err != nil {
		log.Fatalf("Could not start resource: %s", err)
	}

	// Configurar variáveis de ambiente
	os.Setenv("FIRESTORE_EMULATOR_HOST", fmt.Sprintf("localhost:%s", resource.GetPort("8080/tcp")))
	os.Setenv("GOOGLE_CLOUD_PROJECT", "test-project")

	// Aguardar o emulador estar pronto
	if err := pool.Retry(func() error {
		client, err := firestore.NewClient(context.Background(), "test-project")
		if err != nil {
			return err
		}
		defer client.Close()
		return nil
	}); err != nil {
		log.Fatalf("Could not connect to firestore emulator: %s", err)
	}

	// Executar testes
	code := m.Run()

	// Cleanup
	if err := pool.Purge(resource); err != nil {
		log.Fatalf("Could not purge resource: %s", err)
	}

	os.Exit(code)
}

func NewTestSuite(t *testing.T) *TestSuite {
	client, err := firestore.NewClient(context.Background(), "test-project")
	if err != nil {
		t.Fatalf("Failed to create firestore client: %v", err)
	}

	return &TestSuite{
		Client:    client,
		ProjectID: "test-project",
	}
}

func (ts *TestSuite) Cleanup() {
	for _, fn := range ts.CleanupFns {
		fn()
	}
	if ts.Client != nil {
		ts.Client.Close()
	}
}

func (ts *TestSuite) CreateTestComissao() *Comissao {
	return &Comissao{
		ID:               "test-comissao-1",
		OrganizationID:   "test-org-1",
		NomeDaComissao:   "Comissão de Teste",
		Tipo:             TipoComissaoPermanente,
		Status:           StatusComissaoAtiva,
		DataDeCriacao:    time.Now(),
		Descricao:        "Comissão criada para testes",
		Objetivo:         "Testar funcionalidades",
		Membros:          []MembroComissao{},
		Configuracoes: &ConfiguracoesComissao{
			RequererQuorum:        false,
			PermitirSubstituicoes: true,
			NotificarMembros:      true,
		},
		CreatedBy: "test-user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func (ts *TestSuite) CreateTestMembro() MembroComissao {
	return MembroComissao{
		ServidorID:      "test-servidor-1",
		Papel:           PapelMembroMembro,
		DataDeIngresso:  time.Now(),
		Ativo:           true,
		Observacoes:     "Membro de teste",
	}
}
```

---

## 🧪 Testes de Unidade

### 1. Testes do Handler de Criação

#### Arquivo: `internal/comissoes/handlers/create_test.go`

```go
package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestCreateComissaoHandler(t *testing.T) {
	tests := []struct {
		name           string
		request        CreateComissaoRequest
		mockSetup      func(*MockComissaoService)
		expectedStatus int
		expectedError  string
	}{
		{
			name: "Sucesso - Comissão Permanente",
			request: CreateComissaoRequest{
				NomeDaComissao: "Comissão de Licitação",
				Tipo:           TipoComissaoPermanente,
				DataDeCriacao:  time.Now(),
				Descricao:      "Comissão responsável por licitações",
			},
			mockSetup: func(m *MockComissaoService) {
				m.On("Create", mock.Anything, mock.AnythingOfType("string"), mock.AnythingOfType("CreateComissaoRequest")).
					Return(&Comissao{ID: "new-id"}, nil)
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "Sucesso - Comissão Temporária",
			request: CreateComissaoRequest{
				NomeDaComissao:      "Comissão Especial",
				Tipo:                TipoComissaoTemporaria,
				DataDeCriacao:       time.Now(),
				DataDeEncerramento:  timePtr(time.Now().AddDate(0, 6, 0)),
				Descricao:           "Comissão temporária",
			},
			mockSetup: func(m *MockComissaoService) {
				m.On("Create", mock.Anything, mock.AnythingOfType("string"), mock.AnythingOfType("CreateComissaoRequest")).
					Return(&Comissao{ID: "new-id"}, nil)
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "Erro - Nome muito curto",
			request: CreateComissaoRequest{
				NomeDaComissao: "AB",
				Tipo:           TipoComissaoPermanente,
				DataDeCriacao:  time.Now(),
			},
			mockSetup:      func(m *MockComissaoService) {},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Nome deve ter pelo menos 3 caracteres",
		},
		{
			name: "Erro - Comissão temporária sem data de encerramento",
			request: CreateComissaoRequest{
				NomeDaComissao: "Comissão Temporária",
				Tipo:           TipoComissaoTemporaria,
				DataDeCriacao:  time.Now(),
			},
			mockSetup:      func(m *MockComissaoService) {},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Data de encerramento é obrigatória para comissões temporárias",
		},
		{
			name: "Erro - Data de encerramento no passado",
			request: CreateComissaoRequest{
				NomeDaComissao:     "Comissão Temporária",
				Tipo:               TipoComissaoTemporaria,
				DataDeCriacao:      time.Now(),
				DataDeEncerramento: timePtr(time.Now().AddDate(0, 0, -1)),
			},
			mockSetup:      func(m *MockComissaoService) {},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "Data de encerramento deve ser posterior à data de criação",
		},
		{
			name: "Erro - Nome duplicado",
			request: CreateComissaoRequest{
				NomeDaComissao: "Comissão Existente",
				Tipo:           TipoComissaoPermanente,
				DataDeCriacao:  time.Now(),
			},
			mockSetup: func(m *MockComissaoService) {
				m.On("Create", mock.Anything, mock.AnythingOfType("string"), mock.AnythingOfType("CreateComissaoRequest")).
					Return(nil, ErrComissaoJaExiste)
			},
			expectedStatus: http.StatusConflict,
			expectedError:  "Já existe uma comissão com este nome",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockService := NewMockComissaoService(t)
			tt.mockSetup(mockService)

			handler := NewComissaoHandler(mockService)
			gin.SetMode(gin.TestMode)
			router := gin.New()
			router.POST("/comissoes", handler.Create)

			// Preparar request
			body, _ := json.Marshal(tt.request)
			req := httptest.NewRequest(http.MethodPost, "/comissoes", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-Organization-ID", "test-org-1")
			req.Header.Set("X-User-ID", "test-user-1")

			w := httptest.NewRecorder()

			// Executar
			router.ServeHTTP(w, req)

			// Verificar
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var response ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.Contains(t, response.Message, tt.expectedError)
			} else {
				var response CreateComissaoResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.NotEmpty(t, response.ID)
			}

			mockService.AssertExpectations(t)
		})
	}
}

func timePtr(t time.Time) *time.Time {
	return &t
}
```

### 2. Testes do Handler de Listagem

#### Arquivo: `internal/comissoes/handlers/list_test.go`

```go
func TestListComissoesHandler(t *testing.T) {
	tests := []struct {
		name           string
		queryParams    string
		mockSetup      func(*MockComissaoService)
		expectedStatus int
		expectedCount  int
	}{
		{
			name: "Sucesso - Lista todas as comissões",
			mockSetup: func(m *MockComissaoService) {
				comissoes := []*Comissao{
					{ID: "1", NomeDaComissao: "Comissão A"},
					{ID: "2", NomeDaComissao: "Comissão B"},
				}
				m.On("List", mock.Anything, "test-org-1", mock.AnythingOfType("ListComissoesOptions")).
					Return(&ListComissoesResponse{
						Data:       comissoes,
						Pagination: PaginationInfo{Total: 2, Page: 1, Limit: 20},
					}, nil)
			},
			expectedStatus: http.StatusOK,
			expectedCount:  2,
		},
		{
			name:        "Sucesso - Filtro por tipo",
			queryParams: "?tipo=Permanente",
			mockSetup: func(m *MockComissaoService) {
				comissoes := []*Comissao{
					{ID: "1", NomeDaComissao: "Comissão A", Tipo: TipoComissaoPermanente},
				}
				m.On("List", mock.Anything, "test-org-1", mock.MatchedBy(func(opts ListComissoesOptions) bool {
					return opts.Tipo != nil && *opts.Tipo == TipoComissaoPermanente
				})).Return(&ListComissoesResponse{
					Data:       comissoes,
					Pagination: PaginationInfo{Total: 1, Page: 1, Limit: 20},
				}, nil)
			},
			expectedStatus: http.StatusOK,
			expectedCount:  1,
		},
		{
			name:        "Sucesso - Busca por nome",
			queryParams: "?search=Licitação",
			mockSetup: func(m *MockComissaoService) {
				comissoes := []*Comissao{
					{ID: "1", NomeDaComissao: "Comissão de Licitação"},
				}
				m.On("List", mock.Anything, "test-org-1", mock.MatchedBy(func(opts ListComissoesOptions) bool {
					return opts.Search != nil && *opts.Search == "Licitação"
				})).Return(&ListComissoesResponse{
					Data:       comissoes,
					Pagination: PaginationInfo{Total: 1, Page: 1, Limit: 20},
				}, nil)
			},
			expectedStatus: http.StatusOK,
			expectedCount:  1,
		},
		{
			name:        "Sucesso - Paginação",
			queryParams: "?page=2&limit=5",
			mockSetup: func(m *MockComissaoService) {
				m.On("List", mock.Anything, "test-org-1", mock.MatchedBy(func(opts ListComissoesOptions) bool {
					return opts.Page == 2 && opts.Limit == 5
				})).Return(&ListComissoesResponse{
					Data:       []*Comissao{},
					Pagination: PaginationInfo{Total: 10, Page: 2, Limit: 5},
				}, nil)
			},
			expectedStatus: http.StatusOK,
			expectedCount:  0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockService := NewMockComissaoService(t)
			tt.mockSetup(mockService)

			handler := NewComissaoHandler(mockService)
			gin.SetMode(gin.TestMode)
			router := gin.New()
			router.GET("/comissoes", handler.List)

			// Preparar request
			req := httptest.NewRequest(http.MethodGet, "/comissoes"+tt.queryParams, nil)
			req.Header.Set("X-Organization-ID", "test-org-1")

			w := httptest.NewRecorder()

			// Executar
			router.ServeHTTP(w, req)

			// Verificar
			assert.Equal(t, tt.expectedStatus, w.Code)

			var response ListComissoesResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)
			assert.Len(t, response.Data, tt.expectedCount)

			mockService.AssertExpectations(t)
		})
	}
}
```

### 3. Testes do Handler de Gerenciamento de Membros

#### Arquivo: `internal/comissoes/handlers/membros_test.go`

```go
func TestAdicionarMembroHandler(t *testing.T) {
	tests := []struct {
		name           string
		request        AdicionarMembroRequest
		mockSetup      func(*MockComissaoService)
		expectedStatus int
		expectedError  string
	}{
		{
			name: "Sucesso - Adicionar membro",
			request: AdicionarMembroRequest{
				ServidorID: "servidor-1",
				Papel:      PapelMembroMembro,
			},
			mockSetup: func(m *MockComissaoService) {
				m.On("AdicionarMembro", mock.Anything, "test-org-1", "comissao-1", mock.AnythingOfType("AdicionarMembroRequest")).
					Return(nil)
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "Erro - Membro já existe",
			request: AdicionarMembroRequest{
				ServidorID: "servidor-1",
				Papel:      PapelMembroMembro,
			},
			mockSetup: func(m *MockComissaoService) {
				m.On("AdicionarMembro", mock.Anything, "test-org-1", "comissao-1", mock.AnythingOfType("AdicionarMembroRequest")).
					Return(ErrMembroJaExiste)
			},
			expectedStatus: http.StatusConflict,
			expectedError:  "Servidor já é membro desta comissão",
		},
		{
			name: "Erro - Presidente já existe",
			request: AdicionarMembroRequest{
				ServidorID: "servidor-2",
				Papel:      PapelMembroPresidente,
			},
			mockSetup: func(m *MockComissaoService) {
				m.On("AdicionarMembro", mock.Anything, "test-org-1", "comissao-1", mock.AnythingOfType("AdicionarMembroRequest")).
					Return(ErrPresidenteJaExiste)
			},
			expectedStatus: http.StatusConflict,
			expectedError:  "Comissão já possui um presidente",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockService := NewMockComissaoService(t)
			tt.mockSetup(mockService)

			handler := NewComissaoHandler(mockService)
			gin.SetMode(gin.TestMode)
			router := gin.New()
			router.POST("/comissoes/:id/membros", handler.AdicionarMembro)

			// Preparar request
			body, _ := json.Marshal(tt.request)
			req := httptest.NewRequest(http.MethodPost, "/comissoes/comissao-1/membros", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-Organization-ID", "test-org-1")

			w := httptest.NewRecorder()

			// Executar
			router.ServeHTTP(w, req)

			// Verificar
			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var response ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.Contains(t, response.Message, tt.expectedError)
			}

			mockService.AssertExpectations(t)
		})
	}
}
```

---

## 🔗 Testes de Integração

### 1. Testes de API Completos

#### Arquivo: `internal/comissoes/integration/api_test.go`

```go
package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

type ComissaoAPITestSuite struct {
	suite.Suite
	testSuite *testing.TestSuite
	router    *gin.Engine
	orgID     string
	userID    string
}

func (s *ComissaoAPITestSuite) SetupSuite() {
	s.testSuite = NewTestSuite(s.T())
	s.router = setupRouter(s.testSuite.Client)
	s.orgID = "test-org-1"
	s.userID = "test-user-1"
}

func (s *ComissaoAPITestSuite) TearDownSuite() {
	s.testSuite.Cleanup()
}

func (s *ComissaoAPITestSuite) SetupTest() {
	// Limpar dados antes de cada teste
	ctx := context.Background()
	collection := s.testSuite.Client.Collection("comissoes")
	docs, _ := collection.Documents(ctx).GetAll()
	for _, doc := range docs {
		doc.Ref.Delete(ctx)
	}
}

func (s *ComissaoAPITestSuite) TestFluxoCompletoComissao() {
	// 1. Criar comissão
	createReq := CreateComissaoRequest{
		NomeDaComissao: "Comissão de Integração",
		Tipo:           TipoComissaoPermanente,
		DataDeCriacao:  time.Now(),
		Descricao:      "Comissão para testes de integração",
	}

	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/comissoes", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Organization-ID", s.orgID)
	req.Header.Set("X-User-ID", s.userID)

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusCreated, w.Code)

	var createResp CreateComissaoResponse
	err := json.Unmarshal(w.Body.Bytes(), &createResp)
	require.NoError(s.T(), err)
	comissaoID := createResp.ID

	// 2. Buscar comissão criada
	req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/comissoes/%s", comissaoID), nil)
	req.Header.Set("X-Organization-ID", s.orgID)

	w = httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusOK, w.Code)

	var getResp GetComissaoResponse
	err = json.Unmarshal(w.Body.Bytes(), &getResp)
	require.NoError(s.T(), err)
	assert.Equal(s.T(), createReq.NomeDaComissao, getResp.NomeDaComissao)
	assert.Equal(s.T(), createReq.Tipo, getResp.Tipo)

	// 3. Listar comissões
	req = httptest.NewRequest(http.MethodGet, "/api/v1/comissoes", nil)
	req.Header.Set("X-Organization-ID", s.orgID)

	w = httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusOK, w.Code)

	var listResp ListComissoesResponse
	err = json.Unmarshal(w.Body.Bytes(), &listResp)
	require.NoError(s.T(), err)
	assert.Len(s.T(), listResp.Data, 1)
	assert.Equal(s.T(), comissaoID, listResp.Data[0].ID)

	// 4. Atualizar comissão
	updateReq := UpdateComissaoRequest{
		NomeDaComissao: "Comissão de Integração Atualizada",
		Descricao:      "Descrição atualizada",
	}

	body, _ = json.Marshal(updateReq)
	req = httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/comissoes/%s", comissaoID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Organization-ID", s.orgID)
	req.Header.Set("X-User-ID", s.userID)

	w = httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusOK, w.Code)

	// 5. Verificar atualização
	req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/comissoes/%s", comissaoID), nil)
	req.Header.Set("X-Organization-ID", s.orgID)

	w = httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusOK, w.Code)

	err = json.Unmarshal(w.Body.Bytes(), &getResp)
	require.NoError(s.T(), err)
	assert.Equal(s.T(), updateReq.NomeDaComissao, getResp.NomeDaComissao)
	assert.Equal(s.T(), updateReq.Descricao, getResp.Descricao)

	// 6. Deletar comissão
	req = httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/v1/comissoes/%s", comissaoID), nil)
	req.Header.Set("X-Organization-ID", s.orgID)
	req.Header.Set("X-User-ID", s.userID)

	w = httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusNoContent, w.Code)

	// 7. Verificar deleção
	req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/comissoes/%s", comissaoID), nil)
	req.Header.Set("X-Organization-ID", s.orgID)

	w = httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	assert.Equal(s.T(), http.StatusNotFound, w.Code)
}

func (s *ComissaoAPITestSuite) TestGerenciamentoMembros() {
	// 1. Criar comissão
	comissaoID := s.criarComissaoTeste()

	// 2. Adicionar presidente
	adicionarReq := AdicionarMembroRequest{
		ServidorID: "servidor-1",
		Papel:      PapelMembroPresidente,
	}

	body, _ := json.Marshal(adicionarReq)
	req := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/comissoes/%s/membros", comissaoID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Organization-ID", s.orgID)
	req.Header.Set("X-User-ID", s.userID)

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusOK, w.Code)

	// 3. Adicionar membro
	adicionarReq = AdicionarMembroRequest{
		ServidorID: "servidor-2",
		Papel:      PapelMembroMembro,
	}

	body, _ = json.Marshal(adicionarReq)
	req = httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/comissoes/%s/membros", comissaoID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Organization-ID", s.orgID)
	req.Header.Set("X-User-ID", s.userID)

	w = httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusOK, w.Code)

	// 4. Listar membros
	req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/comissoes/%s/membros", comissaoID), nil)
	req.Header.Set("X-Organization-ID", s.orgID)

	w = httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusOK, w.Code)

	var membrosResp ListMembrosResponse
	err := json.Unmarshal(w.Body.Bytes(), &membrosResp)
	require.NoError(s.T(), err)
	assert.Len(s.T(), membrosResp.Membros, 2)

	// 5. Remover membro
	req = httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/api/v1/comissoes/%s/membros/servidor-2", comissaoID), nil)
	req.Header.Set("X-Organization-ID", s.orgID)
	req.Header.Set("X-User-ID", s.userID)

	w = httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusOK, w.Code)

	// 6. Verificar remoção
	req = httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/comissoes/%s/membros", comissaoID), nil)
	req.Header.Set("X-Organization-ID", s.orgID)

	w = httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	require.Equal(s.T(), http.StatusOK, w.Code)

	err = json.Unmarshal(w.Body.Bytes(), &membrosResp)
	require.NoError(s.T(), err)
	assert.Len(s.T(), membrosResp.Membros, 1)
	assert.Equal(s.T(), PapelMembroPresidente, membrosResp.Membros[0].Papel)
}

func (s *ComissaoAPITestSuite) criarComissaoTeste() string {
	createReq := CreateComissaoRequest{
		NomeDaComissao: "Comissão Teste",
		Tipo:           TipoComissaoPermanente,
		DataDeCriacao:  time.Now(),
	}

	body, _ := json.Marshal(createReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/comissoes", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Organization-ID", s.orgID)
	req.Header.Set("X-User-ID", s.userID)

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	var createResp CreateComissaoResponse
	json.Unmarshal(w.Body.Bytes(), &createResp)
	return createResp.ID
}

func TestComissaoAPITestSuite(t *testing.T) {
	suite.Run(t, new(ComissaoAPITestSuite))
}
```

---

## 📊 Testes de Performance

### Arquivo: `internal/comissoes/performance/load_test.go`

```go
package performance

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestCreateComissaoPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Pulando teste de performance em modo short")
	}

	testSuite := NewTestSuite(t)
	defer testSuite.Cleanup()

	router := setupRouter(testSuite.Client)

	// Configurações do teste
	concurrentUsers := 50
	requestsPerUser := 10
	totalRequests := concurrentUsers * requestsPerUser

	// Métricas
	var (
		successCount int64
		errorCount   int64
		totalTime    time.Duration
		mutex        sync.Mutex
		wg           sync.WaitGroup
	)

	startTime := time.Now()

	// Executar requisições concorrentes
	for i := 0; i < concurrentUsers; i++ {
		wg.Add(1)
		go func(userID int) {
			defer wg.Done()

			for j := 0; j < requestsPerUser; j++ {
				reqStart := time.Now()

				// Criar request
				createReq := CreateComissaoRequest{
					NomeDaComissao: fmt.Sprintf("Comissão %d-%d", userID, j),
					Tipo:           TipoComissaoPermanente,
					DataDeCriacao:  time.Now(),
				}

				body, _ := json.Marshal(createReq)
				req := httptest.NewRequest(http.MethodPost, "/api/v1/comissoes", bytes.NewBuffer(body))
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("X-Organization-ID", "test-org-1")
				req.Header.Set("X-User-ID", fmt.Sprintf("user-%d", userID))

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				reqDuration := time.Since(reqStart)

				mutex.Lock()
				if w.Code == http.StatusCreated {
					successCount++
				} else {
					errorCount++
				}
				totalTime += reqDuration
				mutex.Unlock()
			}
		}(i)
	}

	wg.Wait()
	totalDuration := time.Since(startTime)

	// Calcular métricas
	avgResponseTime := totalTime / time.Duration(totalRequests)
	throughput := float64(totalRequests) / totalDuration.Seconds()
	successRate := float64(successCount) / float64(totalRequests) * 100

	// Verificar resultados
	t.Logf("Resultados do teste de performance:")
	t.Logf("Total de requisições: %d", totalRequests)
	t.Logf("Sucessos: %d", successCount)
	t.Logf("Erros: %d", errorCount)
	t.Logf("Taxa de sucesso: %.2f%%", successRate)
	t.Logf("Tempo médio de resposta: %v", avgResponseTime)
	t.Logf("Throughput: %.2f req/s", throughput)
	t.Logf("Duração total: %v", totalDuration)

	// Assertions
	assert.GreaterOrEqual(t, successRate, 95.0, "Taxa de sucesso deve ser >= 95%")
	assert.LessOrEqual(t, avgResponseTime, 100*time.Millisecond, "Tempo médio de resposta deve ser <= 100ms")
	assert.GreaterOrEqual(t, throughput, 100.0, "Throughput deve ser >= 100 req/s")
}

func TestListComissoesPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Pulando teste de performance em modo short")
	}

	testSuite := NewTestSuite(t)
	defer testSuite.Cleanup()

	router := setupRouter(testSuite.Client)

	// Preparar dados de teste
	orgID := "test-org-1"
	numComissoes := 1000

	// Criar comissões de teste
	for i := 0; i < numComissoes; i++ {
		createReq := CreateComissaoRequest{
			NomeDaComissao: fmt.Sprintf("Comissão %d", i),
			Tipo:           TipoComissaoPermanente,
			DataDeCriacao:  time.Now(),
		}

		body, _ := json.Marshal(createReq)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/comissoes", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Organization-ID", orgID)
		req.Header.Set("X-User-ID", "test-user")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
	}

	// Teste de performance para listagem
	concurrentUsers := 20
	requestsPerUser := 50
	totalRequests := concurrentUsers * requestsPerUser

	var (
		successCount int64
		errorCount   int64
		totalTime    time.Duration
		mutex        sync.Mutex
		wg           sync.WaitGroup
	)

	startTime := time.Now()

	for i := 0; i < concurrentUsers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			for j := 0; j < requestsPerUser; j++ {
				reqStart := time.Now()

				req := httptest.NewRequest(http.MethodGet, "/api/v1/comissoes?limit=20", nil)
				req.Header.Set("X-Organization-ID", orgID)

				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)

				reqDuration := time.Since(reqStart)

				mutex.Lock()
				if w.Code == http.StatusOK {
					successCount++
				} else {
					errorCount++
				}
				totalTime += reqDuration
				mutex.Unlock()
			}
		}()
	}

	wg.Wait()
	totalDuration := time.Since(startTime)

	// Calcular métricas
	avgResponseTime := totalTime / time.Duration(totalRequests)
	throughput := float64(totalRequests) / totalDuration.Seconds()
	successRate := float64(successCount) / float64(totalRequests) * 100

	// Verificar resultados
	t.Logf("Resultados do teste de performance (listagem):")
	t.Logf("Total de comissões no banco: %d", numComissoes)
	t.Logf("Total de requisições: %d", totalRequests)
	t.Logf("Sucessos: %d", successCount)
	t.Logf("Erros: %d", errorCount)
	t.Logf("Taxa de sucesso: %.2f%%", successRate)
	t.Logf("Tempo médio de resposta: %v", avgResponseTime)
	t.Logf("Throughput: %.2f req/s", throughput)

	// Assertions
	assert.GreaterOrEqual(t, successRate, 98.0, "Taxa de sucesso deve ser >= 98%")
	assert.LessOrEqual(t, avgResponseTime, 50*time.Millisecond, "Tempo médio de resposta deve ser <= 50ms")
	assert.GreaterOrEqual(t, throughput, 200.0, "Throughput deve ser >= 200 req/s")
}
```

---

## 🔍 Testes de Validação

### Arquivo: `internal/comissoes/validation/validation_test.go`

```go
package validation

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestValidateCreateComissaoRequest(t *testing.T) {
	tests := []struct {
		name          string
		request       CreateComissaoRequest
		expectedValid bool
		expectedError string
	}{
		{
			name: "Válido - Comissão Permanente",
			request: CreateComissaoRequest{
				NomeDaComissao: "Comissão de Licitação",
				Tipo:           TipoComissaoPermanente,
				DataDeCriacao:  time.Now(),
				Descricao:      "Comissão responsável por licitações",
			},
			expectedValid: true,
		},
		{
			name: "Válido - Comissão Temporária",
			request: CreateComissaoRequest{
				NomeDaComissao:     "Comissão Especial",
				Tipo:               TipoComissaoTemporaria,
				DataDeCriacao:      time.Now(),
				DataDeEncerramento: timePtr(time.Now().AddDate(0, 6, 0)),
			},
			expectedValid: true,
		},
		{
			name: "Inválido - Nome vazio",
			request: CreateComissaoRequest{
				NomeDaComissao: "",
				Tipo:           TipoComissaoPermanente,
				DataDeCriacao:  time.Now(),
			},
			expectedValid: false,
			expectedError: "Nome da comissão é obrigatório",
		},
		{
			name: "Inválido - Nome muito curto",
			request: CreateComissaoRequest{
				NomeDaComissao: "AB",
				Tipo:           TipoComissaoPermanente,
				DataDeCriacao:  time.Now(),
			},
			expectedValid: false,
			expectedError: "Nome deve ter pelo menos 3 caracteres",
		},
		{
			name: "Inválido - Nome muito longo",
			request: CreateComissaoRequest{
				NomeDaComissao: string(make([]byte, 101)), // 101 caracteres
				Tipo:           TipoComissaoPermanente,
				DataDeCriacao:  time.Now(),
			},
			expectedValid: false,
			expectedError: "Nome deve ter no máximo 100 caracteres",
		},
		{
			name: "Inválido - Tipo inválido",
			request: CreateComissaoRequest{
				NomeDaComissao: "Comissão Teste",
				Tipo:           "TipoInvalido",
				DataDeCriacao:  time.Now(),
			},
			expectedValid: false,
			expectedError: "Tipo de comissão inválido",
		},
		{
			name: "Inválido - Data de criação no futuro",
			request: CreateComissaoRequest{
				NomeDaComissao: "Comissão Teste",
				Tipo:           TipoComissaoPermanente,
				DataDeCriacao:  time.Now().AddDate(0, 0, 1),
			},
			expectedValid: false,
			expectedError: "Data de criação não pode ser no futuro",
		},
		{
			name: "Inválido - Comissão temporária sem data de encerramento",
			request: CreateComissaoRequest{
				NomeDaComissao: "Comissão Temporária",
				Tipo:           TipoComissaoTemporaria,
				DataDeCriacao:  time.Now(),
			},
			expectedValid: false,
			expectedError: "Data de encerramento é obrigatória para comissões temporárias",
		},
		{
			name: "Inválido - Data de encerramento anterior à criação",
			request: CreateComissaoRequest{
				NomeDaComissao:     "Comissão Temporária",
				Tipo:               TipoComissaoTemporaria,
				DataDeCriacao:      time.Now(),
				DataDeEncerramento: timePtr(time.Now().AddDate(0, 0, -1)),
			},
			expectedValid: false,
			expectedError: "Data de encerramento deve ser posterior à data de criação",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateCreateComissaoRequest(tt.request)

			if tt.expectedValid {
				assert.NoError(t, err)
			} else {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			}
		})
	}
}

func TestValidateAdicionarMembroRequest(t *testing.T) {
	tests := []struct {
		name          string
		request       AdicionarMembroRequest
		expectedValid bool
		expectedError string
	}{
		{
			name: "Válido - Membro comum",
			request: AdicionarMembroRequest{
				ServidorID: "servidor-1",
				Papel:      PapelMembroMembro,
			},
			expectedValid: true,
		},
		{
			name: "Válido - Presidente",
			request: AdicionarMembroRequest{
				ServidorID:  "servidor-1",
				Papel:       PapelMembroPresidente,
				Observacoes: "Presidente eleito",
			},
			expectedValid: true,
		},
		{
			name: "Inválido - ServidorID vazio",
			request: AdicionarMembroRequest{
				ServidorID: "",
				Papel:      PapelMembroMembro,
			},
			expectedValid: false,
			expectedError: "ID do servidor é obrigatório",
		},
		{
			name: "Inválido - Papel inválido",
			request: AdicionarMembroRequest{
				ServidorID: "servidor-1",
				Papel:      "PapelInvalido",
			},
			expectedValid: false,
			expectedError: "Papel do membro inválido",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateAdicionarMembroRequest(tt.request)

			if tt.expectedValid {
				assert.NoError(t, err)
			} else {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			}
		})
	}
}
```

---

## 🎯 Cobertura de Testes

### Métricas de Cobertura Esperadas

```bash
# Executar testes com cobertura
go test -v -race -coverprofile=coverage.out ./internal/comissoes/...
go tool cover -html=coverage.out -o coverage.html

# Métricas esperadas:
# - Cobertura geral: >= 85%
# - Handlers: >= 90%
# - Services: >= 90%
# - Validations: >= 95%
# - Repository: >= 80%
```

### Arquivo: `scripts/test-coverage.sh`

```bash
#!/bin/bash

set -e

echo "🧪 Executando testes com cobertura..."

# Limpar arquivos de cobertura anteriores
rm -f coverage.out coverage.html

# Executar testes
go test -v -race -coverprofile=coverage.out ./internal/comissoes/...

# Gerar relatório HTML
go tool cover -html=coverage.out -o coverage.html

# Mostrar cobertura no terminal
go tool cover -func=coverage.out

# Verificar cobertura mínima
COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
MIN_COVERAGE=85

if (( $(echo "$COVERAGE < $MIN_COVERAGE" | bc -l) )); then
    echo "❌ Cobertura de testes ($COVERAGE%) está abaixo do mínimo ($MIN_COVERAGE%)"
    exit 1
else
    echo "✅ Cobertura de testes ($COVERAGE%) está adequada"
fi

echo "📊 Relatório HTML gerado: coverage.html"
```

---

## 🚀 Automação de Testes

### GitHub Actions Workflow

#### Arquivo: `.github/workflows/comissoes-tests.yml`

```yaml
name: Comissões - Testes

on:
  push:
    paths:
      - 'internal/comissoes/**'
      - 'api/v1/comissoes/**'
  pull_request:
    paths:
      - 'internal/comissoes/**'
      - 'api/v1/comissoes/**'

jobs:
  test:
    name: Testes Unitários e Integração
    runs-on: ubuntu-latest
    
    services:
      firestore-emulator:
        image: gcr.io/google.com/cloudsdktool/cloud-sdk:latest
        ports:
          - 8080:8080
        options: >
          --health-cmd "curl -f http://localhost:8080 || exit 1"
          --health-interval 30s
          --health-timeout 10s
          --health-retries 5
        env:
          FIRESTORE_EMULATOR_HOST: localhost:8080
          GOOGLE_CLOUD_PROJECT: test-project
    
    steps:
    - name: Checkout código
      uses: actions/checkout@v4
    
    - name: Setup Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.21'
    
    - name: Cache dependências Go
      uses: actions/cache@v3
      with:
        path: |
          ~/.cache/go-build
          ~/go/pkg/mod
        key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
        restore-keys: |
          ${{ runner.os }}-go-
    
    - name: Instalar dependências
      run: go mod download
    
    - name: Executar testes unitários
      run: |
        go test -v -race -short ./internal/comissoes/...
      env:
        FIRESTORE_EMULATOR_HOST: localhost:8080
        GOOGLE_CLOUD_PROJECT: test-project
    
    - name: Executar testes de integração
      run: |
        go test -v -race ./internal/comissoes/integration/...
      env:
        FIRESTORE_EMULATOR_HOST: localhost:8080
        GOOGLE_CLOUD_PROJECT: test-project
    
    - name: Executar testes com cobertura
      run: |
        go test -v -race -coverprofile=coverage.out ./internal/comissoes/...
      env:
        FIRESTORE_EMULATOR_HOST: localhost:8080
        GOOGLE_CLOUD_PROJECT: test-project
    
    - name: Upload cobertura para Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.out
        flags: comissoes
        name: codecov-comissoes
    
    - name: Verificar cobertura mínima
      run: |
        COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')
        echo "Cobertura atual: $COVERAGE%"
        if (( $(echo "$COVERAGE < 85" | bc -l) )); then
          echo "❌ Cobertura abaixo do mínimo (85%)"
          exit 1
        fi
        echo "✅ Cobertura adequada"

  performance:
    name: Testes de Performance
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    
    steps:
    - name: Checkout código
      uses: actions/checkout@v4
    
    - name: Setup Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.21'
    
    - name: Executar testes de performance
      run: |
        go test -v -run=Performance ./internal/comissoes/performance/...
      env:
        FIRESTORE_EMULATOR_HOST: localhost:8080
        GOOGLE_CLOUD_PROJECT: test-project
```

---

## 📋 Checklist de Implementação

### Fase 1: Setup e Configuração
- [ ] Configurar ambiente de testes com Firestore Emulator
- [ ] Implementar `TestSuite` base
- [ ] Configurar mocks e stubs
- [ ] Criar helpers de teste

### Fase 2: Testes Unitários
- [ ] Testes de handlers (Create, Read, Update, Delete, List)
- [ ] Testes de serviços
- [ ] Testes de validações
- [ ] Testes de repositório
- [ ] Testes de gerenciamento de membros

### Fase 3: Testes de Integração
- [ ] Testes de API end-to-end
- [ ] Testes de fluxos completos
- [ ] Testes de autenticação e autorização
- [ ] Testes de relacionamentos entre entidades

### Fase 4: Testes de Performance
- [ ] Testes de carga para criação
- [ ] Testes de carga para listagem
- [ ] Testes de concorrência
- [ ] Benchmarks de operações críticas

### Fase 5: Automação
- [ ] Configurar CI/CD
- [ ] Implementar relatórios de cobertura
- [ ] Configurar alertas de qualidade
- [ ] Documentar processo de testes

---

## 🎯 Métricas de Qualidade

### Critérios de Aceitação
- **Cobertura de Código**: >= 85%
- **Testes Unitários**: >= 90% dos métodos públicos
- **Testes de Integração**: 100% dos endpoints
- **Performance**: Tempo de resposta < 100ms (95º percentil)
- **Confiabilidade**: Taxa de sucesso >= 99.9%

### Relatórios Automáticos
- Cobertura de código (Codecov)
- Qualidade de código (SonarQube)
- Performance (relatórios customizados)
- Segurança (análise estática)

---

*Documento criado em: $(date)*
*Versão: 1.0*
*Próxima revisão: $(date +30 days)*