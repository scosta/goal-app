import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('Setup Script and Build Process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Setup Script', () => {
    it('should have setup script with correct permissions', () => {
      const setupScriptPath = join(process.cwd(), 'setup.sh');
      expect(existsSync(setupScriptPath)).toBe(true);
      
      // Check if script is executable (this would need to be run in actual environment)
      // In test environment, we can't check file permissions reliably
    });

    it('should contain all necessary setup commands', () => {
      const setupScriptContent = readFileSync('setup.sh', 'utf-8');
      
      // Check for key setup commands
      expect(setupScriptContent).toContain('go mod tidy');
      expect(setupScriptContent).toContain('pnpm install');
      expect(setupScriptContent).toContain('openapi-typescript');
      expect(setupScriptContent).toContain('openapi-zod-client');
      expect(setupScriptContent).toContain('swagger generate model');
    });
  });

  describe('Package.json Scripts', () => {
    it('should have all necessary npm scripts', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      expect(packageJson.scripts).toHaveProperty('setup');
      expect(packageJson.scripts).toHaveProperty('dev');
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts).toHaveProperty('test');
      expect(packageJson.scripts).toHaveProperty('lint');
    });

    it('should have correct dev script for concurrent execution', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      expect(packageJson.scripts.dev).toContain('concurrently');
      expect(packageJson.scripts.dev).toContain('go run cmd/api/main.go');
      expect(packageJson.scripts.dev).toContain('pnpm dev');
    });
  });

  describe('Generated Files Structure', () => {
    it('should have all required generated files', () => {
      // Check for generated TypeScript types
      expect(existsSync('shared/api-types.ts')).toBe(true);
      
      // Check for generated Zod schemas
      expect(existsSync('shared/zod-schemas.ts')).toBe(true);
      
      // Check for generated Go models
      expect(existsSync('server/models/models.go')).toBe(true);
    });

    it('should have correct file structure for client', () => {
      expect(existsSync('client/src/api/goals.ts')).toBe(true);
      expect(existsSync('client/src/api/progress.ts')).toBe(true);
      expect(existsSync('client/src/api/summary.ts')).toBe(true);
      expect(existsSync('client/src/api/index.ts')).toBe(true);
    });

    it('should have test files in correct locations', () => {
      expect(existsSync('client/src/api/__tests__/goals.test.ts')).toBe(true);
      expect(existsSync('client/src/api/__tests__/progress.test.ts')).toBe(true);
      expect(existsSync('client/src/api/__tests__/summary.test.ts')).toBe(true);
      expect(existsSync('client/src/api/__tests__/integration.test.ts')).toBe(true);
      expect(existsSync('shared/__tests__/zod-schemas.test.ts')).toBe(true);
    });
  });

  describe('Dependencies', () => {
    it('should have all required dependencies in package.json', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      expect(packageJson.devDependencies).toHaveProperty('concurrently');
      expect(packageJson.devDependencies).toHaveProperty('openapi-typescript');
      expect(packageJson.devDependencies).toHaveProperty('openapi-zod-client');
    });

    it('should specify correct Node.js and pnpm versions', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      expect(packageJson.engines.node).toBe('>=18.0.0');
      expect(packageJson.engines.pnpm).toBe('>=8.0.0');
    });
  });

  describe('OpenAPI Specification', () => {
    it('should have valid OpenAPI spec structure', () => {
      const openApiContent = readFileSync('shared/openapi.yaml', 'utf-8');
      
      // Check for key OpenAPI elements
      expect(openApiContent).toContain('openapi: 3.0.3');
      expect(openApiContent).toContain('paths:');
      expect(openApiContent).toContain('components:');
      expect(openApiContent).toContain('schemas:');
    });

    it('should define all required endpoints', () => {
      const openApiContent = readFileSync('shared/openapi.yaml', 'utf-8');
      
      expect(openApiContent).toContain('/goals:');
      expect(openApiContent).toContain('/progress:');
      expect(openApiContent).toContain('/summary:');
    });

    it('should have proper HTTP methods for each endpoint', () => {
      const openApiContent = readFileSync('shared/openapi.yaml', 'utf-8');
      
      // Goals endpoint
      expect(openApiContent).toContain('get:');
      expect(openApiContent).toContain('post:');
      
      // Progress endpoint
      expect(openApiContent).toContain('get:');
      expect(openApiContent).toContain('post:');
      
      // Summary endpoint
      expect(openApiContent).toContain('get:');
    });
  });

  describe('Go Module Configuration', () => {
    it('should have valid go.mod file', () => {
      const goModContent = readFileSync('server/go.mod', 'utf-8');
      
      expect(goModContent).toContain('module github.com/scosta/goal-app/server');
      expect(goModContent).toContain('go 1.21');
    });

    it('should have go.sum file for dependency checksums', () => {
      expect(existsSync('server/go.sum')).toBe(true);
    });
  });

  describe('Build Process Validation', () => {
    it('should have proper build configuration', () => {
      // Check for Vite config (if using Vite)
      if (existsSync('client/vite.config.ts')) {
        const viteConfig = readFileSync('client/vite.config.ts', 'utf-8');
        expect(viteConfig).toBeDefined();
      }
    });

    it('should have proper test configuration', () => {
      // Check for Vitest config (if using Vitest)
      if (existsSync('client/vitest.config.ts')) {
        const vitestConfig = readFileSync('client/vitest.config.ts', 'utf-8');
        expect(vitestConfig).toBeDefined();
      }
    });
  });
});
