package examples

import (
	"context"
	"fmt"
	"log"
	"time"
)

// Interfaces simuladas para demonstrar a estrutura sem dependências externas
type FirestoreClient interface {
	Collection(path string) CollectionRef
	Close() error
}

type CollectionRef interface {
	Doc(id string) DocumentRef
	Documents(ctx context.Context) DocumentIterator
	Add(ctx context.Context, data interface{}) (DocumentRef, error)
	Where(path, op string, value interface{}) Query
	OrderBy(path string, dir Direction) Query
	Limit(limit int) Query
}

type DocumentRef interface {
	Get(ctx context.Context) (DocumentSnapshot, error)
	Set(ctx context.Context, data interface{}) error
	Update(ctx context.Context, updates []Update) error
	Delete(ctx context.Context) error
	ID() string
}

type DocumentSnapshot interface {
	Exists() bool
	Data() map[string]interface{}
	DataTo(v interface{}) error
}

type DocumentIterator interface {
	Next() (DocumentSnapshot, error)
	Stop()
}

type Query interface {
	Documents(ctx context.Context) DocumentIterator
	OrderBy(path string, dir Direction) Query
	Limit(limit int) Query
	Where(path, op string, value interface{}) Query
}

type Update struct {
	Path  string
	Value interface{}
}

type Direction int

const (
	Asc Direction = iota
	Desc
)

// AuthClient simulado
type AuthClient interface {
	VerifyIDToken(ctx context.Context, idToken string) (Token, error)
	GetUser(ctx context.Context, uid string) (UserRecord, error)
}

type Token interface {
	UID() string
	Claims() map[string]interface{}
}

type UserRecord interface {
	UID() string
	CustomClaims() map[string]interface{}
}

// ComissoesService gerencia operações relacionadas às comissões no Firestore
type ComissoesService struct {
	firestoreClient FirestoreClient
	authClient      AuthClient
}

// TipoComissao representa os tipos possíveis de comissão
type TipoComissao string

const (
	TipoPermanente TipoComissao = "PERMANENTE"
	TipoTemporaria TipoComissao = "TEMPORARIA"
	TipoEspecial   TipoComissao = "ESPECIAL"
)

// StatusComissao representa os status possíveis de uma comissão
type StatusComissao string

const (
	StatusAtiva     StatusComissao = "ATIVA"
	StatusInativa   StatusComissao = "INATIVA"
	StatusSuspensa  StatusComissao = "SUSPENSA"
	StatusEncerrada StatusComissao = "ENCERRADA"
)

// PapelMembro representa os papéis possíveis de um membro
type PapelMembro string

const (
	PapelPresidente     PapelMembro = "PRESIDENTE"
	PapelVicePresidente PapelMembro = "VICE_PRESIDENTE"
	PapelSecretario     PapelMembro = "SECRETARIO"
	PapelMembroRegular  PapelMembro = "MEMBRO"
	PapelSuplente       PapelMembro = "SUPLENTE"
)

// Comissao representa uma comissão no sistema
type Comissao struct {
	ID            string                    `firestore:"-" json:"id"`
	Nome          string                    `firestore:"nome" json:"nome"`
	Tipo          TipoComissao              `firestore:"tipo" json:"tipo"`
	Status        StatusComissao            `firestore:"status" json:"status"`
	DataInicio    time.Time                 `firestore:"dataInicio" json:"dataInicio"`
	DataFim       *time.Time                `firestore:"dataFim,omitempty" json:"dataFim,omitempty"`
	Membros       map[string]MembroComissao `firestore:"membros" json:"membros"`
	Configuracoes ConfiguracoesComissao     `firestore:"configuracoes" json:"configuracoes"`
	CriadoPor     string                    `firestore:"criadoPor" json:"criadoPor"`
	CriadoEm      time.Time                 `firestore:"criadoEm" json:"criadoEm"`
	AtualizadoPor *string                   `firestore:"atualizadoPor,omitempty" json:"atualizadoPor,omitempty"`
	AtualizadoEm  *time.Time                `firestore:"atualizadoEm,omitempty" json:"atualizadoEm,omitempty"`
}

