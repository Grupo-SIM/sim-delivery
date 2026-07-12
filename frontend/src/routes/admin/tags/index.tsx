import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetTags } from "@/lib/api";
import { CreateTagForm, TagsTable } from "./components";

function TagsPage() {
	const { t } = useTranslation();
	const { data: tags, isError, isPending } = useGetTags();

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.tags.subtitle")} title={t("admin.tags.title")} />

			<CreateTagForm />

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.tags.loadError")} />
			) : (
				<TagsTable tags={tags} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/tags/")({
	beforeLoad: () => {
		throw redirect({ search: { tab: "tags" }, to: "/admin/products" });
	},
});
