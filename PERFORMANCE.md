# ⚡ Performance e Otimização - LicitaReview

## 📊 Índice

1. [Visão Geral](#visão-geral)
2. [Lighthouse CI](#lighthouse-ci)
3. [Load Testing com K6](#load-testing-com-k6)
4. [CDN e Assets](#cdn-e-assets)
5. [Estratégias de Caching](#estratégias-de-caching)
6. [Otimizações de Backend](#otimizações-de-backend)
7. [Otimizações de Frontend](#otimizações-de-frontend)
8. [Otimizações de Database](#otimizações-de-database)
9. [Monitoramento](#monitoramento)
10. [Benchmarks e Metas](#benchmarks-e-metas)

---

## 🎯 Visão Geral

Este documento descreve todas as estratégias de performance e otimização implementadas no LicitaReview, incluindo métricas, ferramentas e best practices.

### Metas de Performance

| Métrica | Target | Atual | Status |
|---------|--------|-------|--------|
| **Lighthouse Performance** | > 90 | - | 🔄 Medindo |
| **First Contentful Paint** | < 2s | - | 🔄 Medindo |
| **Largest Contentful Paint** | < 2.5s | - | 🔄 Medindo |
| **Time to Interactive** | < 3.5s | - | 🔄 Medindo |
| **API Response Time (P95)** | < 2s | - | 🔄 Medindo |
| **Backend Analysis (P95)** | < 30s | - | 🔄 Medindo |
| **Error Rate** | < 1% | - | 🔄 Medindo |

---

## 🏆 Lighthouse CI

### Configuração

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['/', '/dashboard', '/analise'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
};
```

### Executar Localmente

```bash
# Instalar Lighthouse CI
npm install -g @lhci/cli

# Build da aplicação
npm run build

# Executar Lighthouse
lhci autorun
```

### Budgets de Performance

| Recurso | Budget | Penalidade |
|---------|--------|------------|
| **JavaScript** | 400 KB | Error |
| **Images** | 500 KB | Warning |
| **CSS** | 100 KB | Warning |
| **Fonts** | 150 KB | Warning |
| **Total Page Weight** | 2 MB | Error |
| **Network Requests** | 50 | Warning |

### Core Web Vitals

```
📊 Core Web Vitals Targets:

✅ LCP (Largest Contentful Paint)
   Target: < 2.5s
   Good: 0-2.5s | Needs Improvement: 2.5-4s | Poor: > 4s

✅ FID (First Input Delay)
   Target: < 100ms
   Good: 0-100ms | Needs Improvement: 100-300ms | Poor: > 300ms

✅ CLS (Cumulative Layout Shift)
   Target: < 0.1
   Good: 0-0.1 | Needs Improvement: 0.1-0.25 | Poor: > 0.25
```

---

## 🔥 Load Testing com K6

### Tipos de Testes

#### 1. Smoke Test
**Objetivo**: Verificação básica de funcionalidade

```bash
cd k6
./run-tests.sh smoke
```

**Configuração**:
- Usuários: 1
- Duração: 5 minutos
- Objetivo: Zero erros

#### 2. Load Test
**Objetivo**: Comportamento sob carga normal

```bash
./run-tests.sh load
```

**Configuração**:
- Usuários: 10-20
- Duração: 16 minutos
- Objetivo: P95 < 3s, Erros < 5%

#### 3. Stress Test
**Objetivo**: Encontrar ponto de ruptura

```bash
./run-tests.sh stress
```

**Configuração**:
- Usuários: 20 → 200
- Duração: 28 minutos
- Objetivo: Identificar limites

#### 4. Spike Test
**Objetivo**: Picos repentinos de tráfego

```bash
./run-tests.sh spike
```

**Configuração**:
- Padrão: 10 → 100 → 10 (rápido)
- Objetivo: Resiliência

### Métricas K6

```javascript
✅ http_req_duration    // Request duration
✅ http_req_failed      // Failed requests rate
✅ iterations           // Total iterations
✅ vus                  // Virtual users
✅ vus_max              // Max virtual users
✅ data_received        // Data received
✅ data_sent            // Data sent
```

### Thresholds

```javascript
thresholds: {
  http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  http_req_failed: ['rate<0.01'],
  checks: ['rate>0.9'],
}
```

---

## 🌐 CDN e Assets

### Firebase Hosting CDN

**Configuração Automática**:
```json
{
  "hosting": {
    "public": "apps/web/dist",
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|webp)",
        "headers": [{
          "key": "Cache-Control",
          "value": "max-age=31536000" // 1 year
        }]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [{
          "key": "Cache-Control",
          "value": "max-age=604800" // 1 week
        }]
      }
    ]
  }
}
```

### Otimizações de Imagens

```bash
# Converter para WebP
cwebp input.png -q 80 -o output.webp

# Otimizar PNGs
pngquant --quality=65-80 input.png --output output.png

# Otimizar JPEGs
jpegoptim --max=85 input.jpg
```

### Next.js Image Optimization

```tsx
import Image from 'next/image'

<Image
  src="/edital.jpg"
  alt="Edital"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  quality={85}
/>
```

### Font Optimization

```html
<!-- Preload critical fonts -->
<link
  rel="preload"
  href="/fonts/inter-var.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

---

## 🚀 Estratégias de Caching

### 1. Browser Caching

```nginx
# Static assets - 1 year
location ~* \.(jpg|jpeg|png|gif|ico|webp|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# JavaScript/CSS - 1 week
location ~* \.(js|css)$ {
  expires 7d;
  add_header Cache-Control "public";
}
```

### 2. Cloud Run Caching

```python
# services/analyzer/src/middleware/cache.py
from functools import wraps
from redis import Redis

redis_client = Redis.from_url(os.getenv('REDIS_URL'))

def cache_response(ttl=3600):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            # Try cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)

            # Compute
            result = await func(*args, **kwargs)

            # Store in cache
            redis_client.setex(cache_key, ttl, json.dumps(result))

            return result
        return wrapper
    return decorator
```

### 3. Firestore Query Caching

```typescript
// Client-side caching
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db)
  .catch((err) => {
    console.error('Persistence failed:', err);
  });
```

### 4. Service Worker Caching

```javascript
// public/sw.js
const CACHE_NAME = 'licitareview-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

---

## 🐍 Otimizações de Backend

### 1. Connection Pooling

```python
# Database connection pool
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)
```

### 2. Async Operations

```python
# Use asyncio for I/O operations
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def process_documents(documents):
    tasks = [analyze_document(doc) for doc in documents]
    results = await asyncio.gather(*tasks)
    return results
```

### 3. Batch Processing

```python
# Process in batches
def batch_process(items, batch_size=50):
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        yield process_batch(batch)
```

### 4. Lazy Loading

```python
# Lazy load heavy resources
from functools import lru_cache

@lru_cache(maxsize=1)
def get_ml_model():
    """Load ML model only once"""
    return load_model('model.pkl')
```

### 5. Compression

```python
# Enable gzip compression
from starlette.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

---

## ⚛️ Otimizações de Frontend

### 1. Code Splitting

```typescript
// Lazy load routes
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analise = lazy(() => import('./pages/Analise'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analise" element={<Analise />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. Memoization

```typescript
import { memo, useMemo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(
    () => heavyProcessing(data),
    [data]
  );

  return <div>{processedData}</div>;
});
```

### 3. Virtual Scrolling

```typescript
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index]}</div>
      )}
    </FixedSizeList>
  );
}
```

### 4. Debouncing & Throttling

```typescript
import { debounce } from 'lodash';

