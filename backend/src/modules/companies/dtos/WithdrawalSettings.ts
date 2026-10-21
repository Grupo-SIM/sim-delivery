import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

export const UpdateWithdrawalSettingsBody = t.Object({
	cnpj: t.String({ pattern: "^([0-9]{11}|[0-9]{14})$" }),
	minimumCents: t.Union([t.Integer({ minimum: 1 }), t.Null()]),
	pixKey: t.Optional(t.String()),
});

export const WithdrawalSettingsReturn = t.Object({
	cnpj: t.String(),
	minimumCents: __nullable__(t.Integer()),
	pixKey: __nullable__(t.String()),
	simpayMerchantId: t.String(),
});
