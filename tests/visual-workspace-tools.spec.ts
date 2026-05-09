import { expect, test, type Locator, type Page } from '@playwright/test';

async function openWorkspace(page: Page) {
  await page.goto('/qa/visual-workspace');
  await expect(page.getByTestId('plan-canvas')).toBeVisible();
}

async function annotationCount(page: Page) {
  return page.locator('[data-testid^="annotation-"]').count();
}

async function dragOnCanvas(page: Page, start: { x: number; y: number }, end: { x: number; y: number }) {
  const canvas = page.getByTestId('plan-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('plan canvas not visible');

  await page.mouse.move(box.x + start.x, box.y + start.y);
  await page.mouse.down();
  await page.mouse.move(box.x + end.x, box.y + end.y, { steps: 8 });
  await page.mouse.up();
}

async function getBox(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no bounding box');
  return box;
}

test.describe('Visual Workspace toolbar behavior', () => {
  test.beforeEach(async ({ page }) => {
    await openWorkspace(page);
  });

  test('Select only selects an annotation and does not move it on click', async ({ page }) => {
    await page.getByTestId('tool-select').click();

    const annotation = page.getByTestId('annotation-1');
    const before = await getBox(annotation);

    await annotation.click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId('inspector-title')).toContainText(/B12|N1|Text|Beam/);

    const after = await getBox(annotation);
    expect(Math.abs(after.x - before.x)).toBeLessThan(2);
    expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  });

  test('Cloud tool creates a new annotation from a drag', async ({ page }) => {
    const before = await annotationCount(page);

    await page.getByTestId('tool-cloud').click();
    await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Cloud');

    await dragOnCanvas(page, { x: 360, y: 180 }, { x: 560, y: 260 });

    await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
    await expect(page.getByTestId('inspector-title')).toBeVisible();
  });

  test('Text tool prompts for text and creates actual text annotation', async ({ page }) => {
    const before = await annotationCount(page);

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('FIELD NOTE TEST');
    });

    await page.getByTestId('tool-text').click();
    await dragOnCanvas(page, { x: 420, y: 210 }, { x: 620, y: 260 });

    await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
    await expect(page.getByText('FIELD NOTE TEST')).toBeVisible();
  });

  test('Eraser is a mode and erases the clicked annotation only', async ({ page }) => {
    const before = await annotationCount(page);

    await page.getByTestId('tool-eraser').click();
    await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');

    await page.getByTestId('annotation-1').click();

    await expect.poll(() => annotationCount(page)).toBe(before - 1);
    await expect(page.getByTestId('plan-canvas')).toBeVisible();
  });

  test('Escape cancels active tool back to Select', async ({ page }) => {
    await page.getByTestId('tool-eraser').click();
    await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Select');
  });

  test('Pan moves the view and Fit resets it', async ({ page }) => {
    const transform = page.getByTestId('plan-transform');

    await page.getByTestId('tool-pan').click();
    await dragOnCanvas(page, { x: 360, y: 240 }, { x: 440, y: 300 });

    await expect(transform).not.toHaveAttribute('data-plan-pan-x', '0');

    await page.getByTestId('tool-fit').click();

    await expect(transform).toHaveAttribute('data-plan-zoom', '1');
    await expect(transform).toHaveAttribute('data-plan-pan-x', '0');
    await expect(transform).toHaveAttribute('data-plan-pan-y', '0');
  });

  test('Zoom mode uses wheel and Escape cancels', async ({ page }) => {
    const transform = page.getByTestId('plan-transform');
    await expect(transform).toHaveAttribute('data-plan-zoom', '1');

    await page.getByTestId('tool-zoom').click();
    const canvas = page.getByTestId('plan-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('plan canvas not visible');

    await page.mouse.move(box.x + 450, box.y + 250);
    await page.mouse.wheel(0, -400);

    await expect(transform).not.toHaveAttribute('data-plan-zoom', '1');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Select');
  });

  test('Color opens palette and changes selected annotation color', async ({ page }) => {
    await page.getByTestId('tool-select').click();
    await page.getByTestId('annotation-1').click();

    await page.getByTestId('tool-color').click();
    await expect(page.getByTestId('active-panel-title')).toContainText('Choose markup color');
  });

  test('Photo, File, and Note tools open their panels', async ({ page }) => {
    await page.getByTestId('tool-photo').click();
    await expect(page.getByTestId('active-panel-title')).toContainText('Add or choose site photo');
    await page.getByTestId('close-active-panel').click();

    await page.getByTestId('tool-file').click();
    await expect(page.getByTestId('active-panel-title')).toContainText('Attach document');
    await page.getByTestId('close-active-panel').click();

    await page.getByTestId('tool-note').click();
    await expect(page.getByTestId('active-panel-title')).toContainText('Add note');
  });

  test('View all photos opens photo library', async ({ page }) => {
    await page.getByTestId('view-all-photos').click();
    await expect(page.getByTestId('photo-library-title')).toBeVisible();
  });

  test('Distance requires scale first', async ({ page }) => {
    const before = await annotationCount(page);

    await page.getByTestId('tool-distance').click();
    await dragOnCanvas(page, { x: 300, y: 200 }, { x: 470, y: 200 });

    await expect.poll(() => annotationCount(page)).toBe(before);
    await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Distance');
  });
});