const handleSearch = debounce((query) => {
  fetchResults(query);
}, 300);
```

---

## 🗃️ Otimizações de Database

### Firestore Indexes

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "documents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organization_id", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "analyses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "document_id", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Query Optimization

```typescript
// ❌ BAD: Read all documents
const allDocs = await getDocs(collection(db, 'documents'));

// ✅ GOOD: Limit and filter
const q = query(
  collection(db, 'documents'),
  where('organization_id', '==', orgId),
  orderBy('created_at', 'desc'),
  limit(20)
);
const docs = await getDocs(q);
```

### Batch Operations

```typescript
// Batch write
const batch = writeBatch(db);

documents.forEach((doc) => {
  const ref = doc(db, 'documents', doc.id);
  batch.set(ref, doc.data);
});

await batch.commit();
```

---

## 📊 Monitoramento

### Cloud Monitoring Dashboards

```yaml
displayName: "LicitaReview Performance"
mosaicLayout:
  tiles:
    - width: 6
      height: 4
      widget:
        title: "Request Latency (P95)"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="cloud_run_revision"'
                  aggregation:
                    alignmentPeriod: 60s
                    perSeriesAligner: ALIGN_DELTA
                    crossSeriesReducer: REDUCE_PERCENTILE_95
```

### Custom Metrics

```python
# Export custom metrics
from prometheus_client import Counter, Histogram

request_count = Counter('requests_total', 'Total requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')

@app.middleware("http")
async def metrics_middleware(request, call_next):
    with request_duration.time():
        response = await call_next(request)
    request_count.inc()
    return response
```

---

## 🎯 Benchmarks e Metas

### Backend Performance

| Endpoint | Target P95 | Target P99 | Max Timeout |
|----------|------------|------------|-------------|
| `/health` | 100ms | 200ms | 1s |
| `/api/documents` | 500ms | 1s | 5s |
| `/analyze` | 25s | 30s | 60s |
| `/rag/query` | 3s | 5s | 10s |

### Frontend Performance

| Métrica | Target | Tools |
|---------|--------|-------|
| **FCP** | < 1.8s | Lighthouse |
| **LCP** | < 2.5s | Lighthouse, CrUX |
| **TTI** | < 3.5s | Lighthouse |
| **CLS** | < 0.1 | Lighthouse, CrUX |
| **Bundle Size** | < 400KB | webpack-bundle-analyzer |

### Database Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| **Single Read** | < 50ms | With cache |
| **Query (20 docs)** | < 200ms | Indexed |
| **Write** | < 100ms | Async |
| **Batch Write (50)** | < 500ms | Atomic |

---

## 🚀 Quick Commands

```bash
# Run Lighthouse CI
lhci autorun

# Run K6 smoke test
cd k6 && ./run-tests.sh smoke

# Run K6 load test
./run-tests.sh load

# Run K6 stress test
./run-tests.sh stress

# Analyze bundle size
npm run build && npm run analyze

# Check Core Web Vitals
npx unlighthouse --site https://licitareview.app
```

---

**Última atualização**: 21/11/2025
**Versão**: 1.0.0
**Mantido por**: Performance Team
