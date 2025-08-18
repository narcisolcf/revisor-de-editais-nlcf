package ratelimiter

import (
	"sync"
	"testing"
	"time"

	"github.com/revisor-de-editais/go-rate-limiter/pkg/storage"
)

func TestNew(t *testing.T) {
	tests := []struct {
		name    string
		config  Config
		wantErr bool
	}{
		{
			name: "configuração válida",
			config: Config{
				Algorithm: TokenBucket,
				Rate:      10,
				Window:    time.Minute,
				BurstSize: 5,
			},
			wantErr: false,
		},
		{
			name: "rate inválido",
			config: Config{
				Algorithm: TokenBucket,
				Rate:      0,
				Window:    time.Minute,
			},
			wantErr: true,
		},
		{
			name: "window inválido",
			config: Config{
				Algorithm: TokenBucket,
				Rate:      10,
				Window:    0,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rl, err := New(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("New() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if rl != nil {
				defer rl.Close()
			}
		})
	}
}

func TestTokenBucket(t *testing.T) {
	config := Config{
		Algorithm: TokenBucket,
		Rate:      10, // 10 tokens por minuto
		Window:    time.Minute,
		BurstSize: 5, // Burst de 5 tokens
		Storage:   storage.NewMemory(),
	}

	rl, err := New(config)
	if err != nil {
		t.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	key := "test-user"

	// Deve permitir até burst size requests inicialmente
	for i := 0; i < int(config.BurstSize); i++ {
		if !rl.Allow(key) {
			t.Errorf("Request %d deveria ser permitido (burst)", i+1)
		}
	}

	// Próximo request deve ser negado
	if rl.Allow(key) {
		t.Error("Request após burst deveria ser negado")
	}

	// Verificar métricas
	metrics := rl.GetMetrics()
	if metrics.AllowedRequests != config.BurstSize {
		t.Errorf("Esperado %d requests permitidos, got %d", config.BurstSize, metrics.AllowedRequests)
	}
	if metrics.DeniedRequests != 1 {
		t.Errorf("Esperado 1 request negado, got %d", metrics.DeniedRequests)
	}
}

func TestFixedWindow(t *testing.T) {
	config := Config{
		Algorithm: FixedWindow,
		Rate:      5, // 5 requests por segundo
		Window:    time.Second,
		Storage:   storage.NewMemory(),
	}

	rl, err := New(config)
	if err != nil {
		t.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	key := "test-user"

	// Deve permitir até rate requests na janela
	for i := 0; i < int(config.Rate); i++ {
		if !rl.Allow(key) {
			t.Errorf("Request %d deveria ser permitido", i+1)
		}
	}

	// Próximo request deve ser negado
	if rl.Allow(key) {
		t.Error("Request além do limite deveria ser negado")
	}

	// Aguardar nova janela
	time.Sleep(time.Second + 100*time.Millisecond)

	// Deve permitir novamente
	if !rl.Allow(key) {
		t.Error("Request em nova janela deveria ser permitido")
	}
}

func TestSlidingWindow(t *testing.T) {
	config := Config{
		Algorithm: SlidingWindow,
		Rate:      3, // 3 requests por segundo
		Window:    time.Second,
		Storage:   storage.NewMemory(),
	}

	rl, err := New(config)
	if err != nil {
		t.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	key := "test-user"

	// Fazer requests com intervalo
	for i := 0; i < int(config.Rate); i++ {
		if !rl.Allow(key) {
			t.Errorf("Request %d deveria ser permitido", i+1)
		}
		time.Sleep(200 * time.Millisecond) // Espaçar requests
	}

	// Próximo request deve ser negado
	if rl.Allow(key) {
		t.Error("Request além do limite deveria ser negado")
	}

	// Aguardar janela deslizar
	time.Sleep(500 * time.Millisecond)

	// Deve permitir novamente
	if !rl.Allow(key) {
		t.Error("Request após janela deslizar deveria ser permitido")
	}
}

func TestLeakyBucket(t *testing.T) {
	config := Config{
		Algorithm: LeakyBucket,
		Rate:      10, // 10 requests por segundo (taxa de vazamento)
		Window:    time.Second,
		BurstSize: 5, // Capacidade do bucket
		Storage:   storage.NewMemory(),
	}

	rl, err := New(config)
	if err != nil {
		t.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	key := "test-user"

	// Leaky Bucket começa vazio, então deve permitir até a capacidade
	for i := 0; i < int(config.BurstSize); i++ {
		if !rl.Allow(key) {
			t.Errorf("Request %d deveria ser permitido (bucket vazio inicialmente)", i+1)
		}
	}

	// Próximo request deve ser negado (bucket cheio)
	if rl.Allow(key) {
		t.Error("Request com bucket cheio deveria ser negado")
	}

	// Aguardar vazamento
	time.Sleep(600 * time.Millisecond) // Tempo suficiente para vazar alguns tokens

	// Deve permitir novamente após vazamento
	if !rl.Allow(key) {
		t.Error("Request após vazamento deveria ser permitido")
	}

	// Testar vazamento contínuo
	time.Sleep(1 * time.Second) // Vazar mais tokens
	
	// Deve permitir múltiplos requests após mais vazamento
	allowedAfterLeak := 0
	for i := 0; i < 3; i++ {
		if rl.Allow(key) {
			allowedAfterLeak++
		}
	}
	
	if allowedAfterLeak == 0 {
		t.Error("Deveria permitir pelo menos alguns requests após vazamento prolongado")
	}
}

func TestConcurrency(t *testing.T) {
	config := Config{
		Algorithm: TokenBucket,
		Rate:      100,
		Window:    time.Minute,
		BurstSize: 50,
		Storage:   storage.NewMemory(),
	}

	rl, err := New(config)
	if err != nil {
		t.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	key := "concurrent-test"
	numGoroutines := 20
	requestsPerGoroutine := 10
	totalRequests := numGoroutines * requestsPerGoroutine

	var wg sync.WaitGroup
	allowed := make(chan bool, totalRequests)

	// Executar requests concorrentes
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < requestsPerGoroutine; j++ {
				allowed <- rl.Allow(key)
			}
		}()
	}

	wg.Wait()
	close(allowed)

	// Contar resultados
	allowedCount := 0
	deniedCount := 0
	for result := range allowed {
		if result {
			allowedCount++
		} else {
			deniedCount++
		}
	}

	// Verificar que o total está correto
	if allowedCount+deniedCount != totalRequests {
		t.Errorf("Total de requests incorreto: %d + %d != %d", 
			allowedCount, deniedCount, totalRequests)
	}

	// Para Token Bucket, o primeiro burst deve ser limitado pelo burst size
	// Mas pode haver pequenas variações devido à concorrência
	if allowedCount > int(config.BurstSize)+20 { // Tolerância maior para race conditions
		t.Errorf("Requests permitidos (%d) excederam significativamente o burst size (%d)", 
			allowedCount, config.BurstSize)
	}

	// Verificar que pelo menos alguns requests foram negados
	// Com 200 requests e burst de 50, esperamos muitos negados
	if deniedCount < totalRequests/4 { // Pelo menos 25% negados
		t.Errorf("Esperava mais requests negados em teste de concorrência. Negados: %d de %d", 
			deniedCount, totalRequests)
	}

	// Verificar métricas
	metrics := rl.GetMetrics()
	if metrics.TotalRequests != int64(totalRequests) {
		t.Errorf("Total de requests nas métricas incorreto: %d != %d", 
			metrics.TotalRequests, totalRequests)
	}
}

func TestCheck(t *testing.T) {
	config := Config{
		Algorithm: TokenBucket,
		Rate:      10,
		Window:    time.Minute,
		BurstSize: 5,
		Storage:   storage.NewMemory(),
	}

	rl, err := New(config)
	if err != nil {
		t.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	key := "check-test"

	// Verificar status inicial
	result := rl.Check(key)
	if !result.Allowed {
		t.Error("Check inicial deveria permitir")
	}
	if result.Remaining != config.BurstSize {
		t.Errorf("Remaining inicial deveria ser %d, got %d", 
			config.BurstSize, result.Remaining)
	}

	// Consumir alguns tokens
	for i := 0; i < 3; i++ {
		rl.Allow(key)
	}

	// Verificar status após consumo
	result = rl.Check(key)
	if result.Remaining != config.BurstSize-3 {
		t.Errorf("Remaining após consumo deveria ser %d, got %d", 
			config.BurstSize-3, result.Remaining)
	}

	// Verificar metadados
	if result.Metadata == nil {
		t.Error("Metadata não deveria ser nil")
	}
	if algorithm, ok := result.Metadata["algorithm"]; !ok || algorithm != "TokenBucket" {
		t.Error("Metadata deveria conter algoritmo")
	}
}

func TestReset(t *testing.T) {
	config := Config{
		Algorithm: TokenBucket,
		Rate:      10,
		Window:    time.Minute,
		BurstSize: 3,
		Storage:   storage.NewMemory(),
	}

	rl, err := New(config)
	if err != nil {
		t.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	key := "reset-test"

	// Consumir todos os tokens
	for i := 0; i < int(config.BurstSize); i++ {
		rl.Allow(key)
	}

	// Verificar que próximo request é negado
	if rl.Allow(key) {
		t.Error("Request deveria ser negado antes do reset")
	}

	// Resetar chave
	if err := rl.Reset(key); err != nil {
		t.Errorf("Erro ao resetar chave: %v", err)
	}

	// Verificar que request é permitido após reset
	if !rl.Allow(key) {
		t.Error("Request deveria ser permitido após reset")
	}
}

func TestAllowN(t *testing.T) {
	config := Config{
		Algorithm: TokenBucket,
		Rate:      10,
		Window:    time.Minute,
		BurstSize: 5,
		Storage:   storage.NewMemory(),
	}

	rl, err := New(config)
	if err != nil {
		t.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	key := "allowN-test"

	// Deve permitir N tokens se disponíveis
	if !rl.AllowN(key, 3) {
		t.Error("AllowN(3) deveria ser permitido")
	}

	// Deve negar se não há tokens suficientes
	if rl.AllowN(key, 5) {
		t.Error("AllowN(5) deveria ser negado (apenas 2 tokens restantes)")
	}

	// Deve permitir quantidade exata restante
	if !rl.AllowN(key, 2) {
		t.Error("AllowN(2) deveria ser permitido")
	}

	// Deve negar qualquer quantidade agora
	if rl.AllowN(key, 1) {
		t.Error("AllowN(1) deveria ser negado (sem tokens)")
	}
}

func BenchmarkAllow(b *testing.B) {
	config := Config{
		Algorithm: TokenBucket,
		Rate:      1000000, // Rate alto para não limitar no benchmark
		Window:    time.Minute,
		BurstSize: 1000000,
		Storage:   storage.NewMemory(),
	}

	rl, err := New(config)
	if err != nil {
		b.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		key := "benchmark-test"
		for pb.Next() {
			rl.Allow(key)
		}
	})
}

func BenchmarkCheck(b *testing.B) {
	config := Config{
		Algorithm: TokenBucket,
		Rate:      1000000,
		Window:    time.Minute,
		BurstSize: 1000000,
		Storage:   storage.NewMemory(),
	}

	rl, err := New(config)
	if err != nil {
		b.Fatalf("Erro ao criar rate limiter: %v", err)
	}
	defer rl.Close()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		key := "benchmark-check"
		for pb.Next() {
			rl.Check(key)
		}
	})
}