// MembroComissao representa um membro de uma comissão
type MembroComissao struct {
	UsuarioID     string      `firestore:"usuarioId" json:"usuarioId"`
	Papel         PapelMembro `firestore:"papel" json:"papel"`
	DataInicio    time.Time   `firestore:"dataInicio" json:"dataInicio"`
	DataFim       *time.Time  `firestore:"dataFim,omitempty" json:"dataFim,omitempty"`
	Ativo         bool        `firestore:"ativo" json:"ativo"`
	ComissaoID    string      `firestore:"comissaoId" json:"comissaoId"`
	AdicionadoPor string      `firestore:"adicionadoPor" json:"adicionadoPor"`
	AdicionadoEm  time.Time   `firestore:"adicionadoEm" json:"adicionadoEm"`
	AtualizadoPor *string     `firestore:"atualizadoPor,omitempty" json:"atualizadoPor,omitempty"`
	AtualizadoEm  *time.Time  `firestore:"atualizadoEm,omitempty" json:"atualizadoEm,omitempty"`
}

// ConfiguracoesComissao representa as configurações de uma comissão
type ConfiguracoesComissao struct {
	Publica           bool `firestore:"publica" json:"publica"`
	PermiteConvidados bool `firestore:"permiteConvidados" json:"permiteConvidados"`
}

// NewComissoesService cria uma nova instância do serviço de comissões
func NewComissoesService(firestoreClient FirestoreClient, authClient AuthClient) *ComissoesService {
	return &ComissoesService{
		firestoreClient: firestoreClient,
		authClient:      authClient,
	}
}

// CriarComissao cria uma nova comissão no Firestore
func (s *ComissoesService) CriarComissao(ctx context.Context, userID string, comissao *Comissao) (*Comissao, error) {
	// Verificar se o usuário é administrador
	isAdmin, err := s.isUserAdmin(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("erro ao verificar permissões: %v", err)
	}
	if !isAdmin {
		return nil, fmt.Errorf("usuário não tem permissão para criar comissões")
	}

	// Validar dados da comissão
	if err := s.validarComissao(comissao); err != nil {
		return nil, fmt.Errorf("dados inválidos: %v", err)
	}

	// Definir campos de auditoria
	now := time.Now()
	comissao.CriadoPor = userID
	comissao.CriadoEm = now

	// Criar documento no Firestore
	docRef, err := s.firestoreClient.Collection("comissoes").Add(ctx, comissao)
	if err != nil {
		return nil, fmt.Errorf("erro ao criar comissão: %v", err)
	}

	comissao.ID = docRef.ID()
	log.Printf("Comissão criada com sucesso: %s", comissao.ID)
	return comissao, nil
}

// AtualizarComissao atualiza uma comissão existente
func (s *ComissoesService) AtualizarComissao(ctx context.Context, userID, comissaoID string, dados map[string]interface{}) (*Comissao, error) {
	// Buscar comissão existente
	comissao, err := s.BuscarComissaoPorID(ctx, userID, comissaoID)
	if err != nil {
		return nil, err
	}

	// Verificar permissões de escrita
	canWrite, err := s.canUserWriteComissao(ctx, userID, comissao)
	if err != nil {
		return nil, fmt.Errorf("erro ao verificar permissões: %v", err)
	}
	if !canWrite {
		return nil, fmt.Errorf("usuário não tem permissão para editar esta comissão")
	}

	// Preparar atualizações
	updates := []Update{
		{Path: "atualizadoEm", Value: time.Now()},
		{Path: "atualizadoPor", Value: userID},
	}

	// Adicionar campos permitidos
	for _, field := range []string{"nome", "descricao", "tipo", "status", "configuracoes"} {
		if value, exists := dados[field]; exists {
			updates = append(updates, Update{Path: field, Value: value})
		}
	}

	// Atualizar documento
	docRef := s.firestoreClient.Collection("comissoes").Doc(comissaoID)
	if err := docRef.Update(ctx, updates); err != nil {
		return nil, fmt.Errorf("erro ao atualizar comissão: %v", err)
	}

	// Buscar comissão atualizada
	return s.BuscarComissaoPorID(ctx, userID, comissaoID)
}

