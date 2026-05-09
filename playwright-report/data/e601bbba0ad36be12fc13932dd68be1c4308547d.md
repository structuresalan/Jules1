# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-workspace-tools.spec.ts >> Visual Workspace toolbar behavior >> Text tool prompts for text and creates actual text annotation
- Location: tests\visual-workspace-tools.spec.ts:61:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('SimplifyStruct')
Expected: visible
Error: strict mode violation: getByText('SimplifyStruct') resolved to 3 elements:
    1) <h1 class="text-4xl font-semibold tracking-tight text-white md:text-6xl">SimplifyStruct. Now in Desktop Style.</h1> aka getByRole('heading', { name: 'SimplifyStruct. Now in' })
    2) <h2 class="text-center text-2xl font-bold text-white">Sign in to SimplifyStruct</h2> aka getByRole('heading', { name: 'Sign in to SimplifyStruct' })
    3) <p class="mt-3 text-center text-slate-300">Sign in with your SimplifyStruct account.</p> aka getByText('Sign in with your')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('SimplifyStruct')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img "SimplifyStruct logo" [ref=e7]
    - heading "SimplifyStruct. Now in Desktop Style." [level=1] [ref=e8]
    - paragraph [ref=e9]: A darker, glass-based workspace for structural design, documents, and visual maps.
  - generic [ref=e10]:
    - img [ref=e17]
    - heading "Sign in to SimplifyStruct" [level=2] [ref=e20]
    - paragraph [ref=e21]: Sign in with your SimplifyStruct account.
    - generic [ref=e22]:
      - button "Sign in" [ref=e23] [cursor=pointer]
      - button "Create account" [ref=e24] [cursor=pointer]
    - generic [ref=e25]: Firebase is not configured yet. Add the Firebase environment variables in Vercel, then redeploy.
    - generic [ref=e26]:
      - generic [ref=e27]:
        - text: Email
        - textbox "Email" [ref=e28]:
          - /placeholder: you@example.com
      - generic [ref=e29]:
        - text: Password
        - textbox "Password" [ref=e30]
      - button "Sign In" [disabled] [ref=e31]
```

# Test source

```ts
  1   | import { expect, test, type Locator, type Page } from '@playwright/test';
  2   | 
  3   | async function openWorkspace(page: Page) {
  4   |   await page.goto('/visual-workspace');
> 5   |   await expect(page.getByText('SimplifyStruct')).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  6   |   await expect(page.getByTestId('plan-canvas')).toBeVisible();
  7   | }
  8   | 
  9   | async function annotationCount(page: Page) {
  10  |   return page.locator('[data-testid^="annotation-"]').count();
  11  | }
  12  | 
  13  | async function dragOnCanvas(page: Page, start: { x: number; y: number }, end: { x: number; y: number }) {
  14  |   const canvas = page.getByTestId('plan-canvas');
  15  |   const box = await canvas.boundingBox();
  16  |   if (!box) throw new Error('plan canvas not visible');
  17  | 
  18  |   await page.mouse.move(box.x + start.x, box.y + start.y);
  19  |   await page.mouse.down();
  20  |   await page.mouse.move(box.x + end.x, box.y + end.y, { steps: 8 });
  21  |   await page.mouse.up();
  22  | }
  23  | 
  24  | async function getBox(locator: Locator) {
  25  |   const box = await locator.boundingBox();
  26  |   if (!box) throw new Error('element has no bounding box');
  27  |   return box;
  28  | }
  29  | 
  30  | test.describe('Visual Workspace toolbar behavior', () => {
  31  |   test.beforeEach(async ({ page }) => {
  32  |     await openWorkspace(page);
  33  |   });
  34  | 
  35  |   test('Select only selects an annotation and does not move it on click', async ({ page }) => {
  36  |     await page.getByTestId('tool-select').click();
  37  | 
  38  |     const annotation = page.getByTestId('annotation-1');
  39  |     const before = await getBox(annotation);
  40  | 
  41  |     await annotation.click({ position: { x: 10, y: 10 } });
  42  |     await expect(page.getByTestId('inspector-title')).toContainText(/B12|N1|Text|Beam/);
  43  | 
  44  |     const after = await getBox(annotation);
  45  |     expect(Math.abs(after.x - before.x)).toBeLessThan(2);
  46  |     expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  47  |   });
  48  | 
  49  |   test('Cloud tool creates a new annotation from a drag', async ({ page }) => {
  50  |     const before = await annotationCount(page);
  51  | 
  52  |     await page.getByTestId('tool-cloud').click();
  53  |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Cloud');
  54  | 
  55  |     await dragOnCanvas(page, { x: 360, y: 180 }, { x: 560, y: 260 });
  56  | 
  57  |     await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
  58  |     await expect(page.getByTestId('inspector-title')).toBeVisible();
  59  |   });
  60  | 
  61  |   test('Text tool prompts for text and creates actual text annotation', async ({ page }) => {
  62  |     const before = await annotationCount(page);
  63  | 
  64  |     page.once('dialog', async (dialog) => {
  65  |       expect(dialog.type()).toBe('prompt');
  66  |       await dialog.accept('FIELD NOTE TEST');
  67  |     });
  68  | 
  69  |     await page.getByTestId('tool-text').click();
  70  |     await dragOnCanvas(page, { x: 420, y: 210 }, { x: 620, y: 260 });
  71  | 
  72  |     await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
  73  |     await expect(page.getByText('FIELD NOTE TEST')).toBeVisible();
  74  |   });
  75  | 
  76  |   test('Eraser is a mode and erases the clicked annotation only', async ({ page }) => {
  77  |     const before = await annotationCount(page);
  78  | 
  79  |     await page.getByTestId('tool-eraser').click();
  80  |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');
  81  | 
  82  |     await page.getByTestId('annotation-1').click();
  83  | 
  84  |     await expect.poll(() => annotationCount(page)).toBe(before - 1);
  85  |     await expect(page.getByTestId('plan-canvas')).toBeVisible();
  86  |   });
  87  | 
  88  |   test('Escape cancels active tool back to Select', async ({ page }) => {
  89  |     await page.getByTestId('tool-eraser').click();
  90  |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');
  91  | 
  92  |     await page.keyboard.press('Escape');
  93  | 
  94  |     await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Select');
  95  |   });
  96  | 
  97  |   test('Pan moves the view and Fit resets it', async ({ page }) => {
  98  |     const transform = page.getByTestId('plan-transform');
  99  | 
  100 |     await page.getByTestId('tool-pan').click();
  101 |     await dragOnCanvas(page, { x: 360, y: 240 }, { x: 440, y: 300 });
  102 | 
  103 |     await expect(transform).not.toHaveAttribute('data-plan-pan-x', '0');
  104 | 
  105 |     await page.getByTestId('tool-fit').click();
```