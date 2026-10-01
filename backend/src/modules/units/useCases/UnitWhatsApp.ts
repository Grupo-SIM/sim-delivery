import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import {
	getWahaClientOptions,
	WahaClient,
	WahaRequestError,
	type WahaSessionInfo,
} from "@/shared/infra/whatsapp";
import { WhatsAppSessionRecovery } from "@/shared/infra/whatsapp/WhatsAppSessionRecovery";
import type { UnitWhatsAppReturn } from "../dtos";
import { UnitErrors } from "../errors";

const COMPANY_METADATA = "sim-delivery.companyId";
const UNIT_METADATA = "sim-delivery.unitId";

type UnitConnection = NonNullable<Awaited<ReturnType<PrismaInstance["unitWhatsAppConnection"]["findUnique"]>>>;

export function buildUnitWhatsAppSessionName(companySlug: string, unitSlug: string): string {
	return `sim-delivery_${companySlug}_${unitSlug}`;
}

function connectedPhone(session: WahaSessionInfo): string | null {
	const digits = session.me?.id.split("@")[0]?.replace(/\D/g, "");
	return digits ? `+${digits}` : null;
}

function asReturn(connection: UnitConnection, status = connection.lastStatus): UnitWhatsAppReturn {
	return {
		configured: true,
		connectedPhone: connection.connectedPhone,
		lastError: connection.lastError,
		lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
		sessionName: connection.sessionName,
		status: status as UnitWhatsAppReturn["status"],
	};
}

export class UnitWhatsApp {
	private waha: WahaClient | undefined;
	private readonly recovery = new WhatsAppSessionRecovery();

	constructor(
		private readonly prisma: PrismaInstance,
		private readonly createWahaClient: () => WahaClient = () => new WahaClient(getWahaClientOptions()),
	) {}

	async get(companyId: string | null, unitId: string): Promise<UnitWhatsAppReturn> {
		const unit = await this.requireUnit(companyId, unitId);
		const connection = await this.prisma.unitWhatsAppConnection.findUnique({ where: { unitId } });
		if (!connection) {
			return {
				configured: false,
				connectedPhone: null,
				lastError: null,
				lastSyncedAt: null,
				sessionName: null,
				status: null,
			};
		}

		try {
			const session = await this.getWaha().getSession(connection.sessionName);
			if (session.status === "FAILED" && this.recovery.shouldRestart(unit.company.slug, connection.sessionName)) {
				return await this.connect(companyId, unitId);
			}
			return asReturn(await this.sync(connection, session));
		} catch (error) {
			const failed = await this.prisma.unitWhatsAppConnection.update({
				data: { lastError: error instanceof DomainError ? (error.description ?? error.message) : this.connectionError(error), lastSyncedAt: new Date() },
				where: { id: connection.id },
			});
			return asReturn(failed, failed.lastStatus ?? "FAILED");
		}
	}

	async connect(companyId: string | null, unitId: string): Promise<UnitWhatsAppReturn> {
		const unit = await this.requireUnit(companyId, unitId);
		const sessionName = buildUnitWhatsAppSessionName(unit.company.slug, unit.slug);
		const savedConnection = await this.prisma.unitWhatsAppConnection.findUnique({ where: { unitId } });
		const connection = await this.prisma.unitWhatsAppConnection.upsert({
			create: { companyId: unit.companyId, sessionName, unitId },
			update: {},
			where: { unitId },
		});

		try {
			let session: WahaSessionInfo;
			try {
				session = await this.connectSession(connection.sessionName, unit.companyId, unitId, savedConnection, unit.company.slug === "zero-grau");
			} catch (error) {
				const uniqueName = `${sessionName}_${unitId}`;
				if (!(error instanceof DomainError) || error.message !== UnitErrors.WHATSAPP_SESSION_CONFLICT || connection.sessionName === uniqueName) throw error;
				// Slugs can be reused after a unit is recreated. Leave the previous
				// owner's session untouched and pair a separate session for this ID.
				session = await this.connectSession(uniqueName, unit.companyId, unitId, null);
			}
			return asReturn(await this.sync(connection, session));
		} catch (error) {
			await this.prisma.unitWhatsAppConnection.update({
				data: { lastError: this.connectionError(error), lastSyncedAt: new Date() },
				where: { id: connection.id },
			});
			if (error instanceof DomainError) throw error;
			throw new DomainError(UnitErrors.WHATSAPP_UNAVAILABLE, this.connectionError(error));
		}
	}

