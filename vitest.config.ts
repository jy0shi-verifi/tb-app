import { defineConfig } from 'vitest/config'

// Unit tests for the pure math (calc / progression / stats). Scoped to test/ so
// it never picks up the Playwright e2e specs (which also end in .spec.ts).
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})
