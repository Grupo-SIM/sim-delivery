import { describe, expect, it } from "bun:test";
import { paymentStatusEvents } from "./PaymentStatusEvents";

describe("paymentStatusEvents", () => {
	it("delivers a status only while the listener is subscribed", () => {
		const received: string[] = [];
		const unsubscribe = paymentStatusEvents.subscribe("token_1", status => received.push(status));

		paymentStatusEvents.publish("token_1", "confirmed");
		unsubscribe();
		paymentStatusEvents.publish("token_1", "confirmed");

		expect(received).toEqual(["confirmed"]);
	});
});
