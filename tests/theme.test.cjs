const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

test('theme system: persistence, DOM attributes, and system fallback', () => {
  // Mock localStorage
  const storage = new Map();
  const mockLocalStorage = {
    getItem: (k) => storage.get(k) ?? null,
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  };

  // Mock DOM
  let matchMediaResult = false;
  const mockClassList = new Set();
  const mockRoot = {
    attributes: {},
    style: {},
    classList: {
      add: (...classes) => classes.forEach((c) => mockClassList.add(c)),
      remove: (...classes) => classes.forEach((c) => mockClassList.delete(c)),
      contains: (c) => mockClassList.has(c),
    },
    setAttribute: (k, v) => { mockRoot.attributes[k] = v; },
    getAttribute: (k) => mockRoot.attributes[k],
  };

  global.localStorage = mockLocalStorage;
  global.window = {
    matchMedia: () => ({
      matches: matchMediaResult,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  global.document = {
    documentElement: mockRoot,
  };

  const { getStoredTheme, applyThemeToDOM } = load('./src/lib/useTheme.ts');

  // 1. Default when unconfigured should be 'system'
  assert.equal(getStoredTheme(), 'system');

  // 2. System mode with dark OS preference
  matchMediaResult = true;
  assert.equal(applyThemeToDOM('system'), 'dark');
  assert.equal(mockRoot.getAttribute('data-theme'), 'dark');
  assert.equal(mockRoot.classList.contains('dark'), true);
  assert.equal(mockRoot.classList.contains('light'), false);
  assert.equal(mockRoot.style.colorScheme, 'dark');

  // 3. System mode with light OS preference
  matchMediaResult = false;
  assert.equal(applyThemeToDOM('system'), 'light');
  assert.equal(mockRoot.getAttribute('data-theme'), 'light');
  assert.equal(mockRoot.classList.contains('light'), true);
  assert.equal(mockRoot.classList.contains('dark'), false);
  assert.equal(mockRoot.style.colorScheme, 'light');

  // 4. Explicit 'dark' mode overrides OS preference
  matchMediaResult = false; // OS is light, but user chooses dark
  assert.equal(applyThemeToDOM('dark'), 'dark');
  assert.equal(mockRoot.getAttribute('data-theme'), 'dark');
  assert.equal(mockRoot.classList.contains('dark'), true);
  assert.equal(mockRoot.style.colorScheme, 'dark');

  // 5. Explicit 'light' mode overrides OS preference
  matchMediaResult = true; // OS is dark, but user chooses light
  assert.equal(applyThemeToDOM('light'), 'light');
  assert.equal(mockRoot.getAttribute('data-theme'), 'light');
  assert.equal(mockRoot.classList.contains('light'), true);
  assert.equal(mockRoot.style.colorScheme, 'light');

  // 6. Persistence round-trip
  mockLocalStorage.setItem('relay-theme', 'dark');
  assert.equal(getStoredTheme(), 'dark');

  mockLocalStorage.setItem('relay-theme', 'light');
  assert.equal(getStoredTheme(), 'light');

  // 7. Malformed storage recovery
  mockLocalStorage.setItem('relay-theme', 'invalid-theme-value');
  assert.equal(getStoredTheme(), 'system');
});
