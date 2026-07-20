/**
 * Persisted zustand stores read `window.localStorage`, which bun's test runtime has no DOM
 * for — without a stub `persist` disables itself and every write logs a warning.
 * Install this *before* importing the store under test, then assert against the returned map.
 */
export function installLocalStorageStub(): Map<string, string> {
	const storage = new Map<string, string>();

	const localStorage = {
		clear: () => storage.clear(),
		getItem: (key: string) => storage.get(key) ?? null,
		key: (index: number) => [...storage.keys()][index] ?? null,
		get length() {
			return storage.size;
		},
		removeItem: (key: string) => storage.delete(key),
		setItem: (key: string, value: string) => storage.set(key, value),
	};

	Object.defineProperty(globalThis, "localStorage", { configurable: true, value: localStorage });
	Object.defineProperty(globalThis, "window", {
		configurable: true,
		value: { ...(globalThis.window ?? {}), localStorage },
	});

	return storage;
}
