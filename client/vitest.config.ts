import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test-setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      '../shared/**/*.{test,spec}.{js,ts}'
    ],
    coverage: {
      include: [
        'src/**/*.{js,ts}',
        '../shared/**/*.{js,ts}'
      ],
      exclude: [
        'src/**/*.test.{js,ts}',
        'src/**/*.spec.{js,ts}',
        '../shared/**/*.test.{js,ts}',
        '../shared/**/*.spec.{js,ts}'
      ],
      all: true,
      reporter: ['text', 'html']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
});
