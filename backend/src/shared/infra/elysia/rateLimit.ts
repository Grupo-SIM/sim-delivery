interface BucketState {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, BucketState>();

// Periodically evict expired buckets so the map can't grow unbounded under
// many unique IPs / long-lived processes.
const CLEANUP_INTERVAL_MS = 5 * 60_000;
const cleanupTimer = setInterval(() => {
	const now = Date.now();
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt < now) buckets.delete(key);
	}
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref?.();

export interface RateLimitOptions {
	max: number;
	windowMs: number;
	keyPrefix: string;
}

export interface RateLimitOutcome {
	allowed: boolean;
	remaining: number;
	retryAfterSeconds?: number;
}

export function consume(request: Request, options: RateLimitOptions): RateLimitOutcome {
	const forwarded = request.headers.get("x-forwarded-for");
	const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
	const key = `${options.keyPrefix}:${ip}`;
	const now = Date.now();
	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt < now) {
		buckets.set(key, { count: 1, resetAt: now + options.windowMs });
		return { allowed: true, remaining: options.max - 1 };
	}
	if (bucket.count >= options.max) {
		return {
			allowed: false,
			remaining: 0,
			retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
		};
	}
	bucket.count += 1;
	return { allowed: true, remaining: options.max - bucket.count };
}
