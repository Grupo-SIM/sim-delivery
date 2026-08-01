import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetPromotionalImages } from "@/lib/api";
import { PromotionalImageForm, PromotionalImagesTable } from "./components";

function PromotionalImagesPage() {
	const { t } = useTranslation();
	const { data, isError, isPending } = useGetPromotionalImages();
	const [search, setSearch] = useState("");

	const filteredImages = useMemo(() => {
		if (!data) return data;
		const query = search.trim().toLowerCase();
		if (!query) return data;
		return data.filter(image => image.title.toLowerCase().includes(query));
	}, [data, search]);

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading
				subtitle={t("admin.promotionalImages.subtitle")}
				title={t("admin.promotionalImages.title")}
			/>
			<PromotionalImageForm />
			<div className="max-w-sm">
				<TextField
					label={t("admin.promotionalImages.search.label")}
					onValueChange={setSearch}
					placeholder={t("admin.promotionalImages.search.placeholder")}
					value={search}
				/>
			</div>
			{isPending ? (
				<Skeleton className="h-48 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.promotionalImages.loadError")} />
			) : (
				<PromotionalImagesTable images={filteredImages ?? []} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/promotional-images/")({ component: PromotionalImagesPage });
