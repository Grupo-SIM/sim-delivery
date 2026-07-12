import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetUnits } from "@/lib/api";
import { CreateUnitForm, UnitsTable } from "./components";

function UnitsPage() {
	const { t } = useTranslation();
	const { data: units, isError, isPending } = useGetUnits();

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.units.subtitle")} title={t("admin.units.title")} />

			<CreateUnitForm />

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.units.loadError")} />
			) : (
				<UnitsTable units={units} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/units/")({
	component: UnitsPage,
});
