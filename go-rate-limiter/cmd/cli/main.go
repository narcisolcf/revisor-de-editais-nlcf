package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/revisor-de-editais/go-rate-limiter/pkg/ratelimiter"
)

func main() {
	fmt.Println("🚀 Rate Limiter CLI - Ferramenta de Teste")
	fmt.Println("========================================")
	
	// Configurar rate limiter padrão
	config := ratelimiter.Config{
		Algorithm:       ratelimiter.TokenBucket,
		Rate:            5, // 5 requests por minuto
		Window:          time.Minute,
		BurstSize:       3, // Permite rajadas de até 3 requests
		CleanupInterval: time.Minute,
	}
	
	rl, err := ratelimiter.New(config)
	if err != nil {
		fmt.Printf("❌ Erro ao criar rate limiter: %v\n", err)
		return
	}
	defer rl.Close()
	
	fmt.Printf("✅ Rate Limiter configurado: %s\n", config.Algorithm.String())
	fmt.Printf("📊 Limite: %d requests por %s (burst: %d)\n\n", 
		config.Rate, config.Window.String(), config.BurstSize)
	
	scanner := bufio.NewScanner(os.Stdin)
	
	for {
		printMenu()
		fmt.Print("Escolha uma opção: ")
		
		if !scanner.Scan() {
			break
		}
		
		input := strings.TrimSpace(scanner.Text())
		if input == "" {
			continue
		}
		
		switch input {
		case "1":
			testSingleRequest(rl)
		case "2":
			testMultipleRequests(rl, scanner)
		case "3":
			testBurstRequests(rl)
		case "4":
			checkStatus(rl, scanner)
		case "5":
			showMetrics(rl)
		case "6":
			resetKey(rl, scanner)
		case "7":
			changeAlgorithm(&rl, scanner)
		case "8":
			runLoadTest(rl, scanner)
		case "0", "q", "quit", "exit":
			fmt.Println("👋 Saindo...")
			return
		default:
			fmt.Println("❌ Opção inválida. Tente novamente.")
		}
		
		fmt.Println()
	}
}

func printMenu() {
	fmt.Println("📋 Menu de Opções:")
	fmt.Println("  1. Testar request único")
	fmt.Println("  2. Testar múltiplos requests")
	fmt.Println("  3. Testar burst de requests")
	fmt.Println("  4. Verificar status de uma chave")
	fmt.Println("  5. Mostrar métricas")
	fmt.Println("  6. Resetar chave")
	fmt.Println("  7. Trocar algoritmo")
	fmt.Println("  8. Teste de carga")
	fmt.Println("  0. Sair")
	fmt.Println()
}

func testSingleRequest(rl ratelimiter.RateLimiter) {
	key := "test-user"
	start := time.Now()
	
	allowed := rl.Allow(key)
	duration := time.Since(start)
	
	if allowed {
		fmt.Printf("✅ Request permitido para '%s' (latência: %v)\n", key, duration)
	} else {
		fmt.Printf("❌ Request negado para '%s' (latência: %v)\n", key, duration)
	}
	
	// Mostrar status atual
	result := rl.Check(key)
	fmt.Printf("📊 Status: %d restantes, reset em %s\n", 
		result.Remaining, 
		result.ResetTime.Format("15:04:05"))
}

func testMultipleRequests(rl ratelimiter.RateLimiter, scanner *bufio.Scanner) {
	fmt.Print("Quantos requests testar? (padrão: 10): ")
	scanner.Scan()
	input := strings.TrimSpace(scanner.Text())
	
	count := 10
	if input != "" {
		if parsed, err := strconv.Atoi(input); err == nil && parsed > 0 {
			count = parsed
		}
	}
	
	fmt.Print("Chave para testar (padrão: test-user): ")
	scanner.Scan()
	key := strings.TrimSpace(scanner.Text())
	if key == "" {
		key = "test-user"
	}
	
	fmt.Printf("🧪 Testando %d requests para '%s'...\n", count, key)
	
	allowed := 0
	denied := 0
	totalLatency := time.Duration(0)
	
	for i := 0; i < count; i++ {
		start := time.Now()
		if rl.Allow(key) {
			allowed++
			fmt.Printf("✅ Request %d: PERMITIDO\n", i+1)
		} else {
			denied++
			fmt.Printf("❌ Request %d: NEGADO\n", i+1)
		}
		totalLatency += time.Since(start)
		
		// Pequena pausa entre requests
		time.Sleep(100 * time.Millisecond)
	}
	
	fmt.Printf("\n📊 Resultados:\n")
	fmt.Printf("  ✅ Permitidos: %d\n", allowed)
	fmt.Printf("  ❌ Negados: %d\n", denied)
	fmt.Printf("  ⏱️  Latência média: %v\n", totalLatency/time.Duration(count))
}

