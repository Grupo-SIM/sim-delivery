import { t } from "elysia";

export const FeeApplicationScope = t.Union([t.Literal("product"), t.Literal("order")]);
export const FeeCalculationType = t.Union([t.Literal("fixed"), t.Literal("percentage")]);
export const FeeDisplayMode = t.Union([
	t.Literal("product_explicit"),
	t.Literal("embedded"),
	t.Literal("checkout_only"),
]);

export const CreatePlatformFeeBody = t.Object({
	active: t.Optional(t.Boolean()),
	applicationScope: FeeApplicationScope,
	calculationType: FeeCalculationType,
	displayMode: FeeDisplayMode,
	name: t.String({ maxLength: 120, minLength: 1 }),
	value: t.Integer({ maximum: 2_147_483_647, minimum: 1 }),
});
export type CreatePlatformFeeBody = typeof CreatePlatformFeeBody.static;

export const UpdatePlatformFeeBody = t.Partial(
	t.Object({
		active: t.Boolean(),
		displayMode: FeeDisplayMode,
		name: t.String({ maxLength: 120, minLength: 1 }),
		value: t.Integer({ maximum: 2_147_483_647, minimum: 1 }),
	}),
);
export type UpdatePlatformFeeBody = typeof UpdatePlatformFeeBody.static;

export const UpsertCompanyFeeOverrideBody = t.Object({
	active: t.Boolean(),
	valueOverride: t.Optional(t.Nullable(t.Integer({ maximum: 2_147_483_647, minimum: 1 }))),
});
export type UpsertCompanyFeeOverrideBody = typeof UpsertCompanyFeeOverrideBody.static;

export const PlatformFeeReturn = t.Object({
	active: t.Boolean(),
	applicationScope: FeeApplicationScope,
	calculationType: FeeCalculationType,
	companyOverrideCount: t.Integer(),
	createdAt: t.Date(),
	displayMode: FeeDisplayMode,
	id: t.String(),
	name: t.String(),
	updatedAt: t.Date(),
	value: t.Integer(),
});
export type PlatformFeeReturn = typeof PlatformFeeReturn.static;
export const PlatformFeeListReturn = t.Array(PlatformFeeReturn);

export const CompanyFeeOverrideReturn = t.Object({
	active: t.Boolean(),
	companyId: t.String(),
	companyName: t.String(),
	effectiveValue: t.Integer(),
	inherited: t.Boolean(),
	valueOverride: t.Nullable(t.Integer()),
});
export type CompanyFeeOverrideReturn = typeof CompanyFeeOverrideReturn.static;
export const CompanyFeeOverrideListReturn = t.Array(CompanyFeeOverrideReturn);

export const EffectiveFeeReturn = t.Object({
	applicationScope: FeeApplicationScope,
	calculationType: FeeCalculationType,
	displayMode: FeeDisplayMode,
	id: t.String(),
	name: t.String(),
	value: t.Integer(),
});
export type EffectiveFeeReturn = typeof EffectiveFeeReturn.static;
export const EffectiveFeeListReturn = t.Array(EffectiveFeeReturn);
