import type { HSV, RGB } from "./types";

export function isValidHex(value: string): boolean {
	return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function hexToRgb(hex: string): RGB {
	return {
		b: Number.parseInt(hex.slice(5, 7), 16),
		g: Number.parseInt(hex.slice(3, 5), 16),
		r: Number.parseInt(hex.slice(1, 3), 16),
	};
}

export function rgbToHex({ b, g, r }: RGB): string {
	const toByte = (n: number) =>
		Math.round(Math.min(255, Math.max(0, n)))
			.toString(16)
			.padStart(2, "0");
	return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

export function hexToHsv(hex: string): HSV {
	const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;

	let h = 0;
	if (delta !== 0) {
		if (max === r) h = (((g - b) / delta) % 6) * 60;
		else if (max === g) h = ((b - r) / delta + 2) * 60;
		else h = ((r - g) / delta + 4) * 60;
	}
	if (h < 0) h += 360;

	const s = max === 0 ? 0 : delta / max;
	const v = max;

	return { h, s, v };
}

export function hsvToHex({ h, s, v }: HSV): string {
	const c = v * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = v - c;

	let [r, g, b] = [0, 0, 0];
	if (h < 60) [r, g, b] = [c, x, 0];
	else if (h < 120) [r, g, b] = [x, c, 0];
	else if (h < 180) [r, g, b] = [0, c, x];
	else if (h < 240) [r, g, b] = [0, x, c];
	else if (h < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];

	const toByte = (n: number) =>
		Math.round((n + m) * 255)
			.toString(16)
			.padStart(2, "0");

	return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}