// BuscarComissaoPorID busca uma comissão pelo ID
func (s *ComissoesService) BuscarComissaoPorID(ctx context.Context, userID, comissaoID string) (*Comissao, error) {
	docRef := s.firestoreClient.Collection("comissoes").Doc(comissaoID)
	doc, err := docRef.Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar comissão: %v", err)
	}

	if !doc.Exists() {
		return nil, fmt.Errorf("comissão não encontrada")
	}

	var comissao Comissao
	if err := doc.DataTo(&comissao); err != nil {
		return nil, fmt.Errorf("erro ao converter dados: %v", err)
	}
	comissao.ID = doc.Data()["id"].(string)

	// Verificar permissões de leitura
	canRead, err := s.canUserReadComissao(ctx, userID, &comissao)
	if err != nil {
		return nil, fmt.Errorf("erro ao verificar permissões: %v", err)
	}
	if !canRead {
		return nil, fmt.Errorf("usuário não tem permissão para acessar esta comissão")
	}

	return &comissao, nil
}

// ListarComissoes lista comissões com filtros
func (s *ComissoesService) ListarComissoes(ctx context.Context, userID string, filtros map[string]interface{}) ([]*Comissao, error) {
	// Verificar se usuário está autenticado
	if userID == "" {
		return nil, fmt.Errorf("usuário não autenticado")
	}

	// Construir query base
	collection := s.firestoreClient.Collection("comissoes")
	var query Query = collection

	// Aplicar filtros
	if status, exists := filtros["status"]; exists {
		query = query.Where("status", "==", status)
	}
	if tipo, exists := filtros["tipo"]; exists {
		query = query.Where("tipo", "==", tipo)
	}

	// Ordenar por data de criação
	query = query.OrderBy("criadoEm", Desc)

	// Aplicar limite se especificado
	if limit, exists := filtros["limit"]; exists {
		if limitInt, ok := limit.(int); ok && limitInt > 0 {
			query = query.Limit(limitInt)
		}
	}

	// Executar query
	iter := query.Documents(ctx)
	defer iter.Stop()

	var comissoes []*Comissao
	for {
		doc, err := iter.Next()
		if err != nil {
			// Simula iterator.Done
			if err.Error() == "no more documents" {
				break
			}
			return nil, fmt.Errorf("erro ao iterar documentos: %v", err)
		}

		var comissao Comissao
		if err := doc.DataTo(&comissao); err != nil {
			log.Printf("Erro ao converter documento %s: %v", doc.Data()["id"], err)
			continue
		}
		comissao.ID = doc.Data()["id"].(string)

		// Verificar permissões de leitura
		canRead, err := s.canUserReadComissao(ctx, userID, &comissao)
		if err != nil {
			log.Printf("Erro ao verificar permissões para comissão %s: %v", comissao.ID, err)
			continue
		}
		if canRead {
			comissoes = append(comissoes, &comissao)
		}
	}

	return comissoes, nil
}

// AdicionarMembro adiciona um membro à comissão
func (s *ComissoesService) AdicionarMembro(ctx context.Context, userID, comissaoID string, membro *MembroComissao) error {
	// Buscar comissão
	comissao, err := s.BuscarComissaoPorID(ctx, userID, comissaoID)
	if err != nil {
		return err
	}

	// Verificar permissões de escrita
	canWrite, err := s.canUserWriteComissao(ctx, userID, comissao)
	if err != nil {
		return fmt.Errorf("erro ao verificar permissões: %v", err)
	}
	if !canWrite {
		return fmt.Errorf("usuário não tem permissão para adicionar membros")
	}

	// Validar dados do membro
	if err := s.validarMembro(membro); err != nil {
		return fmt.Errorf("dados do membro inválidos: %v", err)
	}

	// Definir campos de auditoria
	now := time.Now()
	membro.ComissaoID = comissaoID
	membro.AdicionadoPor = userID
	membro.AdicionadoEm = now
	membro.Ativo = true

	// Atualizar documento
	docRef := s.firestoreClient.Collection("comissoes").Doc(comissaoID)
	updates := []Update{
		{Path: "membros." + membro.UsuarioID, Value: membro},
		{Path: "atualizadoEm", Value: now},
		{Path: "atualizadoPor", Value: userID},
	}

	if err := docRef.Update(ctx, updates); err != nil {
		return fmt.Errorf("erro ao adicionar membro: %v", err)
	}

	log.Printf("Membro %s adicionado à comissão %s", membro.UsuarioID, comissaoID)
	return nil
}

