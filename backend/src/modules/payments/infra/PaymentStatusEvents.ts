type PaymentStatusListener = (status: string) => void;

/**
 * Delivers persisted payment status changes to SSE connections in this process.
 * The database remains the source of truth; reconnecting clients read it again.
 */
class PaymentStatusEvents {
	private readonly listenersByToken = new Map<string, Set<PaymentStatusListener>>();

	publish(token: string, status: string) {
		for (const listener of this.listenersByToken.get(token) ?? []) listener(status);
	}

	subscribe(token: string, listener: PaymentStatusListener) {
		const listeners = this.listenersByToken.get(token) ?? new Set<PaymentStatusListener>();
		listeners.add(listener);
		this.listenersByToken.set(token, listeners);

		return () => {
			listeners.delete(listener);
			if (listeners.size === 0) this.listenersByToken.delete(token);
		};
	}
}

export const paymentStatusEvents = new PaymentStatusEvents();
