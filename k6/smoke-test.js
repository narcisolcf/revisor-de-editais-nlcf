import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 1 }, // Ramp up to 1 user
    { duration: '3m', target: 1 }, // Stay at 1 user for 3 minutes
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.01'],    // Error rate must be below 1%
    errors: ['rate<0.1'],              // Custom error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Health check
  let healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // List documents (if endpoint exists)
  let listRes = http.get(`${BASE_URL}/api/documents`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  check(listRes, {
    'list documents status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'list documents response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'k6/reports/smoke-test-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += `${indent}checks.........................: ${data.metrics.checks.values.passes / data.metrics.checks.values.count * 100}% ✓ ${data.metrics.checks.values.passes} / ✗ ${data.metrics.checks.values.fails}\n`;
  summary += `${indent}http_req_duration..............: avg=${data.metrics.http_req_duration.values.avg}ms min=${data.metrics.http_req_duration.values.min}ms med=${data.metrics.http_req_duration.values.med}ms max=${data.metrics.http_req_duration.values.max}ms p(90)=${data.metrics.http_req_duration.values['p(90)']}ms p(95)=${data.metrics.http_req_duration.values['p(95)']}ms\n`;
  summary += `${indent}http_req_failed................: ${data.metrics.http_req_failed.values.rate * 100}% ✓ ${data.metrics.http_req_failed.values.passes} / ✗ ${data.metrics.http_req_failed.values.fails}\n`;
  summary += `${indent}iterations.....................: ${data.metrics.iterations.values.count}\n`;

  return summary;
}
