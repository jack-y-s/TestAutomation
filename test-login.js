const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const RESULT_FILE = path.join(__dirname, 'test-results.html');
const TEST_CASES_FILE = path.join(__dirname, 'test-cases.json');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

let results = [];

async function testLogin(testCase, username, password, shouldSucceed) {
  const start = Date.now();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE_URL);
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(500); // Wait for navigation or error

  let status, details, actual;
  // Detect empty username or password
  if (!username || !password) {
    status = 'FAIL';
    details = 'Username or password not entered';
    actual = 'No Input';
  } else if (shouldSucceed) {
    if (page.url().endsWith('/welcome')) {
      status = 'PASS';
      details = 'Login succeeded';
      actual = 'Success';
    } else {
      status = 'FAIL';
      details = 'Login should have succeeded';
      actual = 'Failure';
    }
  } else {
    if (page.url().includes('error=1')) {
      status = 'PASS';
      details = 'Login failed as expected';
      actual = 'Failure';
    } else {
      status = 'FAIL';
      details = 'Login should have failed';
      actual = 'Success';
    }
  }
  const end = Date.now();
  const timeTaken = ((end - start) / 1000).toFixed(2);

  // Take screenshot
  const screenshotName = `testcase-${testCase}-${status.toLowerCase()}.png`;
  const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
  await page.screenshot({ path: screenshotPath });

  results.push({
    testCase,
    timestamp: new Date().toISOString(),
    username,
    password,
    expected: shouldSucceed ? 'Success' : 'Failure',
    actual,
    status,
    details,
    timeTaken,
    screenshot: `screenshots/${screenshotName}`
  });
  await browser.close();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function writeHtmlReport() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Automation Results</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f9fa; }
    h1 { text-align: center; }
    table { border-collapse: collapse; margin: 2rem auto; width: 90%; background: #fff; }
    th, td { border: 1px solid #ccc; padding: 0.5rem 1rem; text-align: center; }
    th { background: #007bff; color: #fff; }
    tr.pass { background: #d4edda; }
    tr.fail { background: #f8d7da; }
    img.thumb { max-width: 120px; max-height: 80px; border: 1px solid #888; cursor: pointer; transition: box-shadow 0.2s; }
    .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); align-items: center; justify-content: center; }
    .modal img { max-width: 90vw; max-height: 90vh; border: 4px solid #fff; box-shadow: 0 0 20px #000; }
    .modal.active { display: flex; }
    .wrap { word-break: break-all; max-width: 180px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>Test Automation Results</h1>
  <table>
    <thead>
      <tr>
        <th>Test Case</th>
        <th>Timestamp</th>
        <th>Username</th>
        <th>Password</th>
        <th>Expected</th>
        <th>Actual</th>
        <th>Status</th>
        <th>Details</th>
        <th>Time Taken (s)</th>
        <th>Screenshot</th>
      </tr>
    </thead>
    <tbody>
      ${results.map((r, i) => `
        <tr class="${r.status.toLowerCase()}">
          <td>${r.testCase}</td>
          <td>${r.timestamp}</td>
          <td class="wrap">${escapeHtml(r.username)}</td>
          <td class="wrap">${escapeHtml(r.password)}</td>
          <td>${r.expected}</td>
          <td>${r.actual}</td>
          <td>${r.status}</td>
          <td>${r.details}</td>
          <td>${r.timeTaken}</td>
          <td><a href="${r.screenshot}" target="_blank"><img src="${r.screenshot}" alt="screenshot" class="thumb"></a></td>
        </tr>`).join('')}
    </tbody>
  </table>
  <div id="modal" class="modal" onclick="hideModal()" style="display:none">
    <img id="modal-img" src="" alt="Full Screenshot">
  </div>
  <script>
    // Modal code is now optional since we use _blank for new tab
    function showModal(src) {
      document.getElementById('modal-img').src = src;
      document.getElementById('modal').classList.add('active');
    }
    function hideModal() {
      document.getElementById('modal').classList.remove('active');
      document.getElementById('modal-img').src = '';
    }
  </script>
</body>
</html>`;
  fs.writeFileSync(RESULT_FILE, html);
}

(async () => {
  const testCases = JSON.parse(fs.readFileSync(TEST_CASES_FILE, 'utf-8'));
  for (const tc of testCases) {
    await testLogin(tc.testCase, tc.username, tc.password, tc.shouldSucceed);
  }
  writeHtmlReport();
})();