// Funções auxiliares para verificação de permissões

// isUserAdmin verifica se o usuário é administrador
func (s *ComissoesService) isUserAdmin(ctx context.Context, userID string) (bool, error) {
	userRecord, err := s.authClient.GetUser(ctx, userID)
	if err != nil {
		return false, err
	}

	claims := userRecord.CustomClaims()
	if claims == nil {
		return false, nil
	}

	admin, exists := claims["admin"]
	return exists && admin == true, nil
}

// canUserReadComissao verifica se o usuário pode ler a comissão
func (s *ComissoesService) canUserReadComissao(ctx context.Context, userID string, comissao *Comissao) (bool, error) {
	// Administradores podem ler tudo
	if isAdmin, err := s.isUserAdmin(ctx, userID); err != nil {
		return false, err
	} else if isAdmin {
		return true, nil
	}

	// Comissões públicas podem ser lidas por qualquer usuário autenticado
	if comissao.Configuracoes.Publica {
		return true, nil
	}

	// Membros da comissão podem ler
	_, isMembro := comissao.Membros[userID]
	return isMembro, nil
}

// canUserWriteComissao verifica se o usuário pode escrever na comissão
func (s *ComissoesService) canUserWriteComissao(ctx context.Context, userID string, comissao *Comissao) (bool, error) {
	// Administradores podem escrever em tudo
	if isAdmin, err := s.isUserAdmin(ctx, userID); err != nil {
		return false, err
	} else if isAdmin {
		return true, nil
	}

	// Presidente da comissão pode escrever
	if membro, exists := comissao.Membros[userID]; exists {
		return membro.Papel == PapelPresidente && membro.Ativo, nil
	}

	return false, nil
}

// Funções de validação

// validarComissao valida os dados de uma comissão
func (s *ComissoesService) validarComissao(comissao *Comissao) error {
	if comissao.Nome == "" {
		return fmt.Errorf("nome da comissão é obrigatório")
	}
	if len(comissao.Nome) < 3 {
		return fmt.Errorf("nome da comissão deve ter pelo menos 3 caracteres")
	}
	if !s.isValidTipoComissao(comissao.Tipo) {
		return fmt.Errorf("tipo de comissão inválido: %s", comissao.Tipo)
	}
	if !s.isValidStatusComissao(comissao.Status) {
		return fmt.Errorf("status de comissão inválido: %s", comissao.Status)
	}
	if comissao.DataInicio.IsZero() {
		return fmt.Errorf("data de início é obrigatória")
	}
	if comissao.DataFim != nil && comissao.DataFim.Before(comissao.DataInicio) {
		return fmt.Errorf("data de fim não pode ser anterior à data de início")
	}
	return nil
}

// validarMembro valida os dados de um membro
func (s *ComissoesService) validarMembro(membro *MembroComissao) error {
	if membro.UsuarioID == "" {
		return fmt.Errorf("ID do usuário é obrigatório")
	}
	if !s.isValidPapelMembro(membro.Papel) {
		return fmt.Errorf("papel do membro inválido: %s", membro.Papel)
	}
	if membro.DataInicio.IsZero() {
		return fmt.Errorf("data de início é obrigatória")
	}
	if membro.DataFim != nil && membro.DataFim.Before(membro.DataInicio) {
		return fmt.Errorf("data de fim não pode ser anterior à data de início")
	}
	return nil
}

// isValidTipoComissao verifica se o tipo de comissão é válido
func (s *ComissoesService) isValidTipoComissao(tipo TipoComissao) bool {
	return tipo == TipoPermanente || tipo == TipoTemporaria || tipo == TipoEspecial
}

// isValidStatusComissao verifica se o status de comissão é válido
func (s *ComissoesService) isValidStatusComissao(status StatusComissao) bool {
	return status == StatusAtiva || status == StatusInativa || status == StatusSuspensa || status == StatusEncerrada
}

// isValidPapelMembro verifica se o papel do membro é válido
func (s *ComissoesService) isValidPapelMembro(papel PapelMembro) bool {
	return papel == PapelPresidente || papel == PapelVicePresidente || papel == PapelSecretario || papel == PapelMembroRegular || papel == PapelSuplente
}