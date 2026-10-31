import { t } from "elysia";

export const FeeApplicationScope = t.Union([t.Literal("product"), t.Literal("order")]);
const FeePercentage = t.Integer({ maximum: 10_000, minimum: 0 });
const FeeFixed = t.Integer({ maximum: 2_147_483_647, minimum: 0 });
export const FeeDisplayMode = t.Union([
	t.Literal("product_explicit"),
	t.Literal("embedded"),
	t.Literal("checkout_only"),
]);

export const CreatePlatformFeeBody = t.Object({
	active: t.Optional(t.Boolean()),
	applicationScope: FeeApplicationScope,
	displayMode: FeeDisplayMode,
	fixedValue: t.Optional(FeeFixed),
	name: t.String({ maxLength: 120, minLength: 1 }),
	percentageValue: t.Optional(FeePercentage),
});
export type CreatePlatformFeeBody = typeof CreatePlatformFeeBody.static;

export const UpdatePlatformFeeBody = t.Partial(
	t.Object({
		active: t.Boolean(),
		displayMode: FeeDisplayMode,
		fixedValue: FeeFixed,
		name: t.String({ maxLength: 120, minLength: 1 }),
		percentageValue: FeePercentage,
	}),
);
export type UpdatePlatformFeeBody = typeof UpdatePlatformFeeBody.static;

export const UpsertCompanyFeeOverrideBody = t.Object({
	active: t.Boolean(),
	fixedOverride: t.Optional(t.Nullable(FeeFixed)),
	percentageOverride: t.Optional(t.Nullable(FeePercentage)),
});
export type UpsertCompanyFeeOverrideBody = typeof UpsertCompanyFeeOverrideBody.static;

export const PlatformFeeReturn = t.Object({
	active: t.Boolean(),
	applicationScope: t.String(),
	companyOverrideCount: t.Integer(),
	createdAt: t.Date(),
	displayMode: t.String(),
	fixedValue: t.Integer(),
	id: t.String(),
	name: t.String(),
	percentageValue: t.Integer(),
	updatedAt: t.Date(),
});
export type PlatformFeeReturn = typeof PlatformFeeReturn.static;
export const PlatformFeeListReturn = t.Array(PlatformFeeReturn);
export type PlatformFeeListReturn = typeof PlatformFeeListReturn.static;

export const CompanyFeeOverrideReturn = t.Object({
	active: t.Boolean(),
	companyId: t.String(),
	companyName: t.String(),
	effectiveFixed: t.Integer(),
	effectivePercentage: t.Integer(),
	fixedOverride: t.Nullable(t.Integer()),
	inherited: t.Boolean(),
	percentageOverride: t.Nullable(t.Integer()),
});
export type CompanyFeeOverrideReturn = typeof CompanyFeeOverrideReturn.static;
export const CompanyFeeOverrideListReturn = t.Array(CompanyFeeOverrideReturn);
export type CompanyFeeOverrideListReturn = typeof CompanyFeeOverrideListReturn.static;

export const EffectiveFeeReturn = t.Object({
	applicationScope: t.String(),
	displayMode: t.String(),
	fixedValue: t.Integer(),
	id: t.String(),
	name: t.String(),
	percentageValue: t.Integer(),
});
export type EffectiveFeeReturn = typeof EffectiveFeeReturn.static;
export const EffectiveFeeListReturn = t.Array(EffectiveFeeReturn);
export type EffectiveFeeListReturn = typeof EffectiveFeeListReturn.static;

export const PlatformFeeModeDto = t.Union([t.Literal("SIMINTPAY_ONLY"), t.Literal("ADDITIVE_ONLY"), t.Literal("BOTH")]);

const SimintpayLane = t.Object({
	channel: t.Literal("ONLINE"),
	fixedCents: t.Integer({ maximum: 1_000_000_000, minimum: 0 }),
	installments: t.Integer({ maximum: 12, minimum: 1 }),
	method: t.Union([t.Literal("PIX"), t.Literal("DEBIT_CARD"), t.Literal("CREDIT_CARD")]),
	ratePpm: t.Integer({ maximum: 1_000_000, minimum: 0 }),
});

/** Lanes SimIntPay returns; BOLETO is read-only here and cannot be edited through UpdateCompanyFeesBody. */
const SimintpayLaneReturn = t.Object({
	...SimintpayLane.properties,
	method: t.Union([t.Literal("BOLETO"), ...SimintpayLane.properties.method.anyOf]),
});

/** Global SimIntPay fee and highest acquirer cost per lane, before any company override. Super admin only. */
export const CompanyFeeDefaultsReturn = t.Object({
	costs: t.Array(SimintpayLaneReturn),
	lanes: t.Array(SimintpayLaneReturn),
});
export type CompanyFeeDefaultsReturn = typeof CompanyFeeDefaultsReturn.static;

const FeeComponentsDto = t.Object({ fixedCents: t.Integer(), ratePpm: t.Integer() });

export const UpdateCompanyFeesBody = t.Object({
	/** Lanes (`METHOD/installments`) to ignore for this platform, e.g. `CREDIT_CARD/2`. */
	disabledLanes: t.Optional(t.Array(t.String({ pattern: "^(PIX|BOLETO|DEBIT_CARD|CREDIT_CARD)/\\d{1,2}$" }), { maxItems: 14 })),
	mode: t.Optional(PlatformFeeModeDto),
	simintpay: t.Optional(t.Object({ lanes: t.Array(SimintpayLane, { maxItems: 14 }), version: t.String() })),
});
export type UpdateCompanyFeesBody = typeof UpdateCompanyFeesBody.static;

export const CompanyFeesReturn = t.Object({
	/** Per lane: acquirer cost, what the company pays to cover it and any shortfall. */
	coverage: t.Array(
		t.Object({
			cost: FeeComponentsDto,
			covered: FeeComponentsDto,
			fixedShortfallCents: t.Integer(),
			installments: t.Integer(),
			method: t.String(),
			rateShortfallPpm: t.Integer(),
		}),
	),
	/** Lanes (`METHOD/installments`) the platform does not accept. */
	disabledLanes: t.Array(t.String()),
	/** Surcharges added to the buyer price in this app, after company overrides. Empty when mode is SIMINTPAY_ONLY. */
	extras: EffectiveFeeListReturn,
	mode: PlatformFeeModeDto,
	/** SimIntPay's own fees, deducted from the seller. Not counted when mode is ADDITIVE_ONLY. */
	simintpay: t.Object({ lanes: t.Array(SimintpayLaneReturn), version: t.String() }),
	underCovered: t.Boolean(),
});
export type CompanyFeesReturn = typeof CompanyFeesReturn.static;
