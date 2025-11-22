import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Stress Test - Find breaking point
export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Ramp to 20 users
    { duration: '5m', target: 20 },   // Stay at 20
    { duration: '2m', target: 50 },   // Ramp to 50
    { duration: '5m', target: 50 },   // Stay at 50
    { duration: '2m', target: 100 },  // Ramp to 100
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 200 },  // Push to limits
    { duration: '5m', target: 200 },  // Stress period
    { duration: '5m', target: 0 },    // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    http_req_failed: ['rate<0.10'],  // Allow 10% error rate during stress
    errors: ['rate<0.2'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  const duration = res.timings.duration;

  responseTime.add(duration);

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 5000,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(Math.random() * 3); // Random think time
}

export function handleSummary(data) {
  return {
    'k6/reports/stress-test-summary.json': JSON.stringify(data, null, 2),
  };
}
