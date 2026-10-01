import { render } from "@react-email/components";
import { MagicLinkEmailTemplate } from "@/modules/users/emails/MagicLinkEmail";
import { BaseEmail } from "./BaseEmail";

interface MagicLinkEmailInput {
	to: string;
	url: string;
}

export class MagicLinkEmail extends BaseEmail {
	private readonly url: string;

	constructor({ to, url }: MagicLinkEmailInput) {
		super(to);
		this.url = url;
	}

	protected readonly subject = "Seu link de acesso";

	protected get text(): string {
		return `Acesse sua conta: ${this.url}. O link expira em 30 minutos.`;
	}

	protected override get html(): Promise<string> {
		return render(MagicLinkEmailTemplate({ url: this.url }));
	}
}
