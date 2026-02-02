// @ts-check
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    screenshot: 'on',
  },
};

module.exports = config;
