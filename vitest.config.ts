import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import swc from 'unplugin-swc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', 'dist'],
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
      '@modules/shared': `${__dirname}/modules/shared/src`,
      '@modules/lead': `${__dirname}/modules/lead/src`,
      '@modules/enrichment': `${__dirname}/modules/enrichment/src`,
      '@modules/extraction': `${__dirname}/modules/extraction/src`,
      '@modules/mock-api': `${__dirname}/modules/mock-api/src`,
      '@test': `${__dirname}/test`,
    },
  },
});
