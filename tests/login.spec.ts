import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEST_CASES_FILE = path.join(__dirname, '../test-cases.json');
const USERNAME = 'automation';
const PASSWORD = 'testautomation123';

function getTestCases() {
  const staticCases = JSON.parse(fs.readFileSync(TEST_CASES_FILE, 'utf-8')) as Array<{
    testCase: number;
    username: string;
    password: string;
  }>;
  return staticCases;
}

test.describe('Login Automation (Data-driven)', () => {
  const testCases = getTestCases();
  for (const tc of testCases) {
    test(`Test Case ${tc.testCase}: [${tc.username}, ${tc.password}]`, async ({ page }) => {
      await page.goto(BASE_URL);
      await page.fill('input[name="username"]', tc.username);
      await page.fill('input[name="password"]', tc.password);
      if (tc.username === '' || tc.password === '') {
        // Try to submit and check that the form is not submitted
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load', timeout: 2000 }).catch(() => null),
          page.click('button[type="submit"]'),
        ]);
        // Should not navigate away from login page
        expect(page.url()).toMatch(/\/login|\/\s*$/);
        // Check that the empty input is invalid
        const isUsernameValid = await page.$eval('input[name="username"]', el => (el as HTMLInputElement).checkValidity());
        const isPasswordValid = await page.$eval('input[name="password"]', el => (el as HTMLInputElement).checkValidity());
        if (tc.username === '') expect(isUsernameValid).toBe(false);
        if (tc.password === '') expect(isPasswordValid).toBe(false);
        return;
      }
      await page.click('button[type="submit"]');
      if (tc.testCase === 1) {
        await expect(page).toHaveURL(/.*\/welcome$/);
        await expect(page.locator('h2')).toHaveText('Welcome!');
      } else {
        await expect(page).toHaveURL(/\?error=1/);
        await expect(page.locator('.error')).toHaveText('Invalid username or password.');
      }
    });
  }

  test('Logout clears session and blocks /welcome', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/welcome$/);

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/$/);

    await page.goto(`${BASE_URL}/welcome`);
    await expect(page).toHaveURL(/\/$/);
  });
});
