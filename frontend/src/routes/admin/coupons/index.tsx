import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetCoupons, useGetUnits } from "@/lib/api";
import { CouponsTable, CreateCouponForm } from "./components";

function CouponsPage() {
	const { t } = useTranslation();
	const couponsQuery = useGetCoupons();
	const unitsQuery = useGetUnits();

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.coupons.subtitle")} title={t("admin.coupons.title")} />
			<CreateCouponForm />
			{couponsQuery.isPending || unitsQuery.isPending ? (
				<Skeleton className="h-40 w-full" />
			) : couponsQuery.isError || unitsQuery.isError ? (
				<ErrorState title={t("admin.coupons.loadError")} />
			) : (
				<CouponsTable coupons={couponsQuery.data} units={unitsQuery.data} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/coupons/")({
	component: CouponsPage,
});
