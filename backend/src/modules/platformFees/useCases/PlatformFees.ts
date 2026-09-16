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

const INVALID_FEE = "INVALID_PLATFORM_FEE";
const FEE_NOT_FOUND = "PLATFORM_FEE_NOT_FOUND";

function normalizedName(name: string) {
	return name.trim().replace(/\s+/g, " ");
}

function validateFee(input: {
	applicationScope: string;
	calculationType: string;
	displayMode: string;
	value: number;
}) {
	if (input.applicationScope === "order" && input.displayMode !== "checkout_only") {
		throw new DomainError(INVALID_FEE);
	}
	if (input.calculationType === "percentage" && input.value > 10_000) {
		throw new DomainError(INVALID_FEE);
	}
}

function mapFee(fee: {
	_count: { companyOverrides: number };
	active: boolean;
	applicationScope: string;
	calculationType: string;
	createdAt: Date;
	displayMode: string;
	id: string;
	name: string;
	updatedAt: Date;
	value: number;
}): PlatformFeeReturn {
	return {
		active: fee.active,
		applicationScope: fee.applicationScope as PlatformFeeReturn["applicationScope"],
		calculationType: fee.calculationType as PlatformFeeReturn["calculationType"],
		companyOverrideCount: fee._count.companyOverrides,
		createdAt: fee.createdAt,
		displayMode: fee.displayMode as PlatformFeeReturn["displayMode"],
		id: fee.id,
		name: fee.name,
		updatedAt: fee.updatedAt,
		value: fee.value,
	};
}

const feeInclude = { _count: { select: { companyOverrides: true } } } as const;

export class PlatformFees {
	constructor(private readonly prisma: PrismaInstance) {}

	async list(): Promise<PlatformFeeListReturn> {
		return (await this.prisma.platformFee.findMany({
			include: feeInclude,
			orderBy: { createdAt: "desc" },
			where: { deletedAt: null },
		})).map(mapFee);
	}

	async create(input: CreatePlatformFeeBody): Promise<PlatformFeeReturn> {
		const name = normalizedName(input.name);
		validateFee(input);
		const fee = await this.prisma.platformFee.create({
			data: { ...input, active: input.active ?? true, name, nameKey: name.toLocaleLowerCase() },
			include: feeInclude,
		});
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
		return mapFee(fee);
	}

	async remove(id: string): Promise<void> {
		const result = await this.prisma.platformFee.updateMany({
			data: { active: false, deletedAt: new Date() },
			where: { deletedAt: null, id },
		});
		if (result.count === 0) throw new DomainError(FEE_NOT_FOUND);
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
				effectiveValue: override?.valueOverride ?? fee.value,
				inherited: !override,
				valueOverride: override?.valueOverride ?? null,
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
		const value = input.valueOverride ?? fee.value;
		validateFee({ ...fee, value });
		await this.prisma.companyFeeOverride.upsert({
			create: { active: input.active, companyId, feeId, valueOverride: input.valueOverride ?? null },
			update: { active: input.active, valueOverride: input.valueOverride ?? null },
			where: { feeId_companyId: { companyId, feeId } },
		});
	}

	async resetCompany(feeId: string, companyId: string): Promise<void> {
		await this.prisma.companyFeeOverride.deleteMany({ where: { companyId, feeId } });
	}
}
