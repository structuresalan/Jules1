# package.json additions

The uploaded patch zip did not include your root `package.json`, so apply these changes manually.

Install Playwright:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Add scripts:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

Then run:

```bash
npm run test:e2e
```
