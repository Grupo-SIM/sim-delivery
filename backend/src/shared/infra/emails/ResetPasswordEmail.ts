import { render } from "@react-email/components";
import { ResetPasswordEmailTemplate } from "@/modules/users/emails/ResetPasswordEmail";
import { BaseEmail } from "./BaseEmail";

interface ResetPasswordEmailInput {
	name: string;
	to: string;
	url: string;
}

export class ResetPasswordEmail extends BaseEmail {
	private readonly name: string;
	private readonly url: string;

	constructor({ name, to, url }: ResetPasswordEmailInput) {
		super(to);
		this.name = name;
		this.url = url;
	}

	protected readonly subject = "Defina sua senha";

	protected get text(): string {
		return `Olá, ${this.name}! Acesse o link para definir sua senha: ${this.url}. O link expira em 7 dias e pode ser usado uma única vez.`;
	}

	protected override get html(): Promise<string> {
		return render(ResetPasswordEmailTemplate({ name: this.name, url: this.url }));
	}
}
