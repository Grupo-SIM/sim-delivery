import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type {
	CompanyFeeOverrideListReturn,
	CreatePlatformFeeBody,
	PlatformFeeListReturn,
	PlatformFeeReturn,
	UpdatePlatformFeeBody,
	UpsertCompanyFeeOverrideBody,
} from "../dtos";
import { AdditiveFeeSync } from "../additiveFeeSync";
import { PlatformFeeErrors } from "../errors";

const INVALID_FEE = PlatformFeeErrors.INVALID_PLATFORM_FEE;
const FEE_NOT_FOUND = PlatformFeeErrors.PLATFORM_FEE_NOT_FOUND;

function normalizedName(name: string) {
	return name.trim().replace(/\s+/g, " ");
}

function validateFee(input: {
	applicationScope: string;
	displayMode: string;
	fixedValue: number;
	percentageValue: number;
}) {
	if (input.applicationScope === "order" && input.displayMode !== "checkout_only") {
		throw new DomainError(INVALID_FEE);
	}
	if (input.percentageValue <= 0 && input.fixedValue <= 0) {
		throw new DomainError(INVALID_FEE);
	}
}

function mapFee(fee: {
	_count: { companyOverrides: number };
	active: boolean;
	applicationScope: string;
	createdAt: Date;
	displayMode: string;
	fixedValue: number;
	id: string;
	name: string;
	percentageValue: number;
	updatedAt: Date;
}): PlatformFeeReturn {
	return {
		active: fee.active,
		applicationScope: fee.applicationScope as PlatformFeeReturn["applicationScope"],
		companyOverrideCount: fee._count.companyOverrides,
		createdAt: fee.createdAt,
		displayMode: fee.displayMode as PlatformFeeReturn["displayMode"],
		fixedValue: fee.fixedValue,
		id: fee.id,
		name: fee.name,
		percentageValue: fee.percentageValue,
		updatedAt: fee.updatedAt,
	};
}

const feeInclude = { _count: { select: { companyOverrides: true } } } as const;

export class PlatformFees {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly sync: Pick<AdditiveFeeSync, "push" | "resyncAffected"> = new AdditiveFeeSync(prisma),
	) {}

	async list(): Promise<PlatformFeeListReturn> {
		return (await this.prisma.platformFee.findMany({
			include: feeInclude,
			orderBy: { createdAt: "desc" },
			where: { deletedAt: null },
		})).map(mapFee);
	}

	async create(input: CreatePlatformFeeBody): Promise<PlatformFeeReturn> {
		const name = normalizedName(input.name);
		const values = { fixedValue: input.fixedValue ?? 0, percentageValue: input.percentageValue ?? 0 };
		validateFee({ ...input, ...values });
		const fee = await this.prisma.platformFee.create({
			data: { ...input, ...values, active: input.active ?? true, name, nameKey: name.toLocaleLowerCase() },
			include: feeInclude,
		});
		await this.sync.resyncAffected(fee.id);
		return mapFee(fee);
	}

	async update(id: string, input: UpdatePlatformFeeBody): Promise<PlatformFeeReturn> {
		const current = await this.prisma.platformFee.findFirst({ where: { deletedAt: null, id } });
		if (!current) throw new DomainError(FEE_NOT_FOUND);
		const next = { ...current, ...input };
		validateFee(next);
		const name = input.name === undefined ? undefined : normalizedName(input.name);
		const fee = await this.prisma.platformFee.update({
			data: { ...input, ...(name === undefined ? {} : { name, nameKey: name.toLocaleLowerCase() }) },
			include: feeInclude,
			where: { id },
		});
		await this.sync.resyncAffected(id);
		return mapFee(fee);
	}

	async remove(id: string): Promise<void> {
		const result = await this.prisma.platformFee.updateMany({
			data: { active: false, deletedAt: new Date() },
			where: { deletedAt: null, id },
		});
		if (result.count === 0) throw new DomainError(FEE_NOT_FOUND);
		await this.sync.resyncAffected(id);
	}

	async listCompanies(feeId: string): Promise<CompanyFeeOverrideListReturn> {
		const fee = await this.prisma.platformFee.findFirst({
			include: { companyOverrides: true },
			where: { deletedAt: null, id: feeId },
		});
		if (!fee) throw new DomainError(FEE_NOT_FOUND);
		const companies = await this.prisma.company.findMany({ orderBy: { name: "asc" } });
		const overrides = new Map(fee.companyOverrides.map(item => [item.companyId, item]));
		return companies.map(company => {
			const override = overrides.get(company.id);
			return {
				active: override?.active ?? fee.active,
				companyId: company.id,
				companyName: company.name,
				effectiveFixed: override?.fixedOverride ?? fee.fixedValue,
				effectivePercentage: override?.percentageOverride ?? fee.percentageValue,
				fixedOverride: override?.fixedOverride ?? null,
				inherited: !override,
				percentageOverride: override?.percentageOverride ?? null,
			};
		});
	}

	async upsertCompany(
		feeId: string,
		companyId: string,
		input: UpsertCompanyFeeOverrideBody,
	): Promise<void> {
		const fee = await this.prisma.platformFee.findFirst({ where: { deletedAt: null, id: feeId } });
		if (!fee) throw new DomainError(FEE_NOT_FOUND);
		const fixedOverride = input.fixedOverride ?? null;
		const percentageOverride = input.percentageOverride ?? null;
		validateFee({
			...fee,
			fixedValue: fixedOverride ?? fee.fixedValue,
			percentageValue: percentageOverride ?? fee.percentageValue,
		});
		const where = { feeId_companyId: { companyId, feeId } };
		await this.prisma.companyFeeOverride.upsert({
			create: { active: input.active, companyId, feeId, fixedOverride, percentageOverride },
			update: { active: input.active, fixedOverride, percentageOverride },
			where,
		});
		await this.sync.push(companyId);
	}

	async resetCompany(feeId: string, companyId: string): Promise<void> {
		await this.prisma.companyFeeOverride.deleteMany({ where: { companyId, feeId } });
		await this.sync.push(companyId);
	}
}
