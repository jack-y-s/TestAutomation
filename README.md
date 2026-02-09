# Login Automation Project

This project is a simple Node.js + Express login web app with automated browser tests using Playwright Test, written in TypeScript.

## Features
- Hardcoded login logic with session management
- Data-driven Playwright Test suite (positive and negative cases)
- HTML test reports with screenshots on failure
- CI/CD workflow (GitHub Actions)

## Prerequisites
- Node.js (v18 or newer recommended)
- npm (comes with Node.js)

## Setup
1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Install dependencies:
   ```
   npm install
   ```

## Running the Application
Start the server (builds TypeScript first):
```
npm start
```
The app will be available at http://localhost:3000

## Running Tests
In a separate terminal, run:
```
npx playwright test
```

## Viewing the Test Report
After tests complete, view the HTML report:
```
npx playwright show-report
```

## Project Structure
- `server.ts` - Express server (TypeScript source)
- `dist/` - Compiled JavaScript output
- `public/` - Static assets (CSS)
- `views/` - HTML pages
- `tests/login.spec.ts` - Playwright Test suite (TypeScript)
- `test-cases.json` - Test data
- `playwright.config.ts` - Playwright configuration (TypeScript)
- `.github/workflows/ci.yml` - CI/CD workflow

## Notes
- Screenshots for failed tests are included in the HTML report.
- Do not commit `node_modules/` or `playwright-report/` folders.

## License
MIT
