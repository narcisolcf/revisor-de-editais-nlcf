/**
 * Intelligent Query Component
 *
 * Componente para consultas inteligentes usando RAG.
 * Permite perguntas e respostas fundamentadas na base de conhecimento.
 */

import React, { useState } from 'react';
import { Send, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

interface Source {
  title: string;
  excerpt: string;
  relevance_score: number;
  document_id: string;
  metadata?: Record<string, any>;
}

interface QueryResponse {
  question: string;
  answer: string;
  sources: Source[];
  confidence: number;
  context_type: string;
  retrieval_info?: Record<string, any>;
  generated_at: string;
}

interface IntelligentQueryProps {
  organizationId: string;
  onQueryComplete?: (response: QueryResponse) => void;
}

export function IntelligentQuery({ organizationId, onQueryComplete }: IntelligentQueryProps) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contextType, setContextType] = useState<string>('all');

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/intelligent-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          organizationId,
          contextType,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao processar consulta');
      }

      const data: QueryResponse = await res.json();
      setResponse(data);

      if (onQueryComplete) {
        onQueryComplete(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="intelligent-query-container max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Consulta Inteligente
          </h2>
        </div>
        <p className="text-gray-600">
          Faça perguntas sobre licitações e receba respostas fundamentadas em documentos reais
        </p>
      </div>

      {/* Context Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Contexto
        </label>
        <select
          value={contextType}
          onChange={(e) => setContextType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Todos os documentos</option>
          <option value="legal">Legislação e normas</option>
          <option value="organizational">Documentos organizacionais</option>
          <option value="templates">Templates e modelos</option>
          <option value="jurisprudencia">Jurisprudência</option>
        </select>
      </div>

      {/* Query Input */}
      <div className="mb-6">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta... (Ex: Quais são os requisitos de habilitação para pregão eletrônico?)"
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={3}
            disabled={loading}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="absolute bottom-3 right-3 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Analisando documentos...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Erro:</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Response */}
      {response && !loading && (
        <div className="space-y-6">
          {/* Answer */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Resposta
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Confiança:</span>
                <span className={`font-semibold ${getConfidenceColor(response.confidence)}`}>
                  {(response.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-800 whitespace-pre-wrap">
                {response.answer}
              </p>
            </div>
          </div>

          {/* Sources */}
          {response.sources && response.sources.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Fontes Consultadas ({response.sources.length})
                </h3>
              </div>
              <div className="space-y-3">
                {response.sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-md p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {source.title}
                      </h4>
                      <span className="text-sm text-gray-500">
                        Relevância: {(source.relevance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {source.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {response.retrieval_info && (
            <div className="text-xs text-gray-500 text-center">
              Tempo de processamento: {(response.retrieval_info.generation_time_ms || 0).toFixed(0)}ms
              {' • '}
              Contextos encontrados: {response.retrieval_info.contexts_found || 0}
            </div>
          )}
        </div>
      )}

      {/* Suggested Questions */}
      {!response && !loading && (
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Perguntas Sugeridas:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Quais são os requisitos de habilitação para pregão eletrônico?',
              'Como calcular o prazo de vigência de um contrato?',
              'Qual a diferença entre dispensa e inexigibilidade?',
              'Quais documentos são obrigatórios em um edital?',
            ].map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setQuestion(suggestion)}
                className="text-left px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default IntelligentQuery;
