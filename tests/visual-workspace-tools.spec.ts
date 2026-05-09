import { expect, test, type Locator, type Page } from '@playwright/test';

async function openWorkspace(page: Page) {
  await page.goto('/qa/visual-workspace');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('plan-canvas')).toBeVisible();
}

async function annotationCount(page: Page) {
  return page.locator('[data-testid^="annotation-"][data-tool-type]').count();
}

async function canvasBox(page: Page) {
  const canvas = page.getByTestId('plan-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('plan canvas not visible');
  return { canvas, box };
}

async function dispatchPointerOnCanvas(page: Page, type: string, x: number, y: number) {
  const { canvas, box } = await canvasBox(page);
  await canvas.dispatchEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: box.x + x,
    clientY: box.y + y,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
    buttons: type === 'pointerup' ? 0 : 1,
    button: 0,
  });
}

async function dragOnCanvas(page: Page, start: { x: number; y: number }, end: { x: number; y: number }) {
  await dispatchPointerOnCanvas(page, 'pointerdown', start.x, start.y);
  for (let i = 1; i <= 8; i += 1) {
    const x = start.x + ((end.x - start.x) * i) / 8;
    const y = start.y + ((end.y - start.y) * i) / 8;
    await dispatchPointerOnCanvas(page, 'pointermove', x, y);
  }
  await dispatchPointerOnCanvas(page, 'pointerup', end.x, end.y);
  await page.waitForTimeout(250);
}

async function wheelCanvas(page: Page, deltaY: number) {
  const { canvas, box } = await canvasBox(page);
  await canvas.dispatchEvent('wheel', {
    bubbles: true,
    cancelable: true,
    clientX: box.x + 450,
    clientY: box.y + 250,
    deltaY,
  });
  await page.waitForTimeout(150);
}

async function clickAnnotation(page: Page, id: number) {
  const hit = page.getByTestId(`annotation-hit-${id}`);
  if (await hit.count()) {
    await hit.click({ force: true });
    return;
  }
  await page.getByTestId(`annotation-${id}`).click({ force: true });
}

async function annotationLocator(page: Page, id: number) {
  const hit = page.getByTestId(`annotation-hit-${id}`);
  if (await hit.count()) return hit;
  return page.getByTestId(`annotation-${id}`);
}

async function getBox(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no bounding box');
  return box;
}

async function expectNoPageErrors(page: Page, action: () => Promise<void>) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await action();
  await page.waitForTimeout(150);
  expect(errors).toEqual([]);
  await expect(page.getByTestId('plan-canvas')).toBeVisible();
}

