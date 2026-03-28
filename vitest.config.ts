import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/test/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@modules/shared': `${__dirname}/modules/shared/src/index.ts`,
      '@modules/lead': `${__dirname}/modules/lead/src/index.ts`,
      '@modules/enrichment': `${__dirname}/modules/enrichment/src/index.ts`,
      '@modules/extraction': `${__dirname}/modules/extraction/src/index.ts`,
      '@modules/mock-api': `${__dirname}/modules/mock-api/src/index.ts`,
      '@test': `${__dirname}/test`,
    },
  },
});
