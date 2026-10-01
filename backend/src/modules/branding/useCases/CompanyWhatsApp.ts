import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { getWahaClientOptions, WahaClient, WahaRequestError, type WahaSessionInfo } from "@/shared/infra/whatsapp";
import { UnitErrors } from "@/modules/units/errors";
import type { CompanyWhatsAppReturn } from "../dtos";

type Connection = NonNullable<Awaited<ReturnType<PrismaInstance["companyWhatsAppConnection"]["findUnique"]>>>;

export function buildCompanyWhatsAppSessionName(companySlug: string): string {
	return `sim-delivery_${companySlug}`;
}

function asReturn(connection: Connection, status = connection.lastStatus): CompanyWhatsAppReturn {
	return {
		configured: true,
		connectedPhone: connection.connectedPhone,
		lastError: connection.lastError,
		lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
		sessionName: connection.sessionName,
		status: status ?? null,
	};
}

export class CompanyWhatsApp {
	constructor(private readonly prisma: PrismaInstance, private readonly getWaha = () => new WahaClient(getWahaClientOptions())) {}

	async get(companyId: string): Promise<CompanyWhatsAppReturn> {
		const connection = await this.prisma.companyWhatsAppConnection.findUnique({ where: { companyId } });
		if (!connection) return { configured: false, connectedPhone: null, lastError: null, lastSyncedAt: null, sessionName: null, status: null };
		try {
			return await this.sync(connection, await this.getWaha().getSession(connection.sessionName));
		} catch {
			const failed = await this.prisma.companyWhatsAppConnection.update({ data: { lastError: "Não foi possível consultar a sessão WAHA.", lastSyncedAt: new Date() }, where: { companyId } });
			return asReturn(failed, failed.lastStatus ?? "FAILED");
		}
	}

	async connect(companyId: string): Promise<CompanyWhatsAppReturn> {
		const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId }, select: { slug: true } });
		const connection = await this.prisma.companyWhatsAppConnection.upsert({
			create: { companyId, sessionName: buildCompanyWhatsAppSessionName(company.slug) },
			update: {}, where: { companyId },
		});
		try {
			let session: WahaSessionInfo;
			try { session = await this.getWaha().getSession(connection.sessionName); }
			catch (error) {
				if (!(error instanceof WahaRequestError) || error.status !== 404) throw error;
				session = await this.getWaha().createSession(connection.sessionName, { "sim-delivery.companyId": companyId });
			}
			if (session.status === "STOPPED") session = await this.getWaha().startSession(connection.sessionName);
				else if (session.status === "FAILED") session = await this.getWaha().restartSession(connection.sessionName);
			return this.sync(connection, session);
		} catch {
			await this.prisma.companyWhatsAppConnection.update({ data: { lastError: "Não foi possível iniciar a sessão WAHA.", lastSyncedAt: new Date() }, where: { companyId } });
			throw new DomainError(UnitErrors.WHATSAPP_UNAVAILABLE);
		}
	}

	async qr(companyId: string): Promise<string> {
		const connection = await this.prisma.companyWhatsAppConnection.findUniqueOrThrow({ where: { companyId } });
		return this.getWaha().getQrDataUrl(connection.sessionName);
	}

	async disconnect(companyId: string): Promise<CompanyWhatsAppReturn> {
		const connection = await this.prisma.companyWhatsAppConnection.findUniqueOrThrow({ where: { companyId } });
		return this.sync(connection, await this.getWaha().logoutSession(connection.sessionName));
	}

	private async sync(connection: Connection, session: WahaSessionInfo): Promise<CompanyWhatsAppReturn> {
		const digits = session.me?.id.split("@")[0]?.replace(/\D/g, "");
		const updated = await this.prisma.companyWhatsAppConnection.update({ data: { connectedPhone: digits ? `+${digits}` : null, lastError: null, lastStatus: session.status, lastSyncedAt: new Date() }, where: { companyId: connection.companyId } });
		return asReturn(updated, session.status);
	}
}