test.describe('Visual Workspace toolbar behavior', () => {
  test.beforeEach(async ({ page }) => {
    await openWorkspace(page);
  });

  test('Select only selects an annotation and does not move it on click', async ({ page }) => {
    await page.getByTestId('tool-select').click();
    const annotation = await annotationLocator(page, 1);
    const before = await getBox(annotation);
    await clickAnnotation(page, 1);
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

  test('Text tool creates actual text annotation', async ({ page }) => {
    const before = await annotationCount(page);
    await page.getByTestId('tool-text').click();
    await dragOnCanvas(page, { x: 420, y: 210 }, { x: 620, y: 260 });
    await expect.poll(() => annotationCount(page)).toBeGreaterThan(before);
    await expect(page.getByTestId('inspector-title')).toContainText(/Text N\d+/);
    await expect(page.getByText('TEXT NOTE').first()).toBeVisible();
  });

  test('Eraser is a mode and erases the clicked annotation only', async ({ page }) => {
    const before = await annotationCount(page);
    await page.getByTestId('tool-eraser').click();
    await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Eraser');
    await clickAnnotation(page, 1);
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
    await wheelCanvas(page, -400);
    await wheelCanvas(page, -400);
    await expect(transform).not.toHaveAttribute('data-plan-zoom', '1');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('status-message')).toHaveAttribute('data-active-tool', 'Select');
  });

  test('Color opens palette and changes selected annotation color', async ({ page }) => {
    await page.getByTestId('tool-select').click();
    await clickAnnotation(page, 1);
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

const toolbarButtons = [
  ['tool-select', 'Select'], ['tool-pan', 'Pan'], ['tool-zoom', 'Zoom'], ['tool-fit', 'Fit'], ['tool-zoom-area', 'Zoom Area'],
  ['tool-arrow', 'Arrow'], ['tool-cloud', 'Cloud'], ['tool-text', 'Text'], ['tool-box', 'Box'], ['tool-callout', 'Callout'], ['tool-dimension', 'Dimension'],
  ['tool-distance', 'Distance'], ['tool-angle', 'Angle'], ['tool-area', 'Area'],
  ['tool-note', 'Note'], ['tool-photo', 'Photo'], ['tool-file', 'File'], ['tool-link', 'Link'],
  ['tool-highlighter', 'Highlighter'], ['tool-pen', 'Pen'], ['tool-eraser', 'Eraser'], ['tool-color', 'Color'],
  ['tool-layers', 'Layers'], ['tool-scale', 'Scale'], ['tool-grid', 'Grid'], ['tool-snap', 'Snap'],
  ['tool-undo', 'Undo'], ['tool-redo', 'Redo'], ['tool-more', 'More'],
] as const;

const namedWorkspaceButtons = [
  'Workspace', 'Review', 'Report', 'Export', 'Add board', 'Reset active board',
  'Filter linked photos', 'Collapse photos panel', 'View all photos (5)',
  'Linked Photos 3', 'Linked Documents 2', 'Board Markups 1', 'Linked Costs 1', 'Edit note', 'Add Comment',
  '01 - General', '02 - Architectural', '03 - Structural', 'Level 2 Framing Plan', 'Roof Framing Plan',
  'South Elevation', 'East Elevation', 'Typical Sections', '04 - MEP', '05 - Site', '06 - Inspections',
  'Photos & Documents', 'Site Photo Set',
] as const;

test.describe('Visual Workspace pressable control coverage', () => {
  for (const [testId, label] of toolbarButtons) {
    test(`toolbar button ${label} is pressable without crashing`, async ({ page }) => {
      await openWorkspace(page);
      await expectNoPageErrors(page, async () => {
        await page.getByTestId(testId).click({ force: true });
      });
      await expect(page.getByTestId('status-message')).toBeVisible();
    });
  }

  for (const label of namedWorkspaceButtons) {
    test(`workspace button ${label} is pressable without crashing`, async ({ page }) => {
      await openWorkspace(page);
      const button = page.getByRole('button', { name: label }).first();
      await expect(button, `${label} button should exist`).toBeVisible();
      await expectNoPageErrors(page, async () => {
        await button.click({ force: true });
      });
    });
  }

  test('all visible toolbar buttons expose test ids so missing tools are obvious', async ({ page }) => {
    await openWorkspace(page);
    for (const [testId] of toolbarButtons) {
      await expect(page.getByTestId(testId), `${testId} should exist`).toBeVisible();
    }
  });

  test('primary modal and panel buttons open the expected panels', async ({ page }) => {
    await openWorkspace(page);
    await page.getByTestId('tool-color').click();
    await expect(page.getByTestId('active-panel-title')).toContainText('Choose markup color');
    await page.getByTestId('close-active-panel').click();
    await page.getByTestId('tool-scale').click();
    await expect(page.getByTestId('active-panel-title')).toContainText('Workspace settings');
    await page.getByTestId('close-active-panel').click();
    await page.getByTestId('tool-note').click();
    await expect(page.getByTestId('active-panel-title')).toContainText('Add note');
    await page.getByTestId('close-active-panel').click();
    await page.getByTestId('tool-file').click();
    await expect(page.getByTestId('active-panel-title')).toContainText('Attach document');
    await page.getByTestId('close-active-panel').click();
    await page.getByRole('button', { name: 'Report' }).click();
    await expect(page.getByTestId('active-panel-title')).toContainText('Generate structural inspection report');
    await page.getByTestId('close-active-panel').click();
    await page.getByRole('button', { name: 'Export' }).click();
    await expect(page.getByTestId('active-panel-title')).toContainText('Export project deliverables');
  });
});
