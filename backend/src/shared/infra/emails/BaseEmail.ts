import { emailBranding } from "@/shared/infra/branding";
import { mailer } from "@/shared/infra/mail";

export interface EmailTransport {
	sendMail(message: { from: string; html?: string; subject: string; text: string; to: string }): Promise<unknown>;
}

export abstract class BaseEmail {
	protected readonly to: string;

	protected constructor(to: string, protected readonly transport: EmailTransport = mailer) {
		this.to = to;
	}

	protected abstract get subject(): string;
	protected abstract get text(): string;

	protected get html(): string | Promise<string> | undefined {
		return undefined;
	}

	protected get from(): string {
		const address = process.env.MAIL_FROM ?? process.env.MAIL_USER;
		return address?.includes("<") ? address : `"${emailBranding.companyName}" <${address}>`;
	}

	async send(): Promise<void> {
		await this.transport.sendMail({
			from: this.from,
			html: this.html ? await this.html : undefined,
			subject: this.subject,
			text: this.text,
			to: this.to,
		});
	}
}
