/**
 * Serviço de Métricas
 * LicitaReview - Sistema de Análise de Editais
 */

export interface MetricEntry {
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface TimerResult {
  duration: number;
  stop: () => number;
}

/**
 * Serviço de métricas para monitoramento da aplicação
 */
export class MetricsService {
  private serviceName: string;
  private environment: string;
  private metrics: Map<string, MetricEntry[]> = new Map();
  private timers: Map<string, number> = new Map();

  constructor(serviceName: string = 'api', environment: string = process.env.NODE_ENV || 'development') {
    this.serviceName = serviceName;
    this.environment = environment;
  }

  /**
   * Incrementar contador
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      type: 'counter',
      timestamp: new Date(),
      tags: {
        ...tags,
        service: this.serviceName,
        environment: this.environment
      }
    });
  }

  /**
   * Definir gauge (valor atual)
   */
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      type: 'gauge',
      timestamp: new Date(),
      tags: {
        ...tags,
        service: this.serviceName,
        environment: this.environment
      }
    });
  }

  /**
   * Registrar histograma
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      type: 'histogram',
      timestamp: new Date(),
      tags: {
        ...tags,
        service: this.serviceName,
        environment: this.environment
      }
    });
  }

  /**
   * Iniciar timer
   */
  startTimer(name: string): TimerResult {
    const startTime = Date.now();
    const timerId = `${name}_${Math.random().toString(36).substring(7)}`;
    this.timers.set(timerId, startTime);

    const stop = (): number => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      this.timers.delete(timerId);
      
      this.recordMetric({
        name,
        value: duration,
        type: 'timer',
        timestamp: new Date(),
        tags: {
          service: this.serviceName,
          environment: this.environment
        }
      });

      return duration;
    };

    return {
      duration: 0,
      stop
    };
  }

  /**
   * Medir tempo de execução de uma função
   */
  async timeFunction<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const timer = this.startTimer(name);
    try {
      const result = await fn();
      timer.stop();
      return result;
    } catch (error) {
      timer.stop();
      this.incrementCounter(`${name}.error`, 1, tags);
      throw error;
    }
  }

  /**
   * Registrar métrica de HTTP
   */
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    tags?: Record<string, string>
  ): void {
    const baseTags = {
      method,
      path,
      status_code: statusCode.toString(),
      service: this.serviceName,
      environment: this.environment,
      ...tags
    };

    // Contador de requests
    this.incrementCounter('http.requests.total', 1, baseTags);

    // Duração da request
    this.recordHistogram('http.request.duration', duration, baseTags);

    // Contador por status code
    if (statusCode >= 400) {
      this.incrementCounter('http.requests.errors', 1, baseTags);
    }

    if (statusCode >= 500) {
      this.incrementCounter('http.requests.server_errors', 1, baseTags);
    }
  }

  /**
   * Registrar métrica de segurança
   */
  recordSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high',
    tags?: Record<string, string>
  ): void {
    this.incrementCounter('security.events.total', 1, {
      event_type: eventType,
      severity,
      service: this.serviceName,
      environment: this.environment,
      ...tags
    });
  }

  /**
   * Registrar métrica de rate limiting
   */
  recordRateLimit(
    action: 'allowed' | 'blocked',
    clientId: string,
    tags?: Record<string, string>
  ): void {
    this.incrementCounter('rate_limit.requests', 1, {
      action,
      client_id: clientId,
      service: this.serviceName,
      environment: this.environment,
      ...tags
    });
  }

  /**
   * Registrar métrica de autenticação
   */
  recordAuthEvent(
    eventType: 'login' | 'logout' | 'token_refresh' | 'auth_failure',
    userId?: string,
    tags?: Record<string, string>
  ): void {
    this.incrementCounter('auth.events.total', 1, {
      event_type: eventType,
      user_id: userId || 'anonymous',
      service: this.serviceName,
      environment: this.environment,
      ...tags
    });
  }

  /**
   * Obter métricas por nome
   */
  getMetrics(name?: string): MetricEntry[] {
    if (name) {
      return this.metrics.get(name) || [];
    }

    const allMetrics: MetricEntry[] = [];
    for (const metricList of Array.from(this.metrics.values())) {
      allMetrics.push(...metricList);
    }
    return allMetrics;
  }

  /**
   * Obter resumo das métricas
   */
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    for (const [name, metricList] of Array.from(this.metrics.entries())) {
      const latest = metricList[metricList.length - 1];
      const total = metricList.reduce((sum, metric) => sum + metric.value, 0);
      const average = metricList.length > 0 ? total / metricList.length : 0;
      
      summary[name] = {
        type: latest?.type,
        latest: latest?.value,
        total,
        average,
        count: metricList.length,
        lastUpdated: latest?.timestamp
      };
    }

    return summary;
  }

  /**
   * Limpar métricas antigas
   */
  cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - olderThanMs);
    
    for (const [name, metricList] of Array.from(this.metrics.entries())) {
      const filteredMetrics = metricList.filter(
        metric => metric.timestamp > cutoffTime
      );
      
      if (filteredMetrics.length === 0) {
        this.metrics.delete(name);
      } else {
        this.metrics.set(name, filteredMetrics);
      }
    }
  }

  /**
   * Limpar todas as métricas (útil para testes)
   */
  clear(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  /**
   * Registrar métrica de teste
   */
  recordTestMetric(testData: {
    testSuite: string;
    testName: string;
    status: string;
    duration: number;
    memoryUsage?: number;
  }): void {
    const tags = {
      test_suite: testData.testSuite,
      test_name: testData.testName,
      status: testData.status,
      service: this.serviceName,
      environment: this.environment
    };

    // Contador de testes
    this.incrementCounter('tests.total', 1, tags);

    // Duração do teste
    this.recordHistogram('tests.duration', testData.duration, tags);

    // Uso de memória se disponível
    if (testData.memoryUsage) {
      this.setGauge('tests.memory_usage', testData.memoryUsage, tags);
    }

    // Contador por status
    if (testData.status === 'failed') {
      this.incrementCounter('tests.failures', 1, tags);
    } else if (testData.status === 'passed') {
      this.incrementCounter('tests.successes', 1, tags);
    }
  }

  /**
   * Registrar métrica interna
   */
  private recordMetric(metric: MetricEntry): void {
    const existing = this.metrics.get(metric.name) || [];
    existing.push(metric);
    
    // Manter apenas as últimas 1000 entradas por métrica
    if (existing.length > 1000) {
      existing.splice(0, existing.length - 1000);
    }
    
    this.metrics.set(metric.name, existing);

    // Em ambiente de desenvolvimento, log das métricas
    if (this.environment === 'development') {
      console.debug(`[METRIC] ${metric.name}: ${metric.value} (${metric.type})`, metric.tags);
    }
  }
}

// Instância global para uso em toda a aplicação
export const metrics = new MetricsService();