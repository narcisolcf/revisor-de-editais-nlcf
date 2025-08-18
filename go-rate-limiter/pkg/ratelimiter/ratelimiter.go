package ratelimiter

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/revisor-de-editais/go-rate-limiter/pkg/storage"
)

// rateLimiter implementação principal do RateLimiter
type rateLimiter struct {
	config  Config
	storage Storage
	mu      sync.RWMutex
	metrics Metrics
	closed  bool
	cancel  context.CancelFunc
	keyMutexes sync.Map // map[string]*sync.Mutex para sincronização por chave
}

// New cria uma nova instância do rate limiter
func New(config Config) (RateLimiter, error) {
	if err := validateConfig(config); err != nil {
		return nil, fmt.Errorf("configuração inválida: %w", err)
	}

	// Usar storage padrão se não especificado
	if config.Storage == nil {
		config.Storage = storage.NewMemory()
	}

	// Usar extrator de chave padrão se não especificado
	if config.KeyExtractor == nil {
		config.KeyExtractor = defaultKeyExtractor
	}

	ctx, cancel := context.WithCancel(context.Background())

	rl := &rateLimiter{
		config:  config,
		storage: config.Storage,
		cancel:  cancel,
	}

	// Iniciar goroutine de limpeza se intervalo configurado
	if config.CleanupInterval > 0 {
		go rl.cleanupLoop(ctx)
	}

	return rl, nil
}

// Allow verifica se um request é permitido para a chave dada
func (rl *rateLimiter) Allow(key string) bool {
	return rl.AllowN(key, 1)
}

// AllowN verifica se N requests são permitidos para a chave dada
func (rl *rateLimiter) AllowN(key string, n int64) bool {
	if rl.closed {
		return false
	}

	start := time.Now()
	defer func() {
		rl.updateMetrics(time.Since(start))
	}()

	// Extrair chave usando função configurada
	extractedKey := rl.config.KeyExtractor(key)

	// Verificar rate limit baseado no algoritmo
	switch rl.config.Algorithm {
	case TokenBucket:
		return rl.allowTokenBucket(extractedKey, n)
	case FixedWindow:
		return rl.allowFixedWindow(extractedKey, n)
	case SlidingWindow:
		return rl.allowSlidingWindow(extractedKey, n)
	case LeakyBucket:
		return rl.allowLeakyBucket(extractedKey, n)
	default:
		return false
	}
}

// Check verifica o status sem consumir tokens
func (rl *rateLimiter) Check(key string) Result {
	if rl.closed {
		return Result{Allowed: false}
	}

	extractedKey := rl.config.KeyExtractor(key)

	switch rl.config.Algorithm {
	case TokenBucket:
		return rl.checkTokenBucket(extractedKey)
	case FixedWindow:
		return rl.checkFixedWindow(extractedKey)
	case SlidingWindow:
		return rl.checkSlidingWindow(extractedKey)
	case LeakyBucket:
		return rl.checkLeakyBucket(extractedKey)
	default:
		return Result{Allowed: false}
	}
}

// Reset reseta o contador para a chave dada
func (rl *rateLimiter) Reset(key string) error {
	if rl.closed {
		return fmt.Errorf("rate limiter está fechado")
	}

	extractedKey := rl.config.KeyExtractor(key)
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	return rl.storage.Delete(ctx, extractedKey)
}

// Close fecha o rate limiter e limpa recursos
func (rl *rateLimiter) Close() error {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	if rl.closed {
		return nil
	}

	rl.closed = true
	rl.cancel()

	if rl.storage != nil {
		return rl.storage.Close()
	}

	return nil
}

// GetMetrics retorna as métricas atuais
func (rl *rateLimiter) GetMetrics() Metrics {
	rl.mu.RLock()
	defer rl.mu.RUnlock()
	return rl.metrics
}

// validateConfig valida a configuração fornecida
func validateConfig(config Config) error {
	if config.Rate <= 0 {
		return fmt.Errorf("rate deve ser maior que zero")
	}

	if config.Window <= 0 {
		return fmt.Errorf("window deve ser maior que zero")
	}

	if config.Algorithm == TokenBucket && config.BurstSize <= 0 {
		config.BurstSize = config.Rate // Usar rate como burst size padrão
	}

	return nil
}

