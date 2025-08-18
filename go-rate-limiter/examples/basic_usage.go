package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/revisor-de-editais/go-rate-limiter/pkg/middleware"
	"github.com/revisor-de-editais/go-rate-limiter/pkg/ratelimiter"
)

// Exemplo básico de uso do Rate Limiter
func main() {
	fmt.Println("🚀 Exemplo Básico - Rate Limiter em Go")
	fmt.Println("=====================================")

	// Exemplo 1: Uso direto do Rate Limiter
	exampleDirectUsage()

	// Exemplo 2: Rate Limiter com diferentes algoritmos
	exampleDifferentAlgorithms()

	// Exemplo 3: Servidor HTTP com Rate Limiting
	exampleHTTPServer()
}

// Exemplo 1: Uso direto do Rate Limiter
func exampleDirectUsage() {
	fmt.Println("\n📋 Exemplo 1: Uso Direto do Rate Limiter")
	fmt.Println("----------------------------------------")

	// Configurar rate limiter: 5 requests por minuto, burst de 3
	config := ratelimiter.Config{
		Algorithm: ratelimiter.TokenBucket,
		Rate:      5,
		Window:    time.Minute,
		BurstSize: 3,
	}

	rl, err := ratelimiter.New(config)
	if err != nil {
		log.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	userID := "user123"

	// Simular requests
	fmt.Printf("Testando rate limiter para usuário: %s\n", userID)
	fmt.Printf("Configuração: %d req/min, burst: %d\n\n", config.Rate, config.BurstSize)

	for i := 1; i <= 6; i++ {
		start := time.Now()
		allowed := rl.Allow(userID)
		latency := time.Since(start)

		if allowed {
			fmt.Printf("✅ Request %d: PERMITIDO (latência: %v)\n", i, latency)
		} else {
			fmt.Printf("❌ Request %d: NEGADO (latência: %v)\n", i, latency)
			
			// Verificar quando poderá tentar novamente
			result := rl.Check(userID)
			if result.RetryAfter > 0 {
				fmt.Printf("   ⏳ Tentar novamente em: %v\n", result.RetryAfter)
			}
		}

		// Mostrar status atual
		result := rl.Check(userID)
		fmt.Printf("   📊 Restantes: %d, Reset: %s\n\n", 
			result.Remaining, 
			result.ResetTime.Format("15:04:05"))

		time.Sleep(100 * time.Millisecond)
	}

	// Mostrar métricas finais
	metrics := rl.GetMetrics()
	fmt.Printf("📊 Métricas finais:\n")
	fmt.Printf("   Total: %d, Permitidos: %d, Negados: %d\n", 
		metrics.TotalRequests, metrics.AllowedRequests, metrics.DeniedRequests)
	fmt.Printf("   Latência média: %v\n", metrics.AverageLatency)
}

// Exemplo 2: Rate Limiter com diferentes algoritmos
func exampleDifferentAlgorithms() {
	fmt.Println("\n📋 Exemplo 2: Diferentes Algoritmos")
	fmt.Println("----------------------------------")

	algorithms := []struct {
		name      string
		algorithm ratelimiter.Algorithm
		description string
	}{
		{"Token Bucket", ratelimiter.TokenBucket, "Permite rajadas controladas"},
		{"Fixed Window", ratelimiter.FixedWindow, "Janela fixa de tempo"},
		{"Sliding Window", ratelimiter.SlidingWindow, "Janela deslizante precisa"},
		{"Leaky Bucket", ratelimiter.LeakyBucket, "Taxa constante de processamento"},
	}

	for _, alg := range algorithms {
		fmt.Printf("\n🔧 Testando: %s\n", alg.name)
		fmt.Printf("   %s\n", alg.description)

		config := ratelimiter.Config{
			Algorithm: alg.algorithm,
			Rate:      3, // 3 requests por segundo
			Window:    time.Second,
			BurstSize: 2,
		}

		rl, err := ratelimiter.New(config)
		if err != nil {
			fmt.Printf("   ❌ Erro: %v\n", err)
			continue
		}

		userID := "test-user"
		allowed := 0
		denied := 0

		// Fazer 5 requests rapidamente
		for i := 0; i < 5; i++ {
			if rl.Allow(userID) {
				allowed++
				fmt.Print("✅ ")
			} else {
				denied++
				fmt.Print("❌ ")
			}
		}

		fmt.Printf("\n   Resultado: %d permitidos, %d negados\n", allowed, denied)
		rl.Close()
	}
}

// Exemplo 3: Servidor HTTP com Rate Limiting
func exampleHTTPServer() {
	fmt.Println("\n📋 Exemplo 3: Servidor HTTP com Rate Limiting")
	fmt.Println("---------------------------------------------")

	// Configurar rate limiter para API
	apiRateLimit, err := ratelimiter.New(ratelimiter.Config{
		Algorithm: ratelimiter.TokenBucket,
		Rate:      10, // 10 requests por minuto
		Window:    time.Minute,
		BurstSize: 5,
	})
	if err != nil {
		log.Fatalf("Erro ao criar rate limiter da API: %v", err)
	}
	defer apiRateLimit.Close()

	// Configurar rate limiter para uploads (mais restritivo)
	uploadRateLimit, err := ratelimiter.New(ratelimiter.Config{
		Algorithm: ratelimiter.FixedWindow,
		Rate:      3, // 3 uploads por minuto
		Window:    time.Minute,
	})
	if err != nil {
		log.Fatalf("Erro ao criar rate limiter de upload: %v", err)
	}
	defer uploadRateLimit.Close()

	// Configurar rotas
	mux := http.NewServeMux()

	// Rota pública (sem rate limiting)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "healthy", "timestamp": "` + time.Now().Format(time.RFC3339) + `"}`))
	})

	// Rotas da API com rate limiting geral
	apiMux := http.NewServeMux()
	apiMux.HandleFunc("/api/data", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message": "Dados da API", "timestamp": "` + time.Now().Format(time.RFC3339) + `"}`))
	})

	// Rota de upload com rate limiting específico
	uploadMux := http.NewServeMux()
	uploadMux.HandleFunc("/api/upload", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}
		
		// Simular processamento de upload
		time.Sleep(100 * time.Millisecond)
		
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message": "Upload processado", "file_id": "` + 
			fmt.Sprintf("file_%d", time.Now().Unix()) + `"}`))
	})

	// Aplicar middlewares de rate limiting
	apiMiddleware := middleware.NewHTTPRateLimiter(middleware.HTTPConfig{
		RateLimiter: apiRateLimit,
		KeyExtractor: middleware.DefaultKeyExtractor,
	})

	uploadMiddleware := middleware.NewHTTPRateLimiter(middleware.HTTPConfig{
		RateLimiter: uploadRateLimit,
		KeyExtractor: middleware.DefaultKeyExtractor,
		ErrorHandler: middleware.CustomErrorHandler(http.StatusTooManyRequests, 
			"Muitos uploads. Tente novamente mais tarde."),
	})

	// Combinar rotas
	mux.Handle("/api/upload", uploadMiddleware.Middleware(uploadMux))
	mux.Handle("/api/", apiMiddleware.Middleware(apiMux))

	// Middleware de logging
	handler := loggingMiddleware(mux)

	port := ":8081"
	fmt.Printf("\n🌐 Servidor HTTP iniciado na porta %s\n", port)
	fmt.Println("\n📋 Endpoints disponíveis:")
	fmt.Println("  GET  /health      - Health check (sem rate limit)")
	fmt.Println("  GET  /api/data    - API geral (10 req/min, burst 5)")
	fmt.Println("  POST /api/upload  - Upload (3 req/min)")
	fmt.Println("\n💡 Teste fazendo múltiplas requisições:")
	fmt.Println("  curl http://localhost:8081/health")
	fmt.Println("  curl http://localhost:8081/api/data")
	fmt.Println("  curl -X POST http://localhost:8081/api/upload")
	fmt.Println("\n⏹️  Pressione Ctrl+C para parar o servidor")

	log.Fatal(http.ListenAndServe(port, handler))
}

// loggingMiddleware middleware simples de logging
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Wrapper para capturar status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		next.ServeHTTP(wrapped, r)
		
		duration := time.Since(start)
		clientIP := middleware.DefaultKeyExtractor(r)
		
		fmt.Printf("[%s] %s %s %s %d %v\n",
			time.Now().Format("15:04:05"),
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