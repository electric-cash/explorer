import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    baseURL: 'https://explorer.testnet.ec.stage.rnd.land/',
    headless: true,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
    bypassCSP: true,
    screenshot: 'only-on-failure',
  },
};

export default config;
