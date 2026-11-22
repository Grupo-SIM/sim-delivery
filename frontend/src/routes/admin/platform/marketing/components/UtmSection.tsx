import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetMarketingUtmLinks } from "@/lib/api";
import { type UtmLink, UtmLinkForm } from "./UtmLinkForm";
import { UtmLinksTable } from "./UtmLinksTable";

interface UtmSectionProps {
	baseUrl: string;
	companyId: string;
}

/** Tracked short links `/utm/<path>` of one company, with the UTMs each one applies. */
export function UtmSection({ baseUrl, companyId }: UtmSectionProps) {
	const { t } = useTranslation();
	const { data, isError, isPending } = useGetMarketingUtmLinks({ companyId });
	const [editing, setEditing] = useState<UtmLink | "new" | null>(null);

	return (
		<section className="space-y-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h2 className="font-display text-xl">UTM</h2>
					<p className="text-muted-foreground text-sm">{t("admin.marketing.utm.subtitle")}</p>
				</div>
				{editing === null && (
					<Button onClick={() => setEditing("new")} type="button" variant="outline">
						<LuPlus aria-hidden className="size-4" />
						{t("admin.marketing.utm.new")}
					</Button>
				)}
			</div>
			{editing !== null && (
				<UtmLinkForm companyId={companyId} editing={editing === "new" ? null : editing} key={editing === "new" ? "new" : editing.id} onDone={() => setEditing(null)} />
			)}
			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.marketing.utm.loadError")} />
			) : (
				<UtmLinksTable baseUrl={baseUrl} companyId={companyId} links={data} onEdit={setEditing} />
			)}
		</section>
	);
}
