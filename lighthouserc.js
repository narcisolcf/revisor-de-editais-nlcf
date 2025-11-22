module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/analise',
      ],
      // Number of runs per URL
      numberOfRuns: 3,
      // Settings for the Chrome instance
      settings: {
        preset: 'desktop',
        // Throttling settings (4G)
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        // Screen emulation
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
        },
      },
    },
    assert: {
      // Performance budgets
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 400000 }], // 400KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 500000 }],  // 500KB
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:font:size': ['warn', { maxNumericValue: 150000 }], // 150KB

        // Network requests
        'network-requests': ['warn', { maxNumericValue: 50 }],
        'total-byte-weight': ['error', { maxNumericValue: 2000000 }], // 2MB

        // Modern best practices
        'uses-long-cache-ttl': 'off',
        'offscreen-images': 'warn',
        'uses-webp-images': 'warn',
        'uses-optimized-images': 'warn',
        'modern-image-formats': 'warn',
        'uses-text-compression': 'error',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'uses-rel-preconnect': 'warn',
        'font-display': 'warn',
      },
    },
    upload: {
      // Upload results to temporary public storage
      target: 'temporary-public-storage',
    },
    server: {
      // Local server for testing
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: '.lighthouseci/db.sql',
      },
    },
  },
};
