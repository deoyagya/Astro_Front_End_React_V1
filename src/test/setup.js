import '@testing-library/jest-dom/vitest';

function createStorage() {
  const store = new Map();
  return {
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, String(value)),
    get length() {
      return store.size;
    },
  };
}

const storage = createStorage();

Object.defineProperty(window, 'localStorage', {
  value: storage,
  configurable: true,
});

Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true,
});
