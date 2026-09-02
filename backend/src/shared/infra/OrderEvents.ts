type OrderListener = (unitId: string) => void;

/**
 * Delivers order-board invalidation signals to SSE connections in this process.
 * Orders in the database remain the source of truth, so clients always refetch.
 */
class OrderEvents {
	private readonly listenersByCompanyId = new Map<string, Set<OrderListener>>();
	private readonly listenersByUnitId = new Map<string, Set<OrderListener>>();

	publish(companyId: string, unitId: string) {
		for (const listener of this.listenersByCompanyId.get(companyId) ?? []) listener(unitId);
		for (const listener of this.listenersByUnitId.get(`${companyId}:${unitId}`) ?? []) listener(unitId);
	}

	publishCompany(companyId: string) {
		for (const listener of this.listenersByCompanyId.get(companyId) ?? []) listener("");
		for (const [key, listeners] of this.listenersByUnitId) {
			if (!key.startsWith(`${companyId}:`)) continue;
			for (const listener of listeners) listener("");
		}
	}

	subscribe(companyId: string, unitId: string | undefined, listener: OrderListener) {
		const listenersByKey = unitId ? this.listenersByUnitId : this.listenersByCompanyId;
		const key = unitId ? `${companyId}:${unitId}` : companyId;
		const listeners = listenersByKey.get(key) ?? new Set<OrderListener>();
		listeners.add(listener);
		listenersByKey.set(key, listeners);

		return () => {
			listeners.delete(listener);
			if (listeners.size === 0) listenersByKey.delete(key);
		};
	}
}

export const orderEvents = new OrderEvents();
