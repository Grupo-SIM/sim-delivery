import { describe, expect, it } from "bun:test";
import { orderEvents } from "./OrderEvents";

describe("orderEvents", () => {
	it("delivers a unit change to the matching unit and company subscribers", () => {
		const companyUpdates: string[] = [];
		const unitUpdates: string[] = [];
		const otherUnitUpdates: string[] = [];
		const unsubscribeCompany = orderEvents.subscribe("company_1", undefined, unitId => companyUpdates.push(unitId));
		const unsubscribeUnit = orderEvents.subscribe("company_1", "unit_1", unitId => unitUpdates.push(unitId));
		const unsubscribeOtherUnit = orderEvents.subscribe("company_1", "unit_2", unitId => otherUnitUpdates.push(unitId));

		orderEvents.publish("company_1", "unit_1");

		expect(companyUpdates).toEqual(["unit_1"]);
		expect(unitUpdates).toEqual(["unit_1"]);
		expect(otherUnitUpdates).toEqual([]);
		unsubscribeCompany();
		unsubscribeUnit();
		unsubscribeOtherUnit();
	});

	it("stops delivery after unsubscribe", () => {
		const updates: string[] = [];
		const unsubscribe = orderEvents.subscribe("company_2", "unit_1", unitId => updates.push(unitId));
		unsubscribe();

		orderEvents.publish("company_2", "unit_1");

		expect(updates).toEqual([]);
	});

	it("delivers company-wide board changes to every unit subscriber", () => {
		const firstUnitUpdates: string[] = [];
		const secondUnitUpdates: string[] = [];
		const unsubscribeFirst = orderEvents.subscribe("company_3", "unit_1", unitId => firstUnitUpdates.push(unitId));
		const unsubscribeSecond = orderEvents.subscribe("company_3", "unit_2", unitId => secondUnitUpdates.push(unitId));

		orderEvents.publishCompany("company_3");

		expect(firstUnitUpdates).toEqual([""]);
		expect(secondUnitUpdates).toEqual([""]);
		unsubscribeFirst();
		unsubscribeSecond();
	});
});
