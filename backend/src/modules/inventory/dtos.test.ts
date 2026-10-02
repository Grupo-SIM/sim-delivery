import { describe, expect, test } from "bun:test";
import { Value } from "@sinclair/typebox/value";
import { CreateInventoryMovementBody } from "./dtos";

describe("CreateInventoryMovementBody", () => {
	for (const type of ["entry", "adjustment", "loss"] as const) {
		for (const reason of [undefined, "", "Compra semanal"]) {
			test(`accepts ${type} with reason ${JSON.stringify(reason)}`, () => {
				expect(
					Value.Check(CreateInventoryMovementBody, {
						inventoryItemId: "cmuq4w0al000a01teghat65ku",
						quantity: 0.001,
						...(reason === undefined ? {} : { reason }),
						type,
						unitCostCents: 2000,
						unitId: "cmuq0q97v000201qginb30m9x",
					}),
				).toBe(true);
			});
		}
	}
});
