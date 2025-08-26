package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/revisor-de-editais/go-rate-limiter/pkg/ratelimiter"
)

// HTTPRateLimiter middleware para rate limiting em servidores HTTP
type HTTPRateLimiter struct {
	rateLimiter ratelimiter.RateLimiter
	keyExtractor KeyExtractor
	errorHandler ErrorHandler
	skipPaths   []string
}

// KeyExtractor função para extrair chave de identificação do request
type KeyExtractor func(r *http.Request) string

// ErrorHandler função para lidar com erros de rate limit
type ErrorHandler func(w http.ResponseWriter, r *http.Request, result ratelimiter.Result)

// HTTPConfig configuração do middleware HTTP
type HTTPConfig struct {
	// RateLimiter instância do rate limiter
	RateLimiter ratelimiter.RateLimiter
	
	// KeyExtractor função para extrair chave (padrão: IP do cliente)
	KeyExtractor KeyExtractor
	
	// ErrorHandler função para lidar com rate limit excedido
	ErrorHandler ErrorHandler
	
	// SkipPaths caminhos que devem ser ignorados pelo rate limiter
	SkipPaths []string
}

// NewHTTPRateLimiter cria um novo middleware HTTP de rate limiting
func NewHTTPRateLimiter(config HTTPConfig) *HTTPRateLimiter {
	if config.KeyExtractor == nil {
		config.KeyExtractor = DefaultKeyExtractor
	}
	
	if config.ErrorHandler == nil {
		config.ErrorHandler = DefaultErrorHandler
	}

	return &HTTPRateLimiter{
		rateLimiter: config.RateLimiter,
		keyExtractor: config.KeyExtractor,
		errorHandler: config.ErrorHandler,
		skipPaths:   config.SkipPaths,
	}
}

// Middleware retorna o middleware HTTP
func (hrl *HTTPRateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verificar se o path deve ser ignorado
		if hrl.shouldSkipPath(r.URL.Path) {
			next.ServeHTTP(w, r)
			return
		}

		// Extrair chave de identificação
		key := hrl.keyExtractor(r)
		
		// Verificar rate limit
		if !hrl.rateLimiter.Allow(key) {
			// Rate limit excedido - obter detalhes
			result := hrl.rateLimiter.Check(key)
			hrl.errorHandler(w, r, result)
			return
		}

		// Adicionar headers de rate limit
		result := hrl.rateLimiter.Check(key)
		hrl.addRateLimitHeaders(w, result)

		// Continuar com o próximo handler
		next.ServeHTTP(w, r)
	})
}

// shouldSkipPath verifica se um path deve ser ignorado
func (hrl *HTTPRateLimiter) shouldSkipPath(path string) bool {
	for _, skipPath := range hrl.skipPaths {
		if strings.HasPrefix(path, skipPath) {
			return true
		}
	}
	return false
}

// addRateLimitHeaders adiciona headers de rate limit à resposta
func (hrl *HTTPRateLimiter) addRateLimitHeaders(w http.ResponseWriter, result ratelimiter.Result) {
	w.Header().Set("X-RateLimit-Remaining", strconv.FormatInt(result.Remaining, 10))
	w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(result.ResetTime.Unix(), 10))
	
	if !result.ResetTime.IsZero() {
		w.Header().Set("X-RateLimit-Reset-After", strconv.FormatInt(int64(result.ResetTime.Sub(time.Now()).Seconds()), 10))
	}
}

// DefaultKeyExtractor extrator de chave padrão (baseado no IP)
func DefaultKeyExtractor(r *http.Request) string {
	// Tentar obter IP real através de headers de proxy
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Pegar o primeiro IP da lista
		if ips := strings.Split(xff, ","); len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}
	
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	
	// Fallback para RemoteAddr
	if ip := strings.Split(r.RemoteAddr, ":"); len(ip) > 0 {
		return ip[0]
	}
	
	return r.RemoteAddr
}

// UserKeyExtractor extrator baseado em usuário autenticado
func UserKeyExtractor(userIDHeader string) KeyExtractor {
	return func(r *http.Request) string {
		if userID := r.Header.Get(userIDHeader); userID != "" {
			return "user:" + userID
		}
		// Fallback para IP se não houver usuário
		return "ip:" + DefaultKeyExtractor(r)
	}
}

// APIKeyExtractor extrator baseado em chave de API
func APIKeyExtractor(apiKeyHeader string) KeyExtractor {
	return func(r *http.Request) string {
		if apiKey := r.Header.Get(apiKeyHeader); apiKey != "" {
			return "api:" + apiKey
		}
		// Fallback para IP se não houver API key
		return "ip:" + DefaultKeyExtractor(r)
	}
}

// CompositeKeyExtractor combina múltiplos extratores
func CompositeKeyExtractor(extractors ...KeyExtractor) KeyExtractor {
	return func(r *http.Request) string {
		parts := make([]string, 0, len(extractors))
		for _, extractor := range extractors {
			if key := extractor(r); key != "" {
				parts = append(parts, key)
			}
		}
		return strings.Join(parts, ":")
	}
}

// DefaultErrorHandler handler de erro padrão
func DefaultErrorHandler(w http.ResponseWriter, r *http.Request, result ratelimiter.Result) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-RateLimit-Remaining", "0")
	w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(result.ResetTime.Unix(), 10))
	
	if result.RetryAfter > 0 {
		w.Header().Set("Retry-After", strconv.FormatInt(int64(result.RetryAfter.Seconds()), 10))
	}
	
	w.WriteHeader(http.StatusTooManyRequests)
	
	errorResponse := fmt.Sprintf(`{
	"error": {
		"code": "RATE_LIMIT_EXCEEDED",
		"message": "Rate limit exceeded",
		"details": {
			"retry_after_seconds": %d,
			"reset_time": "%s"
		}
	}
}`, int64(result.RetryAfter.Seconds()), result.ResetTime.Format(time.RFC3339))
	
	w.Write([]byte(errorResponse))
}

// CustomErrorHandler cria um handler de erro personalizado
func CustomErrorHandler(statusCode int, message string) ErrorHandler {
	return func(w http.ResponseWriter, r *http.Request, result ratelimiter.Result) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-RateLimit-Remaining", "0")
		w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(result.ResetTime.Unix(), 10))
		
		if result.RetryAfter > 0 {
			w.Header().Set("Retry-After", strconv.FormatInt(int64(result.RetryAfter.Seconds()), 10))
		}
		
		w.WriteHeader(statusCode)
		
		errorResponse := fmt.Sprintf(`{
	"error": {
		"message": "%s",
		"retry_after_seconds": %d
	}
}`, message, int64(result.RetryAfter.Seconds()))
		
		w.Write([]byte(errorResponse))
	}
}

// RateLimit função de conveniência para criar middleware rapidamente
func RateLimit(rateLimiter ratelimiter.RateLimiter) func(http.Handler) http.Handler {
	middleware := NewHTTPRateLimiter(HTTPConfig{
		RateLimiter: rateLimiter,
	})
	
	return middleware.Middleware
}

// RateLimitWithConfig função de conveniência com configuração personalizada
func RateLimitWithConfig(config HTTPConfig) func(http.Handler) http.Handler {
	middleware := NewHTTPRateLimiter(config)
	return middleware.Middleware
}