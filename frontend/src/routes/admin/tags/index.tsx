import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetTags } from "@/lib/api";
import { CreateTagForm, TagsTable } from "./components";

function TagsPage() {
	const { t } = useTranslation();
	const { data: tags, isError, isPending } = useGetTags();
	const [search, setSearch] = useState("");

	const filteredTags = useMemo(() => {
		if (!tags) return tags;
		const query = search.trim().toLowerCase();
		if (!query) return tags;
		return tags.filter(tag => tag.name.toLowerCase().includes(query));
	}, [tags, search]);

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.tags.subtitle")} title={t("admin.tags.title")} />

			<CreateTagForm />

			<div className="max-w-sm">
				<TextField
					label={t("admin.tags.search.label")}
					onValueChange={setSearch}
					placeholder={t("admin.tags.search.placeholder")}
					value={search}
				/>
			</div>

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.tags.loadError")} />
			) : (
				<TagsTable tags={filteredTags ?? []} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/tags/")({
	component: TagsPage,
});