// defaultKeyExtractor extrator de chave padrão
func defaultKeyExtractor(key string) string {
	return key
}

// updateMetrics atualiza as métricas do rate limiter
func (rl *rateLimiter) updateMetrics(latency time.Duration) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	rl.metrics.TotalRequests++
	
	// Calcular latência média usando média móvel simples
	if rl.metrics.TotalRequests == 1 {
		rl.metrics.AverageLatency = latency
	} else {
		// Média móvel exponencial com fator de suavização 0.1
		alpha := 0.1
		rl.metrics.AverageLatency = time.Duration(
			float64(rl.metrics.AverageLatency)*(1-alpha) + float64(latency)*alpha,
		)
	}
}

// cleanupLoop executa limpeza periódica de dados expirados
func (rl *rateLimiter) cleanupLoop(ctx context.Context) {
	ticker := time.NewTicker(rl.config.CleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			rl.performCleanup()
		}
	}
}

// performCleanup executa a limpeza de dados expirados
func (rl *rateLimiter) performCleanup() {
	rl.mu.Lock()
	rl.metrics.LastCleanup = time.Now()
	rl.mu.Unlock()

	// A limpeza específica depende do backend de storage
	// Para storage em memória, isso será implementado no próprio storage
}

// bucketData representa os dados do token bucket
type bucketData struct {
	Tokens    float64   `json:"tokens"`
	LastRefill time.Time `json:"last_refill"`
}

// windowData representa os dados da janela
type windowData struct {
	Count     int64     `json:"count"`
	WindowStart time.Time `json:"window_start"`
	Requests  []time.Time `json:"requests,omitempty"` // Para sliding window
}

// getBucketData recupera dados do bucket do storage
func (rl *rateLimiter) getBucketData(key string) (*bucketData, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()

	data, err := rl.storage.Get(ctx, key)
	if err != nil {
		// Se não existe, criar novo bucket
		// Deixar LastRefill como zero para que cada algoritmo implemente sua própria inicialização
		return &bucketData{
			Tokens:     0,
			LastRefill: time.Time{}, // Zero time para indicar bucket novo
		}, nil
	}

	var bucket bucketData
	if err := json.Unmarshal(data, &bucket); err != nil {
		return nil, fmt.Errorf("erro ao deserializar bucket data: %w", err)
	}

	return &bucket, nil
}

// setBucketData armazena dados do bucket no storage
func (rl *rateLimiter) setBucketData(key string, bucket *bucketData) error {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()

	data, err := json.Marshal(bucket)
	if err != nil {
		return fmt.Errorf("erro ao serializar bucket data: %w", err)
	}

	// TTL baseado na janela de tempo configurada
	ttl := rl.config.Window * 2
	return rl.storage.Set(ctx, key, data, ttl)
}

// getWindowData recupera dados da janela do storage
func (rl *rateLimiter) getWindowData(key string) (*windowData, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()

	data, err := rl.storage.Get(ctx, key)
	if err != nil {
		// Se não existe, criar nova janela
		return &windowData{
			Count:       0,
			WindowStart: time.Now(),
			Requests:    make([]time.Time, 0),
		}, nil
	}

	var window windowData
	if err := json.Unmarshal(data, &window); err != nil {
		return nil, fmt.Errorf("erro ao deserializar window data: %w", err)
	}

	return &window, nil
}

// setWindowData armazena dados da janela no storage
func (rl *rateLimiter) setWindowData(key string, window *windowData) error {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()

	data, err := json.Marshal(window)
	if err != nil {
		return fmt.Errorf("erro ao serializar window data: %w", err)
	}

	// TTL baseado na janela de tempo configurada
	ttl := rl.config.Window * 2
	return rl.storage.Set(ctx, key, data, ttl)
}

// getKeyMutex obtém ou cria um mutex para uma chave específica
func (rl *rateLimiter) getKeyMutex(key string) *sync.Mutex {
	value, _ := rl.keyMutexes.LoadOrStore(key, &sync.Mutex{})
	return value.(*sync.Mutex)
}