func testBurstRequests(rl ratelimiter.RateLimiter) {
	key := "burst-test"
	count := 10
	
	fmt.Printf("💥 Testando burst de %d requests simultâneos para '%s'...\n", count, key)
	
	allowed := 0
	denied := 0
	start := time.Now()
	
	// Fazer todos os requests rapidamente
	for i := 0; i < count; i++ {
		if rl.Allow(key) {
			allowed++
			fmt.Printf("✅ ")
		} else {
			denied++
			fmt.Printf("❌ ")
		}
	}
	
	totalTime := time.Since(start)
	fmt.Printf("\n\n📊 Resultados do burst:\n")
	fmt.Printf("  ✅ Permitidos: %d\n", allowed)
	fmt.Printf("  ❌ Negados: %d\n", denied)
	fmt.Printf("  ⏱️  Tempo total: %v\n", totalTime)
	fmt.Printf("  🚀 Taxa: %.2f req/s\n", float64(count)/totalTime.Seconds())
}

func checkStatus(rl ratelimiter.RateLimiter, scanner *bufio.Scanner) {
	fmt.Print("Chave para verificar (padrão: test-user): ")
	scanner.Scan()
	key := strings.TrimSpace(scanner.Text())
	if key == "" {
		key = "test-user"
	}
	
	result := rl.Check(key)
	
	fmt.Printf("📊 Status da chave '%s':\n", key)
	fmt.Printf("  🟢 Permitido: %t\n", result.Allowed)
	fmt.Printf("  📈 Restantes: %d\n", result.Remaining)
	fmt.Printf("  🔄 Reset em: %s\n", result.ResetTime.Format("15:04:05"))
	
	if result.RetryAfter > 0 {
		fmt.Printf("  ⏳ Tentar novamente em: %v\n", result.RetryAfter)
	}
	
	if len(result.Metadata) > 0 {
		fmt.Printf("  📋 Metadados:\n")
		for key, value := range result.Metadata {
			fmt.Printf("    %s: %v\n", key, value)
		}
	}
}

func showMetrics(rl ratelimiter.RateLimiter) {
	metrics := rl.GetMetrics()
	
	fmt.Println("📊 Métricas do Rate Limiter:")
	fmt.Printf("  📈 Total de requests: %d\n", metrics.TotalRequests)
	fmt.Printf("  ✅ Requests permitidos: %d\n", metrics.AllowedRequests)
	fmt.Printf("  ❌ Requests negados: %d\n", metrics.DeniedRequests)
	fmt.Printf("  ⏱️  Latência média: %v\n", metrics.AverageLatency)
	fmt.Printf("  🔑 Chaves ativas: %d\n", metrics.ActiveKeys)
	
	if !metrics.LastCleanup.IsZero() {
		fmt.Printf("  🧹 Último cleanup: %s\n", metrics.LastCleanup.Format("15:04:05"))
	}
	
	if metrics.TotalRequests > 0 {
		successRate := float64(metrics.AllowedRequests) / float64(metrics.TotalRequests) * 100
		fmt.Printf("  📊 Taxa de sucesso: %.2f%%\n", successRate)
	}
}

func resetKey(rl ratelimiter.RateLimiter, scanner *bufio.Scanner) {
	fmt.Print("Chave para resetar: ")
	scanner.Scan()
	key := strings.TrimSpace(scanner.Text())
	
	if key == "" {
		fmt.Println("❌ Chave não pode estar vazia")
		return
	}
	
	if err := rl.Reset(key); err != nil {
		fmt.Printf("❌ Erro ao resetar chave '%s': %v\n", key, err)
	} else {
		fmt.Printf("✅ Chave '%s' resetada com sucesso\n", key)
	}
}

