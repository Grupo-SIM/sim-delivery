import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetPromotionalImages } from "@/lib/api";
import { PromotionalImageForm, PromotionalImagesTable } from "./components";

function PromotionalImagesPage() {
	const { t } = useTranslation();
	const { data, isError, isPending } = useGetPromotionalImages();
	return (
		<Container className="space-y-6 py-8">
			<SectionHeading
				subtitle={t("admin.promotionalImages.subtitle")}
				title={t("admin.promotionalImages.title")}
			/>
			<PromotionalImageForm />
			{isPending ? (
				<Skeleton className="h-48 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.promotionalImages.loadError")} />
			) : (
				<PromotionalImagesTable images={data} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/promotional-images/")({ component: PromotionalImagesPage });
