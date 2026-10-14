import { defineConfig, devices } from '@playwright/test'

// PLAYWRIGHT_PORT lets a second checkout (a git worktree) run the suite beside
// a dev server that already holds port 3000.
const port = process.env.PLAYWRIGHT_PORT ?? '3000'

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup.ts',
  timeout: 30000,
  // One retry on CI absorbs cold-start flakes; keep failures immediate locally
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `bun run dev -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    // CI runners cold-compile the dev server, which can exceed the local 30s
    timeout: process.env.CI ? 120000 : 30000,
  },
})
