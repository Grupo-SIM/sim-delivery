/** Rate limit automatic recovery per session in this backend instance. */
export class WhatsAppSessionRecovery {
	private readonly attempts = new Map<string, number>();

	constructor(private readonly now = Date.now) {}

	shouldRestart(companySlug: string, sessionName: string): boolean {
		if (companySlug !== "zero-grau") return false;
		const now = this.now();
		const previous = this.attempts.get(sessionName);
		if (previous !== undefined && now - previous < 60_000) return false;
		this.attempts.set(sessionName, now);
		return true;
	}
}
