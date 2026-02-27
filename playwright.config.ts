import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import dotenv from 'dotenv';

dotenv.config();

const testDir = defineBddConfig({
  features: 'tests/**/*.feature',
  steps: 'src/steps/**/*.ts',
});

export default defineConfig({
  testDir,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [['html'], ['json', { outputFile: 'playwright-report/results.json' }], ['github']],

  timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '90000'),

  expect: {
    timeout: parseInt(process.env.PLAYWRIGHT_EXPECT_TIMEOUT || '30000'),
  },

  use: {
    baseURL: 'https://www.saucedemo.com/',
    // capture trace and screenshots on every run when running in CI/PR environments
    // this makes debugging easier since artifacts are always available
    trace: process.env.CI ? 'on' : 'on-first-retry',
    screenshot: process.env.CI ? 'on' : 'only-on-failure',
    video: 'retain-on-failure',

    // Konfiguracja dla wolniejszych lokalnych LLM
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
