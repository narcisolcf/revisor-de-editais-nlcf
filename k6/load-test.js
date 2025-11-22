import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const analysisTime = new Trend('analysis_duration');
const totalRequests = new Counter('total_requests');

// Test configuration - Load Test
export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 20 },  // Ramp up to 20 users
    { duration: '5m', target: 20 },  // Stay at 20 users
    { duration: '2m', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'], // 95% < 3s, 99% < 5s
    http_req_failed: ['rate<0.05'],                   // Error rate < 5%
    errors: ['rate<0.1'],
    analysis_duration: ['p(95)<30000'],               // Analysis < 30s for 95%
  },
  ext: {
    loadimpact: {
      projectID: 3590765,
      name: 'LicitaReview Load Test'
    }
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  group('Health Checks', function () {
    const res = http.get(`${BASE_URL}/health`);
    totalRequests.add(1);

    check(res, {
      'health check is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has healthy status': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'healthy' || body.status === 'ok';
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);
  });

  sleep(1);

  group('Document Analysis', function () {
    const payload = JSON.stringify({
      document_id: `test-${Date.now()}-${Math.random()}`,
      content: 'EDITAL DE LICITAÇÃO\n\nModalidade: Pregão Eletrônico\nValor estimado: R$ 150.000,00\n\nObjeto: Contratação de serviços de TI.',
      organization_id: 'org-test-001',
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '60s',
    };

    const startTime = Date.now();
    const res = http.post(`${BASE_URL}/analyze`, payload, params);
    const duration = Date.now() - startTime;

    totalRequests.add(1);
    analysisTime.add(duration);

    check(res, {
      'analysis returns 200 or 202': (r) => r.status === 200 || r.status === 202,
      'analysis completes in < 30s': (r) => r.timings.duration < 30000,
      'response has result': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result || body.status === 'processing';
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);
  });

  sleep(2);

  group('Metrics Endpoint', function () {
    const res = http.get(`${BASE_URL}/metrics`);
    totalRequests.add(1);

    check(res, {
      'metrics endpoint responds': (r) => r.status === 200 || r.status === 404,
      'response time < 1s': (r) => r.timings.duration < 1000,
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  console.log('Preparing the end-of-test summary...');

  // Calculate custom summary stats
  const summary = {
    timestamp: new Date().toISOString(),
    duration_seconds: data.state.testRunDurationMs / 1000,
    total_requests: totalRequests.count,
    error_rate: errorRate.rate * 100,

    http_metrics: {
      avg_duration_ms: data.metrics.http_req_duration?.values?.avg || 0,
      p95_duration_ms: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
      p99_duration_ms: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
      max_duration_ms: data.metrics.http_req_duration?.values?.max || 0,
    },

    checks: {
      pass_rate: (data.metrics.checks?.values?.passes / data.metrics.checks?.values?.count * 100) || 0,
      total_passed: data.metrics.checks?.values?.passes || 0,
      total_failed: data.metrics.checks?.values?.fails || 0,
    },

    analysis_metrics: {
      avg_ms: data.metrics.analysis_duration?.values?.avg || 0,
      p95_ms: data.metrics.analysis_duration?.values?.['p(95)'] || 0,
    },
  };

  return {
    'k6/reports/load-test-summary.json': JSON.stringify(summary, null, 2),
    'k6/reports/load-test-full.json': JSON.stringify(data, null, 2),
    stdout: generateTextSummary(summary),
  };
}

function generateTextSummary(summary) {
  return `
╔══════════════════════════════════════════════════════════════╗
║            LICITAREVIEW LOAD TEST RESULTS                   ║
╚══════════════════════════════════════════════════════════════╝

Test Duration: ${summary.duration_seconds}s
Total Requests: ${summary.total_requests}
Error Rate: ${summary.error_rate.toFixed(2)}%

HTTP Metrics:
  Average Duration: ${summary.http_metrics.avg_duration_ms.toFixed(2)}ms
  P95 Duration: ${summary.http_metrics.p95_duration_ms.toFixed(2)}ms
  P99 Duration: ${summary.http_metrics.p99_duration_ms.toFixed(2)}ms
  Max Duration: ${summary.http_metrics.max_duration_ms.toFixed(2)}ms

Checks:
  Pass Rate: ${summary.checks.pass_rate.toFixed(2)}%
  Passed: ${summary.checks.total_passed}
  Failed: ${summary.checks.total_failed}

Analysis Performance:
  Average: ${summary.analysis_metrics.avg_ms.toFixed(2)}ms
  P95: ${summary.analysis_metrics.p95_ms.toFixed(2)}ms

═══════════════════════════════════════════════════════════════
`;
}
