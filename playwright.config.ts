import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
    testDir: './tests',
    globalSetup: './tests/api/global-setup',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: [['html', { open: 'never' }], ['list']],
    use: {
        baseURL: 'https://automationintesting.online',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    ],
});
