import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetMarketingUtmLinks } from "@/lib/api";
import type { UtmLink } from "./types";
import { UtmLinkModal } from "./UtmLinkModal";
import { UtmLinkRow } from "./UtmLinkRow";

/** Global tracked short links `/utm/<path>`, with the UTMs each one applies. */
export function UtmLinksSection() {
	const { t } = useTranslation();
	const { data, isError, isPending } = useGetMarketingUtmLinks();
	const [editing, setEditing] = useState<UtmLink | "new" | null>(null);

	return (
		<section>
			<SectionHeading
				action={
					<Button onClick={() => setEditing("new")} type="button" variant="outline">
						<LuPlus aria-hidden className="size-4" />
						{t("admin.marketing.utm.new")}
					</Button>
				}
				subtitle={t("admin.marketing.utm.subtitle")}
				title="UTM"
			/>
			{isPending ? (
				<div className="space-y-3">
					{[0, 1, 2].map(key => (
						<Skeleton className="h-[86px] w-full rounded-brand" key={key} />
					))}
				</div>
			) : isError ? (
				<ErrorState title={t("admin.marketing.utm.loadError")} />
			) : data.length === 0 ? (
				<EmptyState title={t("admin.marketing.utm.empty")} />
			) : (
				<ul className="space-y-3">
					{data.map(link => (
						<UtmLinkRow key={link.id} link={link} onEdit={() => setEditing(link)} />
					))}
				</ul>
			)}
			{editing !== null && <UtmLinkModal editing={editing === "new" ? null : editing} key={editing === "new" ? "new" : editing.id} onClose={() => setEditing(null)} />}
		</section>
	);
}
