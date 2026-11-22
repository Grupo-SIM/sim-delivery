import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetCompanies } from "@/lib/api";
import { requireSuperAdminBeforeLoad } from "@/lib/super-admin-guard";
import { UtmSection } from "./components";

function MarketingPage() {
	const { t } = useTranslation();
	const { data: companies, isError, isPending } = useGetCompanies();
	const [selected, setSelected] = useState("");
	const company = companies?.find(candidate => candidate.id === selected) ?? companies?.[0];

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.marketing.subtitle")} title={t("admin.marketing.title")} />
			{isPending ? (
				<Skeleton className="h-48 w-full" />
			) : isError || !company ? (
				<ErrorState title={t("admin.marketing.loadError")} />
			) : (
				<>
					<div className="max-w-sm space-y-1">
						<span className="font-medium text-sm">{t("admin.marketing.company")}</span>
						<CustomSelect onChange={setSelected} options={companies.map(item => ({ label: item.name, value: item.id }))} value={company.id} />
					</div>
					<UtmSection baseUrl={(company.siteUrl ?? window.location.origin).replace(/\/+$/, "")} companyId={company.id} key={company.id} />
				</>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/platform/marketing/")({ beforeLoad: requireSuperAdminBeforeLoad, component: MarketingPage });
