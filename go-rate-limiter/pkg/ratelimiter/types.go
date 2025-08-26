package ratelimiter

import (
	"context"
	"time"
)

// Algorithm define os algoritmos de rate limiting disponíveis
type Algorithm int

const (
	// TokenBucket permite rajadas controladas de requests
	TokenBucket Algorithm = iota
	// FixedWindow usa janelas fixas de tempo
	FixedWindow
	// SlidingWindow usa janelas deslizantes para controle preciso
	SlidingWindow
	// LeakyBucket processa requests em taxa constante
	LeakyBucket
)

// String retorna a representação em string do algoritmo
func (a Algorithm) String() string {
	switch a {
	case TokenBucket:
		return "TokenBucket"
	case FixedWindow:
		return "FixedWindow"
	case SlidingWindow:
		return "SlidingWindow"
	case LeakyBucket:
		return "LeakyBucket"
	default:
		return "Unknown"
	}
}

// Config define a configuração do rate limiter
type Config struct {
	// Algorithm especifica qual algoritmo usar
	Algorithm Algorithm
	
	// Rate define o número máximo de requests permitidos
	Rate int64
	
	// Window define a janela de tempo para o rate limiting
	Window time.Duration
	
	// BurstSize define o tamanho máximo da rajada (usado no TokenBucket)
	BurstSize int64
	
	// CleanupInterval define o intervalo de limpeza de dados expirados
	CleanupInterval time.Duration
	
	// Storage define o backend de armazenamento
	Storage Storage
	
	// KeyExtractor função para extrair chave de identificação
	KeyExtractor KeyExtractorFunc
}

// DefaultConfig retorna uma configuração padrão
func DefaultConfig() Config {
	return Config{
		Algorithm:       TokenBucket,
		Rate:            100,
		Window:          time.Minute,
		BurstSize:       10,
		CleanupInterval: time.Minute * 5,
	}
}

// Result representa o resultado de uma verificação de rate limit
type Result struct {
	// Allowed indica se o request foi permitido
	Allowed bool
	
	// Remaining indica quantos requests restam na janela atual
	Remaining int64
	
	// ResetTime indica quando o limite será resetado
	ResetTime time.Time
	
	// RetryAfter indica quando tentar novamente (se não permitido)
	RetryAfter time.Duration
	
	// Metadata contém informações adicionais específicas do algoritmo
	Metadata map[string]interface{}
}

// RateLimiter interface principal do rate limiter
type RateLimiter interface {
	// Allow verifica se um request é permitido para a chave dada
	Allow(key string) bool
	
	// AllowN verifica se N requests são permitidos para a chave dada
	AllowN(key string, n int64) bool
	
	// Check verifica o status sem consumir tokens
	Check(key string) Result
	
	// Reset reseta o contador para a chave dada
	Reset(key string) error
	
	// GetMetrics retorna as métricas atuais do rate limiter
	GetMetrics() Metrics
	
	// Close fecha o rate limiter e limpa recursos
	Close() error
}

// Storage interface para backends de armazenamento
type Storage interface {
	// Get recupera dados para uma chave
	Get(ctx context.Context, key string) ([]byte, error)
	
	// Set armazena dados para uma chave com TTL
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
	
	// Delete remove dados para uma chave
	Delete(ctx context.Context, key string) error
	
	// Exists verifica se uma chave existe
	Exists(ctx context.Context, key string) (bool, error)
	
	// Close fecha a conexão de armazenamento
	Close() error
}

// KeyExtractorFunc função para extrair chave de identificação
type KeyExtractorFunc func(identifier string) string

// Metrics contém métricas do rate limiter
type Metrics struct {
	// TotalRequests total de requests processados
	TotalRequests int64
	
	// AllowedRequests requests permitidos
	AllowedRequests int64
	
	// DeniedRequests requests negados
	DeniedRequests int64
	
	// AverageLatency latência média das operações
	AverageLatency time.Duration
	
	// ActiveKeys número de chaves ativas
	ActiveKeys int64
	
	// LastCleanup último cleanup executado
	LastCleanup time.Time
}

// Error tipos de erro específicos do rate limiter
type Error struct {
	Code    string
	Message string
	Cause   error
}

func (e *Error) Error() string {
	if e.Cause != nil {
		return e.Message + ": " + e.Cause.Error()
	}
	return e.Message
}

// Códigos de erro comuns
var (
	ErrRateLimitExceeded = &Error{
		Code:    "RATE_LIMIT_EXCEEDED",
		Message: "Rate limit exceeded",
	}
	
	ErrInvalidConfig = &Error{
		Code:    "INVALID_CONFIG",
		Message: "Invalid configuration",
	}
	
	ErrStorageUnavailable = &Error{
		Code:    "STORAGE_UNAVAILABLE",
		Message: "Storage backend unavailable",
	}
	
	ErrInvalidKey = &Error{
		Code:    "INVALID_KEY",
		Message: "Invalid key provided",
	}
)