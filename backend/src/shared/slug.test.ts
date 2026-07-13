import { describe, expect, it } from "bun:test";
import { slugify } from "./slug";

describe("slugify", () => {
	it("removes accents and separates words", () => {
		expect(slugify("Ipês", "unidade")).toBe("ipes");
		expect(slugify("Pão de queijo", "produto")).toBe("pao-de-queijo");
	});
});
