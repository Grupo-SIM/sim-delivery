import { beforeEach, describe, expect, it, mock } from "bun:test";

let id = 0;

mock.module("react", () => ({
	useCallback: <T extends (...args: never[]) => unknown>(callback: T) => callback,
	useId: () => `test-${++id}`,
	useLayoutEffect: (effect: () => void | (() => void)) => {
		effect();
	},
	useRef: <T>(initialValue: T) => ({ current: initialValue }),
}));

interface BrowserEntry {
	state: Record<string, unknown> | null;
	url: URL;
}

function createBrowser() {
	let entries: BrowserEntry[] = [];
	let index = -1;
	const popStateListeners: (() => void)[] = [];
	const location = { href: "" };
	const scrollCalls: ScrollToOptions[] = [];

	function reset(url: string) {
		entries = [{ state: null, url: new URL(url) }];
		index = 0;
		location.href = entries[0].url.href;
		scrollCalls.length = 0;
	}

	function setCurrent(entry: BrowserEntry) {
		entries[index] = entry;
		location.href = entry.url.href;
	}

	const history = {
		back: () => {
			if (index === 0) return;
			index -= 1;
			location.href = entries[index].url.href;
			for (const listener of popStateListeners) listener();
		},
		pushState: (state: Record<string, unknown>, _unused: string, url: string) => {
			entries = entries.slice(0, index + 1);
			entries.push({ state, url: new URL(url, location.href) });
			index += 1;
			location.href = entries[index].url.href;
		},
		replaceState: (state: Record<string, unknown>, _unused: string, url: string) => {
			setCurrent({ state, url: new URL(url, location.href) });
		},
		get state() {
			return entries[index].state;
		},
	};

	const windowStub = {
		addEventListener: (event: string, listener: () => void) => {
			if (event === "popstate") popStateListeners.push(listener);
		},
		history,
		location,
		requestAnimationFrame: (callback: () => void) => {
			callback();
			return 1;
		},
		scrollTo: (options: ScrollToOptions) => {
			scrollCalls.push(options);
		},
		scrollX: 0,
		scrollY: 0,
	};

	reset("https://delivery.test/boa-viagem");
	return { reset, scrollCalls, windowStub };
}

const browser = createBrowser();
Object.defineProperty(globalThis, "window", { configurable: true, value: browser.windowStub });

const { closeActiveModalHistory, useModalHistory } = await import("./use-modal-history");

describe("modal history", () => {
	beforeEach(() => browser.reset("https://delivery.test/boa-viagem"));

	it("closes a modal without leaving the current unit", () => {
		let closed = 0;
		const close = useModalHistory({
			isOpen: true,
			onClose: () => {
				closed += 1;
			},
			urlKey: "product-details",
			urlState: "product-1",
		});

		expect(window.location.href).toContain("modal=product-details");
		expect(browser.scrollCalls).toEqual([{ behavior: "instant", left: 0, top: 0 }]);
		close();

		expect(closed).toBe(1);
		expect(window.location.href).toBe("https://delivery.test/boa-viagem");
	});

	it("lets a successful modal action close the active entry", () => {
		let closed = 0;
		useModalHistory({
			isOpen: true,
			onClose: () => {
				closed += 1;
			},
			urlKey: "product-details",
		});

		closeActiveModalHistory();

		expect(closed).toBe(1);
		expect(window.location.href).toBe("https://delivery.test/boa-viagem");
	});

	it("leaves route-controlled modal history to its route callback", () => {
		let closed = 0;
		const close = useModalHistory({
			historyMode: "none",
			isOpen: true,
			onClose: () => {
				closed += 1;
			},
			urlKey: "product-details",
		});

		close();

		expect(closed).toBe(1);
		expect(window.location.href).toBe("https://delivery.test/boa-viagem");
	});

	it("closes only the product submodal and preserves its cart parent", () => {
		let cartClosed = 0;
		let productClosed = 0;
		useModalHistory({
			isOpen: true,
			onClose: () => {
				cartClosed += 1;
			},
			urlKey: "cart",
		});
		useModalHistory({
			isOpen: true,
			onClose: () => {
				productClosed += 1;
			},
			urlKey: "product-details",
		});

		closeActiveModalHistory();

		expect(productClosed).toBe(1);
		expect(cartClosed).toBe(0);
		expect(window.location.href).toContain("modal=cart");

		closeActiveModalHistory();
	});
});
