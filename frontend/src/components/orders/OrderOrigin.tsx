import { useTranslation } from "react-i18next";
import type { GetOrders200 } from "@/lib/api";
import { humanizeUtm } from "@/lib/utm-labels";

interface OrderOriginProps {
	origin: GetOrders200[number]["origin"];
}

/** First-touch campaign origin of an order (Origem / Meio / Campanha / Conteúdo). */
export function OrderOrigin({ origin }: OrderOriginProps) {
	const { t } = useTranslation();
	const first = origin?.first;
	const label = (kind: "contents" | "mediums" | "sources", value?: string | null) =>
		value ? t(`admin.orders.origin.${kind}.${value}`, { defaultValue: humanizeUtm(value) }) : t("admin.orders.origin.none");
	const rows = [
		["source", label("sources", first?.source)],
		["medium", label("mediums", first?.medium)],
		["campaign", first?.campaign ? humanizeUtm(first.campaign) : t("admin.orders.origin.none")],
		["content", label("contents", first?.content)],
	] as const;
	return (
		<section className="space-y-2 rounded-brand border border-border p-3 text-sm">
			<p className="font-semibold">{t("admin.orders.origin.title")}</p>
			{origin ? (
				<dl className="grid gap-2 sm:grid-cols-2">
					{rows.map(([key, value]) => (
						<div key={key}>
							<dt className="text-muted-foreground">{t(`admin.orders.origin.fields.${key}`)}</dt>
							<dd className="mt-0.5 font-medium">{value}</dd>
						</div>
					))}
				</dl>
			) : (
				<p className="text-muted-foreground">{t("admin.orders.origin.direct")}</p>
			)}
		</section>
	);
}
