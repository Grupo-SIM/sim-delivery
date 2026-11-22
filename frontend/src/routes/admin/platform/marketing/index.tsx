import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { requireSuperAdminBeforeLoad } from "@/lib/super-admin-guard";
import { UtmLinksSection } from "./components";

function MarketingPage() {
	const { t } = useTranslation();

	return (
		<Container className="space-y-8 py-8">
			<SectionHeading subtitle={t("admin.marketing.subtitle")} title={t("admin.marketing.title")} />
			<UtmLinksSection />
		</Container>
	);
}

export const Route = createFileRoute("/admin/platform/marketing/")({ beforeLoad: requireSuperAdminBeforeLoad, component: MarketingPage });
