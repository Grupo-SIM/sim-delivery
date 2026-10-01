import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import {
	getWahaClientOptions,
	WahaClient,
	WahaRequestError,
	type WahaSessionInfo,
} from "@/shared/infra/whatsapp";
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

	constructor(
		private readonly prisma: PrismaInstance,
		private readonly createWahaClient: () => WahaClient = () => new WahaClient(getWahaClientOptions()),
	) {}

	async get(companyId: string | null, unitId: string): Promise<UnitWhatsAppReturn> {
		await this.requireUnit(companyId, unitId);
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
			return asReturn(await this.sync(connection, await this.getWaha().getSession(connection.sessionName)));
		} catch (error) {
			const failed = await this.prisma.unitWhatsAppConnection.update({
				data: { lastError: "Não foi possível consultar a sessão WAHA.", lastSyncedAt: new Date() },
				where: { id: connection.id },
			});
			return asReturn(failed, failed.lastStatus ?? "FAILED");
		}
	}

	async connect(companyId: string | null, unitId: string): Promise<UnitWhatsAppReturn> {
		const unit = await this.requireUnit(companyId, unitId);
		const sessionName = buildUnitWhatsAppSessionName(unit.company.slug, unit.slug);
		const connection = await this.prisma.unitWhatsAppConnection.upsert({
			create: { companyId: unit.companyId, sessionName, unitId },
			update: {},
			where: { unitId },
		});

		try {
			let session: WahaSessionInfo;
			try {
				session = await this.getWaha().getSession(connection.sessionName);
				this.assertOwnership(session, unit.companyId, unitId);
				if (session.status === "STOPPED") session = await this.getWaha().startSession(connection.sessionName);
				else if (session.status === "FAILED") session = await this.getWaha().restartSession(connection.sessionName);
			} catch (error) {
				if (!(error instanceof WahaRequestError) || error.status !== 404) throw error;
				try {
					session = await this.getWaha().createSession(connection.sessionName, {
						[COMPANY_METADATA]: unit.companyId,
						[UNIT_METADATA]: unitId,
					});
				} catch (createError) {
					if (!(createError instanceof WahaRequestError) || createError.status !== 409) throw createError;
					session = await this.getWaha().getSession(connection.sessionName);
					this.assertOwnership(session, unit.companyId, unitId);
				}
			}
			return asReturn(await this.sync(connection, session));
		} catch (error) {
			await this.prisma.unitWhatsAppConnection.update({
				data: { lastError: "Não foi possível iniciar a sessão WAHA.", lastSyncedAt: new Date() },
				where: { id: connection.id },
			});
			if (error instanceof DomainError) throw error;
			throw new DomainError(UnitErrors.WHATSAPP_UNAVAILABLE);
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

	private assertOwnership(session: WahaSessionInfo, companyId: string, unitId: string): void {
		const metadata = session.config?.metadata;
		if (metadata?.[COMPANY_METADATA] !== companyId || metadata?.[UNIT_METADATA] !== unitId) {
			throw new DomainError(UnitErrors.WHATSAPP_SESSION_CONFLICT);
		}
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
				lastError: null,
				lastStatus: session.status,
				lastSyncedAt: new Date(),
			},
			where: { id: connection.id },
		});
	}
}
