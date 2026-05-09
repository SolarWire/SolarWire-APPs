import { test, expect } from '@playwright/test';

test.describe('Monaco Editor - SolarWire Syntax Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.monaco-editor', { state: 'visible' });
    await page.waitForTimeout(2000);
  });

  test('editor should be loaded with solarwire language', async ({ page }) => {
    const editor = page.locator('.monaco-editor');
    await expect(editor).toBeVisible();

    const language = await page.evaluate(() => {
      const editor = (window as any).monaco?.editor?.getEditors?.()[0];
      return editor?.getModel()?.getLanguageId();
    });

    expect(language).toBe('solarwire');
  });

  test('should have solarwire theme applied', async ({ page }) => {
    const themeName = await page.evaluate(() => {
      const editor = (window as any).monaco?.editor?.getEditors?.()[0];
      return editor?._themeData?.themeName;
    });

    expect(themeName).toMatch(/solarwire-(light|dark)/);
  });

  test('should have syntax highlighting tokens', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).monaco?.editor?.getEditors?.()[0];
      if (editor) {
        editor.setValue('!title="Test Page"\n["Button"] @(100,50) w=120 h=40 bg=#3B82F6');
      }
    });

    await page.waitForTimeout(500);

    const hasTokens = await page.evaluate(() => {
      const editor = (window as any).monaco?.editor?.getEditors?.()[0];
      const model = editor?.getModel();
      if (!model) return false;

      const tokens = model.getLineTokens(1);
      return tokens.getCount() > 0;
    });

    expect(hasTokens).toBe(true);
  });

  test('should have completion provider registered', async ({ page }) => {
    const hasCompletion = await page.evaluate(() => {
      const monaco = (window as any).monaco;
      if (!monaco) return false;

      const providers = monaco.languages.registeredCompletionItemProviders?.('solarwire');
      return Array.isArray(providers) && providers.length > 0;
    });

    expect(hasCompletion).toBe(true);
  });

  test('should trigger completion on key press', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).monaco?.editor?.getEditors?.()[0];
      if (editor) {
        editor.setValue('');
        editor.focus();
      }
    });

    await page.keyboard.type('!');
    await page.waitForTimeout(300);

    const suggestionsVisible = await page.evaluate(() => {
      return document.querySelector('.suggest-widget') !== null;
    });

    expect(suggestionsVisible).toBe(true);
  });

  test('should highlight rectangle element with colors', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).monaco?.editor?.getEditors?.()[0];
      if (editor) {
        editor.setValue('["Button"] @(100,50) w=120 h=40 bg=#3B82F6');
      }
    });

    await page.waitForTimeout(500);

    const hasColoredSpans = await page.evaluate(() => {
      const lines = document.querySelectorAll('.view-lines .view-line');
      if (lines.length === 0) return false;

      const firstLine = lines[0];
      const spans = firstLine.querySelectorAll('span');
      const hasColor = Array.from(spans).some(
        (span) => {
          const style = window.getComputedStyle(span);
          return style.color !== '' && style.color !== 'rgb(0, 0, 0)';
        }
      );
      return hasColor;
    });

    expect(hasColoredSpans).toBe(true);
  });

  test('should have bracket pair colorization enabled', async ({ page }) => {
    const bracketColorization = await page.evaluate(() => {
      const editor = (window as any).monaco?.editor?.getEditors?.()[0];
      const options = editor?.getOptions?.();
      return options?.get?.(0);
    });

    const bracketEnabled = await page.evaluate(() => {
      const editor = (window as any).monaco?.editor?.getEditors?.()[0];
      return editor?.getOption?.('bracketPairColorization')?.enabled ?? false;
    });

    expect(bracketEnabled).toBe(true);
  });

  test('should have auto-closing pairs configured', async ({ page }) => {
    const autoClosing = await page.evaluate(() => {
      const editor = (window as any).monaco?.editor?.getEditors?.()[0];
      return editor?.getOption('autoClosingPairs');
    });

    expect(autoClosing).toBeDefined();
  });
});
