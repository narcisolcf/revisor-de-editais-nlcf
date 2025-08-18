package main

import (
	"fmt"
	"time"

	"github.com/revisor-de-editais/go-rate-limiter/pkg/ratelimiter"
)

// Exemplos de diferentes configurações do Rate Limiter
func mainConfigExamples() {
	fmt.Println("⚙️  Exemplos de Configuração - Rate Limiter")
	fmt.Println("===========================================")

	// Exemplo 1: Configurações para diferentes tipos de API
	exampleAPIConfigurations()

	// Exemplo 2: Configurações por perfil de usuário
	exampleUserProfiles()

	// Exemplo 3: Configurações adaptativas
	exampleAdaptiveConfigurations()
}

// Exemplo 1: Configurações para diferentes tipos de API
func exampleAPIConfigurations() {
	fmt.Println("\n📋 Exemplo 1: Configurações por Tipo de API")
	fmt.Println("--------------------------------------------")

	// Configurações para diferentes endpoints
	configs := map[string]ratelimiter.Config{
		"public_api": {
			Algorithm: ratelimiter.TokenBucket,
			Rate:      100,              // 100 req/min
			Window:    time.Minute,
			BurstSize: 20,               // Permite rajadas de 20
		},
		"authenticated_api": {
			Algorithm: ratelimiter.SlidingWindow,
			Rate:      1000,             // 1000 req/hora
			Window:    time.Hour,
			BurstSize: 50,
		},
		"upload_api": {
			Algorithm: ratelimiter.FixedWindow,
			Rate:      10,               // 10 uploads/hora
			Window:    time.Hour,
		},
		"search_api": {
			Algorithm: ratelimiter.LeakyBucket,
			Rate:      30,               // 30 req/min
			Window:    time.Minute,
		},
		"admin_api": {
			Algorithm: ratelimiter.TokenBucket,
			Rate:      500,              // 500 req/min
			Window:    time.Minute,
			BurstSize: 100,
		},
	}

	// Descrições dos endpoints
	descriptions := map[string]string{
		"public_api":        "API pública com rate limit generoso",
		"authenticated_api": "API autenticada com limite por hora",
		"upload_api":        "API de upload com limite restritivo",
		"search_api":        "API de busca com processamento constante",
		"admin_api":         "API administrativa com limite alto",
	}

	for name, config := range configs {
		fmt.Printf("\n🔧 %s:\n", name)
		fmt.Printf("   Algoritmo: %s\n", getAlgorithmName(config.Algorithm))
		fmt.Printf("   Taxa: %d req/%s\n", config.Rate, getWindowName(config.Window))
		if config.BurstSize > 0 {
			fmt.Printf("   Burst: %d\n", config.BurstSize)
		}
		fmt.Printf("   Descrição: %s\n", descriptions[name])

		// Testar configuração
		rl, err := ratelimiter.New(config)
		if err != nil {
			fmt.Printf("   ❌ Erro: %v\n", err)
			continue
		}

		// Fazer alguns testes rápidos
		allowed := 0
		for i := 0; i < 5; i++ {
			if rl.Allow("test-user") {
				allowed++
			}
		}
		fmt.Printf("   ✅ Teste: %d/5 requests permitidos\n", allowed)
		rl.Close()
	}
}

