package storage

import (
	"context"
	"sync"
	"time"
)

// memoryItem representa um item armazenado na memória
type memoryItem struct {
	value     []byte
	expiresAt time.Time
}

// isExpired verifica se o item expirou
func (item *memoryItem) isExpired() bool {
	return !item.expiresAt.IsZero() && time.Now().After(item.expiresAt)
}

// MemoryStorage implementação de Storage em memória
type MemoryStorage struct {
	mu    sync.RWMutex
	items map[string]*memoryItem
	closed bool
}

// NewMemory cria uma nova instância de MemoryStorage
func NewMemory() *MemoryStorage {
	return &MemoryStorage{
		items: make(map[string]*memoryItem),
	}
}

// Get recupera dados para uma chave
func (ms *MemoryStorage) Get(ctx context.Context, key string) ([]byte, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	if ms.closed {
		return nil, ErrStorageClosed
	}

	item, exists := ms.items[key]
	if !exists {
		return nil, ErrKeyNotFound
	}

	if item.isExpired() {
		// Remove item expirado
		ms.mu.RUnlock()
		ms.mu.Lock()
		delete(ms.items, key)
		ms.mu.Unlock()
		ms.mu.RLock()
		return nil, ErrKeyNotFound
	}

	// Retornar cópia dos dados
	result := make([]byte, len(item.value))
	copy(result, item.value)
	return result, nil
}

// Set armazena dados para uma chave com TTL
func (ms *MemoryStorage) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	if ms.closed {
		return ErrStorageClosed
	}

	// Criar cópia dos dados
	valueCopy := make([]byte, len(value))
	copy(valueCopy, value)

	item := &memoryItem{
		value: valueCopy,
	}

	// Definir expiração se TTL fornecido
	if ttl > 0 {
		item.expiresAt = time.Now().Add(ttl)
	}

	ms.items[key] = item
	return nil
}

// Delete remove dados para uma chave
func (ms *MemoryStorage) Delete(ctx context.Context, key string) error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	if ms.closed {
		return ErrStorageClosed
	}

	delete(ms.items, key)
	return nil
}

// Exists verifica se uma chave existe
func (ms *MemoryStorage) Exists(ctx context.Context, key string) (bool, error) {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	if ms.closed {
		return false, ErrStorageClosed
	}

	item, exists := ms.items[key]
	if !exists {
		return false, nil
	}

	if item.isExpired() {
		// Remove item expirado
		ms.mu.RUnlock()
		ms.mu.Lock()
		delete(ms.items, key)
		ms.mu.Unlock()
		ms.mu.RLock()
		return false, nil
	}

	return true, nil
}

// Close fecha o storage e limpa todos os dados
func (ms *MemoryStorage) Close() error {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	if ms.closed {
		return nil
	}

	ms.closed = true
	ms.items = nil
	return nil
}

// Cleanup remove itens expirados (método adicional para MemoryStorage)
func (ms *MemoryStorage) Cleanup() int {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	if ms.closed {
		return 0
	}

	count := 0
	now := time.Now()

	for key, item := range ms.items {
		if !item.expiresAt.IsZero() && now.After(item.expiresAt) {
			delete(ms.items, key)
			count++
		}
	}

	return count
}

// Size retorna o número de itens armazenados
func (ms *MemoryStorage) Size() int {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	if ms.closed {
		return 0
	}

	return len(ms.items)
}

// Keys retorna todas as chaves armazenadas (útil para debugging)
func (ms *MemoryStorage) Keys() []string {
	ms.mu.RLock()
	defer ms.mu.RUnlock()

	if ms.closed {
		return nil
	}

	keys := make([]string, 0, len(ms.items))
	for key := range ms.items {
		keys = append(keys, key)
	}

	return keys
}