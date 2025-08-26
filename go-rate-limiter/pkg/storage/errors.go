package storage

import "errors"

// Erros comuns do storage
var (
	// ErrKeyNotFound indica que a chave não foi encontrada
	ErrKeyNotFound = errors.New("key not found")
	
	// ErrStorageClosed indica que o storage foi fechado
	ErrStorageClosed = errors.New("storage is closed")
	
	// ErrInvalidKey indica que a chave fornecida é inválida
	ErrInvalidKey = errors.New("invalid key")
	
	// ErrInvalidValue indica que o valor fornecido é inválido
	ErrInvalidValue = errors.New("invalid value")
	
	// ErrConnectionFailed indica falha na conexão com o storage
	ErrConnectionFailed = errors.New("connection failed")
	
	// ErrTimeout indica que a operação expirou
	ErrTimeout = errors.New("operation timeout")
)