	async qr(companyId: string | null, unitId: string): Promise<string> {
		await this.requireUnit(companyId, unitId);
		const connection = await this.prisma.unitWhatsAppConnection.findUnique({ where: { unitId } });
		if (!connection) throw new DomainError(UnitErrors.WHATSAPP_NOT_CONFIGURED);
		try {
			return await this.getWaha().getQrDataUrl(connection.sessionName);
		} catch {
			throw new DomainError(UnitErrors.WHATSAPP_UNAVAILABLE);
		}
	}

	async disconnect(companyId: string | null, unitId: string): Promise<UnitWhatsAppReturn> {
		await this.requireUnit(companyId, unitId);
		const connection = await this.prisma.unitWhatsAppConnection.findUnique({ where: { unitId } });
		if (!connection) throw new DomainError(UnitErrors.WHATSAPP_NOT_CONFIGURED);
		try {
			return asReturn(await this.sync(connection, await this.getWaha().logoutSession(connection.sessionName)));
		} catch {
			throw new DomainError(UnitErrors.WHATSAPP_UNAVAILABLE);
		}
	}

	private async connectSession(sessionName: string, companyId: string, unitId: string, savedConnection: UnitConnection | null, recoverOrphan = false): Promise<WahaSessionInfo> {
		let session: WahaSessionInfo;
		try {
			session = await this.getWaha().getSession(sessionName);
		} catch (error) {
			if (!(error instanceof WahaRequestError) || error.status !== 404) throw error;
			try {
				return await this.getWaha().createSession(sessionName, { [COMPANY_METADATA]: companyId, [UNIT_METADATA]: unitId });
			} catch (createError) {
				if (!(createError instanceof WahaRequestError) || createError.status !== 409) throw createError;
				session = await this.getWaha().getSession(sessionName);
			}
		}
		const metadata = session.config?.metadata;
		const previousUnitId = metadata?.[UNIT_METADATA];
		if (recoverOrphan && session.status === "FAILED" && savedConnection?.sessionName === sessionName && savedConnection.companyId === companyId && savedConnection.unitId === unitId && metadata?.[COMPANY_METADATA] === companyId && previousUnitId && previousUnitId !== unitId) {
			const previousUnit = await this.prisma.unit.findFirst({ where: { id: previousUnitId } });
			if (!previousUnit) {
				session = await this.getWaha().updateSessionMetadata(session, { [COMPANY_METADATA]: companyId, [UNIT_METADATA]: unitId });
				this.assertOwnership(session, companyId, unitId, savedConnection);
				return this.getWaha().restartSession(sessionName);
			}
		}
		this.assertOwnership(session, companyId, unitId, savedConnection);
		if (session.status === "STOPPED") return this.getWaha().startSession(sessionName);
		if (session.status === "FAILED") return this.getWaha().restartSession(sessionName);
		return session;
	}

	private assertOwnership(session: WahaSessionInfo, companyId: string, unitId: string, savedConnection: UnitConnection | null): void {
		const metadata = session.config?.metadata;
		const ownerCompany = metadata?.[COMPANY_METADATA];
		const ownerUnit = metadata?.[UNIT_METADATA];
		const storedOwnership = savedConnection?.companyId === companyId && savedConnection.unitId === unitId && savedConnection.sessionName === session.name;
		// Legacy sessions can omit metadata; an existing local binding fills only
		// missing ownership. Explicit conflicting owners always remain blocked.
		if ((ownerCompany !== undefined && ownerCompany !== companyId) || (ownerUnit !== undefined && ownerUnit !== unitId) || ((ownerCompany === undefined || ownerUnit === undefined) && !storedOwnership)) {
			throw new DomainError(UnitErrors.WHATSAPP_SESSION_CONFLICT);
		}
	}

	private connectionError(error: unknown): string {
		if (error instanceof WahaRequestError) return error.message;
		if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return "WAHA excedeu o tempo limite para iniciar a sessão.";
		return "Não foi possível iniciar a sessão WAHA.";
	}

	private getWaha(): WahaClient {
		return (this.waha ??= this.createWahaClient());
	}

	private async requireUnit(companyId: string | null, unitId: string) {
		const unit = await this.prisma.unit.findFirst({
			include: { company: { select: { slug: true } } },
			where: { ...(companyId ? { companyId } : {}), id: unitId },
		});
		if (!unit) throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		return unit;
	}

	private sync(connection: UnitConnection, session: WahaSessionInfo): Promise<UnitConnection> {
		return this.prisma.unitWhatsAppConnection.update({
			data: {
				connectedPhone: connectedPhone(session),
				sessionName: session.name,
				lastError: session.status === "FAILED" ? connection.lastError : null,
				lastStatus: session.status,
				lastSyncedAt: new Date(),
			},
			where: { id: connection.id },
		});
	}
}