// Exemplo 2: Configurações por perfil de usuário
func exampleUserProfiles() {
	fmt.Println("\n📋 Exemplo 2: Configurações por Perfil de Usuário")
	fmt.Println("-------------------------------------------------")

	// Diferentes perfis de usuário com limites específicos
	userProfiles := map[string]struct {
		config ratelimiter.Config
		description string
	}{
		"free_user": {
			config: ratelimiter.Config{
				Algorithm: ratelimiter.FixedWindow,
				Rate:      100,              // 100 req/dia
				Window:    24 * time.Hour,
			},
			description: "Limite básico para usuários gratuitos",
		},
		"premium_user": {
			config: ratelimiter.Config{
				Algorithm: ratelimiter.TokenBucket,
				Rate:      1000,             // 1000 req/hora
				Window:    time.Hour,
				BurstSize: 100,
			},
			description: "Limite generoso com rajadas para usuários premium",
		},
		"enterprise_user": {
			config: ratelimiter.Config{
				Algorithm: ratelimiter.SlidingWindow,
				Rate:      10000,            // 10k req/hora
				Window:    time.Hour,
				BurstSize: 500,
			},
			description: "Limite muito alto para clientes enterprise",
		},
		"api_partner": {
			config: ratelimiter.Config{
				Algorithm: ratelimiter.LeakyBucket,
				Rate:      5000,             // 5k req/hora
				Window:    time.Hour,
			},
			description: "Taxa constante para parceiros de integração",
		},
	}

	for profile, data := range userProfiles {
		fmt.Printf("\n👤 Perfil: %s\n", profile)
		fmt.Printf("   %s\n", data.description)
		fmt.Printf("   Algoritmo: %s\n", getAlgorithmName(data.config.Algorithm))
		fmt.Printf("   Taxa: %d req/%s\n", data.config.Rate, getWindowName(data.config.Window))
		if data.config.BurstSize > 0 {
			fmt.Printf("   Burst: %d\n", data.config.BurstSize)
		}

		// Simular uso por diferentes usuários
		rl, err := ratelimiter.New(data.config)
		if err != nil {
			fmt.Printf("   ❌ Erro: %v\n", err)
			continue
		}

		// Simular múltiplos usuários
		users := []string{"user1", "user2", "user3"}
		for _, user := range users {
			allowed := 0
			for i := 0; i < 10; i++ {
				if rl.Allow(user) {
					allowed++
				}
			}
			fmt.Printf("   📊 %s: %d/10 requests permitidos\n", user, allowed)
		}
		rl.Close()
	}
}

// Exemplo 3: Configurações adaptativas
func exampleAdaptiveConfigurations() {
	fmt.Println("\n📋 Exemplo 3: Configurações Adaptativas")
	fmt.Println("---------------------------------------")

	// Configurações que se adaptam a diferentes cenários
	scenarios := []struct {
		name        string
		config      ratelimiter.Config
		description string
		useCase     string
	}{
		{
			name: "peak_hours",
			config: ratelimiter.Config{
				Algorithm: ratelimiter.LeakyBucket,
				Rate:      50,               // Taxa reduzida
				Window:    time.Minute,
			},
			description: "Configuração restritiva para horários de pico",
			useCase:     "09:00-12:00 e 14:00-18:00",
		},
		{
			name: "off_hours",
			config: ratelimiter.Config{
				Algorithm: ratelimiter.TokenBucket,
				Rate:      200,              // Taxa mais generosa
				Window:    time.Minute,
				BurstSize: 50,
			},
			description: "Configuração mais permissiva fora do pico",
			useCase:     "18:00-09:00 e fins de semana",
		},
		{
			name: "maintenance_mode",
			config: ratelimiter.Config{
				Algorithm: ratelimiter.FixedWindow,
				Rate:      10,               // Muito restritivo
				Window:    time.Minute,
			},
			description: "Configuração muito restritiva durante manutenção",
			useCase:     "Durante atualizações do sistema",
		},
		{
			name: "emergency_mode",
			config: ratelimiter.Config{
				Algorithm: ratelimiter.FixedWindow,
				Rate:      5,                // Extremamente restritivo
				Window:    time.Minute,
			},
			description: "Configuração de emergência para proteger o sistema",
			useCase:     "Durante ataques DDoS ou sobrecarga",
		},
	}

	for _, scenario := range scenarios {
		fmt.Printf("\n🚨 Cenário: %s\n", scenario.name)
		fmt.Printf("   %s\n", scenario.description)
		fmt.Printf("   Caso de uso: %s\n", scenario.useCase)
		fmt.Printf("   Algoritmo: %s\n", getAlgorithmName(scenario.config.Algorithm))
		fmt.Printf("   Taxa: %d req/%s\n", scenario.config.Rate, getWindowName(scenario.config.Window))
		if scenario.config.BurstSize > 0 {
			fmt.Printf("   Burst: %d\n", scenario.config.BurstSize)
		}

		// Demonstrar comportamento
		rl, err := ratelimiter.New(scenario.config)
		if err != nil {
			fmt.Printf("   ❌ Erro: %v\n", err)
			continue
		}

		// Simular carga de trabalho
		allowed := 0
		denied := 0
		for i := 0; i < 20; i++ {
			if rl.Allow("load-test") {
				allowed++
			} else {
				denied++
			}
		}
		fmt.Printf("   📊 Resultado: %d permitidos, %d negados (de 20 requests)\n", allowed, denied)
		fmt.Printf("   📈 Taxa de sucesso: %.1f%%\n", float64(allowed)/20*100)
		rl.Close()
	}

	// Exemplo de como alternar configurações dinamicamente
	fmt.Println("\n💡 Dica: Configurações Dinâmicas")
	fmt.Println("--------------------------------")
	fmt.Println("Para implementar rate limiting adaptativo:")
	fmt.Println("1. Monitore métricas do sistema (CPU, memória, latência)")
	fmt.Println("2. Detecte padrões de tráfego (horários de pico)")
	fmt.Println("3. Ajuste configurações automaticamente")
	fmt.Println("4. Use circuit breakers para proteção adicional")
	fmt.Println("5. Implemente fallbacks graceful")
}

