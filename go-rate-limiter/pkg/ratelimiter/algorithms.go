package ratelimiter

import (
	"math"
	"time"
)

// allowTokenBucket implementa o algoritmo Token Bucket
func (rl *rateLimiter) allowTokenBucket(key string, n int64) bool {
	// Sincronizar acesso por chave para evitar race conditions
	keyMutex := rl.getKeyMutex(key)
	keyMutex.Lock()
	defer keyMutex.Unlock()
	
	bucket, err := rl.getBucketData(key)
	if err != nil {
		return false
	}

	now := time.Now()
	
	// Para novos buckets, inicializar com burst size completo
	if bucket.LastRefill.IsZero() {
		bucket.Tokens = float64(rl.config.BurstSize)
		bucket.LastRefill = now
	} else {
		// Calcular tokens a adicionar baseado no tempo decorrido
		timePassed := now.Sub(bucket.LastRefill).Seconds()
		tokensToAdd := timePassed * float64(rl.config.Rate) / rl.config.Window.Seconds()
		
		// Atualizar tokens no bucket (limitado pelo burst size)
		bucket.Tokens = math.Min(float64(rl.config.BurstSize), bucket.Tokens+tokensToAdd)
		bucket.LastRefill = now
	}

	// Verificar se há tokens suficientes
	if bucket.Tokens >= float64(n) {
		bucket.Tokens -= float64(n)
		rl.setBucketData(key, bucket)
		
		rl.mu.Lock()
		rl.metrics.AllowedRequests++
		rl.mu.Unlock()
		
		return true
	}

	// Salvar estado mesmo quando negado
	rl.setBucketData(key, bucket)
	
	rl.mu.Lock()
	rl.metrics.DeniedRequests++
	rl.mu.Unlock()
	
	return false
}

// checkTokenBucket verifica o status do Token Bucket sem consumir tokens
func (rl *rateLimiter) checkTokenBucket(key string) Result {
	bucket, err := rl.getBucketData(key)
	if err != nil {
		return Result{Allowed: false}
	}

	now := time.Now()
	
	// Calcular tokens disponíveis
	timePassed := now.Sub(bucket.LastRefill).Seconds()
	tokensToAdd := timePassed * float64(rl.config.Rate) / rl.config.Window.Seconds()
	currentTokens := math.Min(float64(rl.config.BurstSize), bucket.Tokens+tokensToAdd)

	// Calcular quando haverá tokens suficientes
	var retryAfter time.Duration
	if currentTokens < 1 {
		tokensNeeded := 1 - currentTokens
		timeNeeded := tokensNeeded / (float64(rl.config.Rate) / rl.config.Window.Seconds())
		retryAfter = time.Duration(timeNeeded * float64(time.Second))
	}

	return Result{
		Allowed:   currentTokens >= 1,
		Remaining: int64(math.Floor(currentTokens)),
		ResetTime: now.Add(rl.config.Window),
		RetryAfter: retryAfter,
		Metadata: map[string]interface{}{
			"algorithm":      "TokenBucket",
			"current_tokens": currentTokens,
			"burst_size":     rl.config.BurstSize,
		},
	}
}

// allowFixedWindow implementa o algoritmo Fixed Window
func (rl *rateLimiter) allowFixedWindow(key string, n int64) bool {
	window, err := rl.getWindowData(key)
	if err != nil {
		return false
	}

	now := time.Now()
	windowDuration := rl.config.Window
	
	// Verificar se estamos em uma nova janela
	if now.Sub(window.WindowStart) >= windowDuration {
		// Nova janela - resetar contador
		window.Count = 0
		window.WindowStart = now.Truncate(windowDuration)
	}

	// Verificar se o request pode ser permitido
	if window.Count+n <= rl.config.Rate {
		window.Count += n
		rl.setWindowData(key, window)
		
		rl.mu.Lock()
		rl.metrics.AllowedRequests++
		rl.mu.Unlock()
		
		return true
	}

	// Salvar estado mesmo quando negado
	rl.setWindowData(key, window)
	
	rl.mu.Lock()
	rl.metrics.DeniedRequests++
	rl.mu.Unlock()
	
	return false
}

// checkFixedWindow verifica o status da Fixed Window
func (rl *rateLimiter) checkFixedWindow(key string) Result {
	window, err := rl.getWindowData(key)
	if err != nil {
		return Result{Allowed: false}
	}

	now := time.Now()
	windowDuration := rl.config.Window
	
	// Verificar se estamos em uma nova janela
	if now.Sub(window.WindowStart) >= windowDuration {
		// Nova janela
		window.Count = 0
		window.WindowStart = now.Truncate(windowDuration)
	}

	remaining := rl.config.Rate - window.Count
	nextReset := window.WindowStart.Add(windowDuration)
	
	var retryAfter time.Duration
	if remaining <= 0 {
		retryAfter = nextReset.Sub(now)
	}

	return Result{
		Allowed:   remaining > 0,
		Remaining: remaining,
		ResetTime: nextReset,
		RetryAfter: retryAfter,
		Metadata: map[string]interface{}{
			"algorithm":     "FixedWindow",
			"window_start":  window.WindowStart,
			"current_count": window.Count,
		},
	}
}

