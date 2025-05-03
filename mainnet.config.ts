import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    baseURL: 'https://explorer.electriccash.global/',
    headless: true,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: false,
    video: 'on-first-retry',
    bypassCSP: false,
    screenshot: 'only-on-failure',
  },
};

export default config;