// Funções auxiliares para formatação
func getAlgorithmName(alg ratelimiter.Algorithm) string {
	switch alg {
	case ratelimiter.TokenBucket:
		return "Token Bucket"
	case ratelimiter.FixedWindow:
		return "Fixed Window"
	case ratelimiter.SlidingWindow:
		return "Sliding Window"
	case ratelimiter.LeakyBucket:
		return "Leaky Bucket"
	default:
		return "Desconhecido"
	}
}

func getWindowName(window time.Duration) string {
	switch {
	case window == time.Second:
		return "segundo"
	case window == time.Minute:
		return "minuto"
	case window == time.Hour:
		return "hora"
	case window == 24*time.Hour:
		return "dia"
	default:
		return window.String()
	}
}

// Exemplo de função para selecionar configuração baseada no horário
func getConfigForCurrentTime() ratelimiter.Config {
	hour := time.Now().Hour()
	
	// Horário de pico: 9-12 e 14-18
	if (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18) {
		return ratelimiter.Config{
			Algorithm: ratelimiter.LeakyBucket,
			Rate:      50,
			Window:    time.Minute,
		}
	}
	
	// Fora do horário de pico
	return ratelimiter.Config{
		Algorithm: ratelimiter.TokenBucket,
		Rate:      200,
		Window:    time.Minute,
		BurstSize: 50,
	}
}

// Exemplo de função para detectar sobrecarga do sistema
func getConfigForSystemLoad(cpuUsage, memoryUsage float64) ratelimiter.Config {
	// Sistema sob alta carga
	if cpuUsage > 80 || memoryUsage > 85 {
		return ratelimiter.Config{
			Algorithm: ratelimiter.FixedWindow,
			Rate:      10,
			Window:    time.Minute,
		}
	}
	
	// Sistema com carga moderada
	if cpuUsage > 60 || memoryUsage > 70 {
		return ratelimiter.Config{
			Algorithm: ratelimiter.LeakyBucket,
			Rate:      50,
			Window:    time.Minute,
		}
	}
	
	// Sistema com baixa carga
	return ratelimiter.Config{
		Algorithm: ratelimiter.TokenBucket,
		Rate:      200,
		Window:    time.Minute,
		BurstSize: 50,
	}
}