func changeAlgorithm(rl *ratelimiter.RateLimiter, scanner *bufio.Scanner) {
	fmt.Println("🔄 Algoritmos disponíveis:")
	fmt.Println("  1. Token Bucket")
	fmt.Println("  2. Fixed Window")
	fmt.Println("  3. Sliding Window")
	fmt.Println("  4. Leaky Bucket")
	fmt.Print("Escolha um algoritmo (1-4): ")
	
	scanner.Scan()
	input := strings.TrimSpace(scanner.Text())
	
	var algorithm ratelimiter.Algorithm
	switch input {
	case "1":
		algorithm = ratelimiter.TokenBucket
	case "2":
		algorithm = ratelimiter.FixedWindow
	case "3":
		algorithm = ratelimiter.SlidingWindow
	case "4":
		algorithm = ratelimiter.LeakyBucket
	default:
		fmt.Println("❌ Opção inválida")
		return
	}
	
	// Fechar rate limiter atual
	(*rl).Close()
	
	// Criar novo rate limiter com algoritmo escolhido
	config := ratelimiter.Config{
		Algorithm:       algorithm,
		Rate:            5,
		Window:          time.Minute,
		BurstSize:       3,
		CleanupInterval: time.Minute,
	}
	
	newRL, err := ratelimiter.New(config)
	if err != nil {
		fmt.Printf("❌ Erro ao criar novo rate limiter: %v\n", err)
		return
	}
	
	*rl = newRL
	fmt.Printf("✅ Algoritmo alterado para: %s\n", algorithm.String())
}

func runLoadTest(rl ratelimiter.RateLimiter, scanner *bufio.Scanner) {
	fmt.Print("Número de requests para o teste de carga (padrão: 100): ")
	scanner.Scan()
	input := strings.TrimSpace(scanner.Text())
	
	count := 100
	if input != "" {
		if parsed, err := strconv.Atoi(input); err == nil && parsed > 0 {
			count = parsed
		}
	}
	
	fmt.Print("Intervalo entre requests em ms (padrão: 50): ")
	scanner.Scan()
	input = strings.TrimSpace(scanner.Text())
	
	interval := 50
	if input != "" {
		if parsed, err := strconv.Atoi(input); err == nil && parsed >= 0 {
			interval = parsed
		}
	}
	
	fmt.Printf("🚀 Iniciando teste de carga: %d requests com intervalo de %dms\n", count, interval)
	fmt.Println("Pressione Ctrl+C para interromper...")
	
	allowed := 0
	denied := 0
	start := time.Now()
	
	for i := 0; i < count; i++ {
		key := fmt.Sprintf("load-test-%d", i%10) // Usar 10 chaves diferentes
		
		if rl.Allow(key) {
			allowed++
			fmt.Print("✅")
		} else {
			denied++
			fmt.Print("❌")
		}
		
		if (i+1)%50 == 0 {
			fmt.Printf(" [%d/%d]\n", i+1, count)
		}
		
		if interval > 0 {
			time.Sleep(time.Duration(interval) * time.Millisecond)
		}
	}
	
	totalTime := time.Since(start)
	fmt.Printf("\n\n📊 Resultados do teste de carga:\n")
	fmt.Printf("  📈 Total: %d requests\n", count)
	fmt.Printf("  ✅ Permitidos: %d (%.2f%%)\n", allowed, float64(allowed)/float64(count)*100)
	fmt.Printf("  ❌ Negados: %d (%.2f%%)\n", denied, float64(denied)/float64(count)*100)
	fmt.Printf("  ⏱️  Tempo total: %v\n", totalTime)
	fmt.Printf("  🚀 Taxa média: %.2f req/s\n", float64(count)/totalTime.Seconds())
	
	// Mostrar métricas finais
	fmt.Println("\n📊 Métricas finais:")
	showMetrics(rl)
}