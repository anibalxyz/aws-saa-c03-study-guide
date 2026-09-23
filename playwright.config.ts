import { defineConfig, devices } from '@playwright/test';

// Mobile-first e2e suite for the SAA-C03 study site.
//
// Runs against `npm run preview` of a fresh `npm run build`
// (see package.json `test:e2e`: build → preview → test → teardown,
// preview start/stop handled by `webServer` below).
// Reuses the system Chrome (`channel: 'chrome'`) so no browser
// download is needed.
const BASE_URL = 'http://localhost:4321';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview -- --port 4321 --host 127.0.0.1',
    url: `${BASE_URL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    // Primary: all tests must pass here.
    { name: 'pixel7', use: { ...devices['Pixel 7'], channel: 'chrome' } },
    // iPhone 14 viewport/UA/touch emulation on the system Chrome engine.
    // Stock `devices['iPhone 14']` targets WebKit, but this environment
    // cannot launch it (`npx playwright install webkit` succeeds yet the
    // host lacks libicu74/libjpeg-turbo8/gstreamer and there is no sudo
    // for `install-deps`). The override below keeps the Apple viewport,
    // user agent, and touch behavior while reusing system Chrome.
    {
      name: 'iphone14',
      use: { ...devices['iPhone 14'], defaultBrowserType: 'chromium', channel: 'chrome' },
    },
    {
      name: 'desktop',
      use: {
        channel: 'chrome',
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
