import { t } from "elysia";

export const FeeApplicationScope = t.Union([t.Literal("product"), t.Literal("order")]);
const FeePercentage = t.Integer({ maximum: 10_000, minimum: 0 });
const FeeFixed = t.Integer({ maximum: 2_147_483_647, minimum: 0 });
export const FeeDisplayMode = t.Union([
	t.Literal("product_explicit"),
	t.Literal("embedded"),
	t.Literal("checkout_only"),
]);

/** Edit of one catalog fee as seen by one company; SimIntPay validates and saves it atomically with mode/lanes. */
export const CompanyAdditiveFeeEdit = t.Object({
	associated: t.Optional(t.Boolean()),
	feeId: t.String(),
	fixedOverride: t.Optional(t.Nullable(FeeFixed)),
	percentageOverride: t.Optional(t.Nullable(FeePercentage)),
	reset: t.Optional(t.Boolean()),
});

/** SimIntPay catalog fee plus this company's association and overrides. */
export const CompanyAdditiveFeeReturn = t.Object({
	active: t.Boolean(),
	applicationScope: FeeApplicationScope,
	associated: t.Boolean(),
	displayMode: FeeDisplayMode,
	effectiveFixedValue: t.Integer(),
	effectivePercentageValue: t.Integer(),
	fixedOverride: t.Nullable(t.Integer()),
	fixedValue: t.Integer(),
	id: t.String(),
	name: t.String(),
	percentageOverride: t.Nullable(t.Integer()),
	percentageValue: t.Integer(),
});
export type CompanyAdditiveFeeReturn = typeof CompanyAdditiveFeeReturn.static;

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
	additiveFees: t.Optional(t.Array(CompanyAdditiveFeeEdit, { maxItems: 200 })),
	/** Lanes (`METHOD/installments`) to ignore for this platform, e.g. `CREDIT_CARD/2`. */
	disabledLanes: t.Optional(t.Array(t.String({ pattern: "^(PIX|BOLETO|DEBIT_CARD|CREDIT_CARD)/\\d{1,2}$" }), { maxItems: 14 })),
	mode: t.Optional(PlatformFeeModeDto),
	simintpay: t.Optional(t.Object({ lanes: t.Array(SimintpayLane, { maxItems: 14 }), version: t.String() })),
});
export type UpdateCompanyFeesBody = typeof UpdateCompanyFeesBody.static;

export const CompanyFeesReturn = t.Object({
	/** Whole SimIntPay additive catalog with this company's association and overrides. */
	additiveFees: t.Array(CompanyAdditiveFeeReturn),
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
	mode: PlatformFeeModeDto,
	/** SimIntPay's own fees, deducted from the seller. Not counted when mode is ADDITIVE_ONLY. */
	simintpay: t.Object({ lanes: t.Array(SimintpayLaneReturn), version: t.String() }),
	underCovered: t.Boolean(),
});
export type CompanyFeesReturn = typeof CompanyFeesReturn.static;
