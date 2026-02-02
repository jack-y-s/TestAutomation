const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const RESULT_FILE = path.join(__dirname, 'test-results.html');
const TEST_CASES_FILE = path.join(__dirname, 'test-cases.json');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRandomizedCases(startIndex) {
  return [
    {
      testCase: startIndex,
      username: randomString(8),
      password: randomString(12),
      shouldSucceed: false
    },
    {
      testCase: startIndex + 1,
      username: randomString(20),
      password: '',
      shouldSucceed: false
    },
    {
      testCase: startIndex + 2,
      username: '',
      password: randomString(20),
      shouldSucceed: false
    },
    {
      testCase: startIndex + 3,
      username: randomString(50),
      password: randomString(50),
      shouldSucceed: false
    }
  ];
}

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

function getSummaryCounts() {
  let pass = 0, fail = 0;
  for (const r of results) {
    if (r.status === 'PASS') pass++;
    else fail++;
  }
  return { pass, fail };
}

function writeHtmlReport() {
  const { pass, fail } = getSummaryCounts();
  const total = pass + fail;
  const passPercent = total ? ((pass / total) * 100).toFixed(1) : 0;
  const failPercent = total ? ((fail / total) * 100).toFixed(1) : 0;
  // Pie chart angles
  const passAngle = (pass / total) * 360;
  const failAngle = 360 - passAngle;
  const passLargeArc = passAngle > 180 ? 1 : 0;
  const passRadians = (passAngle - 90) * Math.PI / 180;
  const x = 16 + 16 * Math.cos(passRadians);
  const y = 16 + 16 * Math.sin(passRadians);
  const piePath = total === 0 ? '' : `M16,16 L16,0 A16,16 0 ${passLargeArc} 1 ${x},${y} Z`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Automation Results</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8f9fa; }
    h1 { text-align: center; }
    .summary { display: flex; justify-content: center; align-items: center; margin: 2rem 0; }
    .pie-chart { width: 120px; height: 120px; margin-right: 2rem; }
    .legend { display: flex; flex-direction: column; }
    .legend span { margin-bottom: 0.5rem; }
    .legend .pass { color: #218838; }
    .legend .fail { color: #c82333; }
    table { border-collapse: collapse; margin: 2rem auto; width: 90%; background: #fff; }
    th, td { border: 1px solid #ccc; padding: 0.5rem 1rem; text-align: center; }
    th { background: #007bff; color: #fff; }
    tr.pass { background: #d4edda; }
    tr.fail { background: #f8d7da; }
    .expand-btn { cursor: pointer; background: #007bff; color: #fff; border: none; border-radius: 4px; padding: 0.2rem 0.7rem; font-size: 1rem; }
    .details-row { display: none; background: #f1f1f1; }
    .details-cell { text-align: left; padding: 1rem 2rem; }
    .details-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 2rem; }
    .details-list li { margin-bottom: 0; display: contents; }
    .details-list label { font-weight: bold; text-align: right; padding-right: 0.5rem; }
    .details-list span, .details-list a { text-align: left; }
    .wrap { word-break: break-all; max-width: 180px; white-space: pre-wrap; }
    img.thumb { max-width: 120px; max-height: 80px; border: 1px solid #888; }
  </style>
</head>
<body>
  <h1>Test Automation Results</h1>
  <div class="summary">
    <svg class="pie-chart" viewBox="0 0 32 32">
      <circle r="16" cx="16" cy="16" fill="#f8d7da" />
      <path d="${piePath}" fill="#218838" />
    </svg>
    <div class="legend">
      <span class="pass">PASS: ${pass} (${passPercent}%)</span>
      <span class="fail">FAIL: ${fail} (${failPercent}%)</span>
      <span>Total: ${total}</span>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Test Case</th>
        <th>Expected</th>
        <th>Actual</th>
        <th>Expand</th>
      </tr>
    </thead>
    <tbody>
      ${results.map((r, i) => `
        <tr class="${r.status.toLowerCase()}">
          <td>Test Case ${r.testCase}</td>
          <td>${r.expected}</td>
          <td>${r.actual}</td>
          <td><button class="expand-btn" onclick="toggleDetails(${i})">&#x25BC;</button></td>
        </tr>
        <tr class="details-row" id="details-${i}">
          <td colspan="4" class="details-cell">
            <ul class="details-list">
              <li><label>Timestamp:</label> <span>${r.timestamp}</span></li>
              <li><label>Username:</label> <span class="wrap">${escapeHtml(r.username)}</span></li>
              <li><label>Password:</label> <span class="wrap">${escapeHtml(r.password)}</span></li>
              <li><label>Status:</label> <span>${r.status}</span></li>
              <li><label>Details:</label> <span>${r.details}</span></li>
              <li><label>Time Taken (s):</label> <span>${r.timeTaken}</span></li>
              <li><label>Screenshot:</label> <a href="${r.screenshot}" target="_blank"><img src="${r.screenshot}" alt="screenshot" class="thumb"></a></li>
            </ul>
          </td>
        </tr>`).join('')}
    </tbody>
  </table>
  <script>
    function toggleDetails(idx) {
      var row = document.getElementById('details-' + idx);
      if (row.style.display === 'table-row') {
        row.style.display = 'none';
      } else {
        row.style.display = 'table-row';
      }
    }
  </script>
</body>
</html>`;
  fs.writeFileSync(RESULT_FILE, html);
}

(async () => {
  const staticCases = JSON.parse(fs.readFileSync(TEST_CASES_FILE, 'utf-8'));
  const randomizedCases = getRandomizedCases(staticCases.length + 1);
  const testCases = staticCases.concat(randomizedCases);
  for (const tc of testCases) {
    await testLogin(tc.testCase, tc.username, tc.password, tc.shouldSucceed);
  }
  writeHtmlReport();
})();