// allowSlidingWindow implementa o algoritmo Sliding Window
func (rl *rateLimiter) allowSlidingWindow(key string, n int64) bool {
	window, err := rl.getWindowData(key)
	if err != nil {
		return false
	}

	now := time.Now()
	windowStart := now.Add(-rl.config.Window)
	
	// Remover requests antigas da janela
	validRequests := make([]time.Time, 0)
	for _, reqTime := range window.Requests {
		if reqTime.After(windowStart) {
			validRequests = append(validRequests, reqTime)
		}
	}
	window.Requests = validRequests

	// Verificar se o request pode ser permitido
	if int64(len(window.Requests))+n <= rl.config.Rate {
		// Adicionar novos requests
		for i := int64(0); i < n; i++ {
			window.Requests = append(window.Requests, now)
		}
		window.Count = int64(len(window.Requests))
		rl.setWindowData(key, window)
		
		rl.mu.Lock()
		rl.metrics.AllowedRequests++
		rl.mu.Unlock()
		
		return true
	}

	// Salvar estado mesmo quando negado
	window.Count = int64(len(window.Requests))
	rl.setWindowData(key, window)
	
	rl.mu.Lock()
	rl.metrics.DeniedRequests++
	rl.mu.Unlock()
	
	return false
}

// checkSlidingWindow verifica o status da Sliding Window
func (rl *rateLimiter) checkSlidingWindow(key string) Result {
	window, err := rl.getWindowData(key)
	if err != nil {
		return Result{Allowed: false}
	}

	now := time.Now()
	windowStart := now.Add(-rl.config.Window)
	
	// Contar requests válidos na janela
	validCount := int64(0)
	oldestValidRequest := now
	
	for _, reqTime := range window.Requests {
		if reqTime.After(windowStart) {
			validCount++
			if reqTime.Before(oldestValidRequest) {
				oldestValidRequest = reqTime
			}
		}
	}

	remaining := rl.config.Rate - validCount
	
	var retryAfter time.Duration
	if remaining <= 0 && validCount > 0 {
		// Calcular quando o request mais antigo sairá da janela
		retryAfter = oldestValidRequest.Add(rl.config.Window).Sub(now)
		if retryAfter < 0 {
			retryAfter = 0
		}
	}

	return Result{
		Allowed:   remaining > 0,
		Remaining: remaining,
		ResetTime: now.Add(rl.config.Window),
		RetryAfter: retryAfter,
		Metadata: map[string]interface{}{
			"algorithm":      "SlidingWindow",
			"valid_requests": validCount,
			"window_start":   windowStart,
		},
	}
}

// allowLeakyBucket implementa o algoritmo Leaky Bucket
func (rl *rateLimiter) allowLeakyBucket(key string, n int64) bool {
	bucket, err := rl.getBucketData(key)
	if err != nil {
		return false
	}

	now := time.Now()
	
	// Para novos buckets, inicializar
	if bucket.LastRefill.IsZero() {
		bucket.LastRefill = now
		// Bucket começa vazio (0 tokens)
	} else {
		// Calcular quantos tokens "vazaram" desde a última atualização
		timePassed := now.Sub(bucket.LastRefill).Seconds()
		leakRate := float64(rl.config.Rate) / rl.config.Window.Seconds()
		tokensLeaked := timePassed * leakRate
		
		// Atualizar nível do bucket (vazar tokens - não pode ficar negativo)
		bucket.Tokens = math.Max(0, bucket.Tokens-tokensLeaked)
		bucket.LastRefill = now
	}

	// Verificar se há espaço no bucket para adicionar novos tokens
	if bucket.Tokens+float64(n) <= float64(rl.config.BurstSize) {
		bucket.Tokens += float64(n)
		rl.setBucketData(key, bucket)
		
		rl.mu.Lock()
		rl.metrics.AllowedRequests++
		rl.mu.Unlock()
		
		return true
	}

	// Salvar estado mesmo quando negado
	rl.setBucketData(key, bucket)
	
	rl.mu.Lock()
	rl.metrics.DeniedRequests++
	rl.mu.Unlock()
	
	return false
}

// checkLeakyBucket verifica o status do Leaky Bucket
func (rl *rateLimiter) checkLeakyBucket(key string) Result {
	bucket, err := rl.getBucketData(key)
	if err != nil {
		return Result{Allowed: false}
	}

	now := time.Now()
	
	// Calcular nível atual do bucket
	currentLevel := bucket.Tokens
	if !bucket.LastRefill.IsZero() {
		timePassed := now.Sub(bucket.LastRefill).Seconds()
		leakRate := float64(rl.config.Rate) / rl.config.Window.Seconds()
		tokensLeaked := timePassed * leakRate
		currentLevel = math.Max(0, bucket.Tokens-tokensLeaked)
	}

	// Calcular espaço disponível
	availableSpace := float64(rl.config.BurstSize) - currentLevel
	
	var retryAfter time.Duration
	if availableSpace < 1 {
		// Calcular quando haverá espaço suficiente
		spaceNeeded := 1 - availableSpace
		leakRate := float64(rl.config.Rate) / rl.config.Window.Seconds()
		timeNeeded := spaceNeeded / leakRate
		retryAfter = time.Duration(timeNeeded * float64(time.Second))
	}

	return Result{
		Allowed:   availableSpace >= 1,
		Remaining: int64(math.Floor(availableSpace)),
		ResetTime: now.Add(time.Duration(currentLevel/float64(rl.config.Rate)*rl.config.Window.Seconds()) * time.Second),
		RetryAfter: retryAfter,
		Metadata: map[string]interface{}{
			"algorithm":       "LeakyBucket",
			"current_level":   currentLevel,
			"available_space": availableSpace,
			"leak_rate":       float64(rl.config.Rate) / rl.config.Window.Seconds(),
		},
	}
}