package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/revisor-de-editais/go-rate-limiter/pkg/middleware"
	"github.com/revisor-de-editais/go-rate-limiter/pkg/ratelimiter"
)

// Response estrutura padrão de resposta da API
type Response struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// StatusResponse resposta do endpoint de status
type StatusResponse struct {
	Server    string                 `json:"server"`
	Version   string                 `json:"version"`
	Uptime    string                 `json:"uptime"`
	Metrics   ratelimiter.Metrics    `json:"metrics"`
	Algorithm string                 `json:"algorithm"`
	Config    map[string]interface{} `json:"config"`
}

var (
	startTime   = time.Now()
	rateLimiter ratelimiter.RateLimiter
	rlConfig    ratelimiter.Config
)

func main() {
	// Configurar rate limiter
	var err error
	rlConfig = ratelimiter.Config{
		Algorithm:       ratelimiter.TokenBucket,
		Rate:            10, // 10 requests por minuto
		Window:          time.Minute,
		BurstSize:       5, // Permite rajadas de até 5 requests
		CleanupInterval: time.Minute * 2,
	}

	rateLimiter, err = ratelimiter.New(rlConfig)
	if err != nil {
		log.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rateLimiter.Close()

	// Configurar rotas
	mux := http.NewServeMux()
	
	// Rotas públicas (sem rate limiting)
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/metrics", metricsHandler)
	
	// Rotas com rate limiting
	apiMux := http.NewServeMux()
	apiMux.HandleFunc("/api/hello", helloHandler)
	apiMux.HandleFunc("/api/data", dataHandler)
	apiMux.HandleFunc("/api/upload", uploadHandler)
	apiMux.HandleFunc("/api/status", statusHandler)
	
	// Aplicar middleware de rate limiting apenas nas rotas da API
	rlMiddleware := middleware.NewHTTPRateLimiter(middleware.HTTPConfig{
		RateLimiter: rateLimiter,
		KeyExtractor: middleware.DefaultKeyExtractor,
		SkipPaths:   []string{"/health", "/metrics"},
	})
	
	// Combinar rotas
	mux.Handle("/api/", rlMiddleware.Middleware(apiMux))
	
	// Adicionar middleware de logging
	handler := loggingMiddleware(mux)
	
	port := ":8080"
	fmt.Printf("🚀 Servidor iniciado na porta %s\n", port)
	fmt.Printf("📊 Rate Limiter: %s - %d req/%s (burst: %d)\n", 
		rlConfig.Algorithm.String(), 
		rlConfig.Rate, 
		rlConfig.Window.String(), 
		rlConfig.BurstSize)
	fmt.Println("\n📋 Endpoints disponíveis:")
	fmt.Println("  GET  /health        - Health check (sem rate limit)")
	fmt.Println("  GET  /metrics       - Métricas do sistema (sem rate limit)")
	fmt.Println("  GET  /api/hello     - Endpoint simples (com rate limit)")
	fmt.Println("  GET  /api/data      - Dados de exemplo (com rate limit)")
	fmt.Println("  POST /api/upload    - Upload de dados (com rate limit)")
	fmt.Println("  GET  /api/status    - Status detalhado (com rate limit)")
	fmt.Println("\n💡 Teste o rate limiting fazendo múltiplas requisições rapidamente!")
	
	log.Fatal(http.ListenAndServe(port, handler))
}

// healthHandler endpoint de health check
func healthHandler(w http.ResponseWriter, r *http.Request) {
	response := Response{
		Success:   true,
		Message:   "Servidor funcionando normalmente",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"status": "healthy",
			"uptime": time.Since(startTime).String(),
		},
	}
	
	respondJSON(w, http.StatusOK, response)
}

// metricsHandler endpoint de métricas
func metricsHandler(w http.ResponseWriter, r *http.Request) {
	metrics := rateLimiter.GetMetrics()
	
	response := Response{
		Success:   true,
		Message:   "Métricas do rate limiter",
		Timestamp: time.Now(),
		Data:      metrics,
	}
	
	respondJSON(w, http.StatusOK, response)
}

// helloHandler endpoint simples
func helloHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		name = "Mundo"
	}
	
	response := Response{
		Success:   true,
		Message:   fmt.Sprintf("Olá, %s!", name),
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"greeting": fmt.Sprintf("Olá, %s!", name),
			"ip":       middleware.DefaultKeyExtractor(r),
		},
	}
	
	respondJSON(w, http.StatusOK, response)
}

// dataHandler endpoint que retorna dados de exemplo
func dataHandler(w http.ResponseWriter, r *http.Request) {
	limit := 10
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	
	// Simular dados
	data := make([]map[string]interface{}, limit)
	for i := 0; i < limit; i++ {
		data[i] = map[string]interface{}{
			"id":        i + 1,
			"name":      fmt.Sprintf("Item %d", i+1),
			"value":     (i + 1) * 10,
			"timestamp": time.Now().Add(time.Duration(i) * time.Second),
		}
	}
	
	response := Response{
		Success:   true,
		Message:   fmt.Sprintf("Retornando %d itens", limit),
		Timestamp: time.Now(),
		Data:      data,
	}
	
	respondJSON(w, http.StatusOK, response)
}

// uploadHandler endpoint de upload (simulado)
func uploadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}
	
	// Simular processamento de upload
	time.Sleep(100 * time.Millisecond)
	
	response := Response{
		Success:   true,
		Message:   "Upload processado com sucesso",
		Timestamp: time.Now(),
		Data: map[string]interface{}{
			"file_id":     fmt.Sprintf("file_%d", time.Now().Unix()),
			"size":        "1.2MB",
			"processed_at": time.Now(),
			"status":      "completed",
		},
	}
	
	respondJSON(w, http.StatusOK, response)
}

// statusHandler endpoint de status detalhado
func statusHandler(w http.ResponseWriter, r *http.Request) {
	metrics := rateLimiter.GetMetrics()
	
	status := StatusResponse{
		Server:    "Rate Limiter Demo Server",
		Version:   "1.0.0",
		Uptime:    time.Since(startTime).String(),
		Metrics:   metrics,
		Algorithm: rlConfig.Algorithm.String(),
		Config: map[string]interface{}{
			"rate":             rlConfig.Rate,
			"window":           rlConfig.Window.String(),
			"burst_size":       rlConfig.BurstSize,
			"cleanup_interval": rlConfig.CleanupInterval.String(),
		},
	}
	
	response := Response{
		Success:   true,
		Message:   "Status do servidor",
		Timestamp: time.Now(),
		Data:      status,
	}
	
	respondJSON(w, http.StatusOK, response)
}

// respondJSON helper para responder com JSON
func respondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Erro ao codificar JSON: %v", err)
	}
}

// loggingMiddleware middleware de logging
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Wrapper para capturar status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		next.ServeHTTP(wrapped, r)
		
		duration := time.Since(start)
		clientIP := middleware.DefaultKeyExtractor(r)
		
		log.Printf("%s %s %s %d %v",
			r.Method,
			r.URL.Path,
			clientIP,
			wrapped.statusCode,
			duration,
		)
	})
}

// responseWriter wrapper para capturar status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}