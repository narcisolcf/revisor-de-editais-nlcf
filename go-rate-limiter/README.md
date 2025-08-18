# Rate Limiter em Go

Um Rate Limiter (Limitador de Taxa) robusto e eficiente implementado em Go puro, utilizando apenas a biblioteca padrão.

## 📋 Características

- **Algoritmo Token Bucket**: Implementação eficiente para controle de taxa
- **Sliding Window**: Janela deslizante para controle preciso
- **Thread-Safe**: Seguro para uso concorrente
- **Configurável**: Múltiplas estratégias e configurações
- **Monitoramento**: Métricas e logs detalhados
- **Zero Dependências**: Apenas biblioteca padrão do Go

## 🚀 Funcionalidades

### Algoritmos Implementados
1. **Token Bucket** - Permite rajadas controladas
2. **Fixed Window** - Janela fixa de tempo
3. **Sliding Window** - Janela deslizante precisa
4. **Leaky Bucket** - Taxa constante de processamento

### Estratégias de Identificação
- Por IP
- Por usuário autenticado
- Por chave de API
- Personalizada

## 📁 Estrutura do Projeto

```
go-rate-limiter/
├── cmd/
│   ├── server/          # Servidor HTTP de exemplo
│   └── cli/             # CLI para testes
├── pkg/
│   ├── ratelimiter/     # Core do rate limiter
│   ├── algorithms/      # Algoritmos de rate limiting
│   ├── storage/         # Backends de armazenamento
│   └── middleware/      # Middleware HTTP
├── examples/            # Exemplos de uso
├── tests/              # Testes
└── docs/               # Documentação
```

## 🛠️ Instalação e Uso

```bash
# Clonar e entrar no diretório
cd go-rate-limiter

# Executar testes
go test ./...

# Executar servidor de exemplo
go run cmd/server/main.go

# Executar CLI de teste
go run cmd/cli/main.go
```

## 📖 Exemplos de Uso

### Uso Básico
```go
package main

import (
    "fmt"
    "time"
    "./pkg/ratelimiter"
)

func main() {
    // Criar rate limiter: 10 requests por minuto
    rl := ratelimiter.New(ratelimiter.Config{
        Algorithm: ratelimiter.TokenBucket,
        Rate:      10,
        Window:    time.Minute,
    })
    
    // Verificar se request é permitido
    if rl.Allow("user123") {
        fmt.Println("Request permitido")
    } else {
        fmt.Println("Rate limit excedido")
    }
}
```

### Middleware HTTP
```go
package main

import (
    "net/http"
    "./pkg/middleware"
    "./pkg/ratelimiter"
)

func main() {
    rl := ratelimiter.New(ratelimiter.Config{
        Algorithm: ratelimiter.SlidingWindow,
        Rate:      100,
        Window:    time.Hour,
    })
    
    mux := http.NewServeMux()
    mux.HandleFunc("/api/", apiHandler)
    
    // Aplicar middleware de rate limiting
    handler := middleware.RateLimit(rl)(mux)
    
    http.ListenAndServe(":8080", handler)
}
```

## 🧪 Testes

O projeto inclui testes abrangentes:

- Testes unitários para cada algoritmo
- Testes de concorrência
- Testes de performance
- Testes de integração

```bash
# Executar todos os testes
go test ./...

# Testes com verbose
go test -v ./...

# Testes de benchmark
go test -bench=. ./...

# Cobertura de testes
go test -cover ./...
```

## 📊 Performance

- **Latência**: < 1ms para operações Allow()
- **Throughput**: > 100k ops/sec
- **Memória**: Uso otimizado com cleanup automático
- **Concorrência**: Suporte a milhares de goroutines

## 🔧 Configuração Avançada

```go
config := ratelimiter.Config{
    Algorithm:    ratelimiter.TokenBucket,
    Rate:         1000,
    Window:       time.Hour,
    BurstSize:    100,
    CleanupInterval: time.Minute * 5,
    Storage:      storage.NewMemory(),
    KeyExtractor: func(r *http.Request) string {
        return r.Header.Get("X-API-Key")
    },
}
```

## 📈 Monitoramento

O rate limiter fornece métricas detalhadas:

- Requests permitidos/negados
- Latência das operações
- Uso de memória
- Taxa de limpeza

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.