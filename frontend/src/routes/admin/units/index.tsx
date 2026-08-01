import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetUnits } from "@/lib/api";
import { CreateUnitForm, UnitsTable } from "./components";

function UnitsPage() {
	const { t } = useTranslation();
	const { data: units, isError, isPending } = useGetUnits();
	const [search, setSearch] = useState("");

	const filteredUnits = useMemo(() => {
		if (!units) return units;
		const query = search.trim().toLowerCase();
		if (!query) return units;
		return units.filter(
			unit => unit.name.toLowerCase().includes(query) || unit.city?.toLowerCase().includes(query),
		);
	}, [units, search]);

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.units.subtitle")} title={t("admin.units.title")} />

			<CreateUnitForm />

			<div className="max-w-sm">
				<TextField
					label={t("admin.units.search.label")}
					onValueChange={setSearch}
					placeholder={t("admin.units.search.placeholder")}
					value={search}
				/>
			</div>

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.units.loadError")} />
			) : (
				<UnitsTable units={filteredUnits ?? []} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/units/")({
	component: UnitsPage,
});
