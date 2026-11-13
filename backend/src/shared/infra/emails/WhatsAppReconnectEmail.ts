import { BaseEmail } from "./BaseEmail";

interface WhatsAppReconnectEmailInput {
	adminUrl?: string;
	name: string;
	sessionLabel: string;
	to: string;
}

export class WhatsAppReconnectEmail extends BaseEmail {
	private readonly adminUrl?: string;
	private readonly name: string;
	private readonly sessionLabel: string;

	constructor({ adminUrl, name, sessionLabel, to }: WhatsAppReconnectEmailInput) {
		super(to);
		this.adminUrl = adminUrl;
		this.name = name;
		this.sessionLabel = sessionLabel;
	}

	protected readonly subject = "Ação necessária: reconecte o WhatsApp";

	protected get text(): string {
		return `Olá, ${this.name}! A sessão de WhatsApp (${this.sessionLabel}) foi desconectada e precisa que o QR Code seja escaneado novamente. Enquanto isso, as notificações e códigos de login por WhatsApp não serão enviados.${this.adminUrl ? ` Acesse ${this.adminUrl} e reconecte.` : ""}`;
	}

	protected override get html(): string {
		const link = this.adminUrl ? `<p><a href="${this.adminUrl}">Reconectar o WhatsApp</a></p>` : "";
		return `<p>Olá, ${this.name}!</p><p>A sessão de WhatsApp (<strong>${this.sessionLabel}</strong>) foi desconectada e precisa que o QR Code seja escaneado novamente.</p><p>Enquanto isso, as notificações e códigos de login por WhatsApp não serão enviados.</p>${link}`;
	}
}
