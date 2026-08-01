import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetCoupons, useGetUnits } from "@/lib/api";
import { CouponsTable, CreateCouponForm } from "./components";

function CouponsPage() {
	const { t } = useTranslation();
	const couponsQuery = useGetCoupons();
	const unitsQuery = useGetUnits();
	const [search, setSearch] = useState("");

	const filteredCoupons = useMemo(() => {
		if (!couponsQuery.data) return couponsQuery.data;
		const query = search.trim().toLowerCase();
		if (!query) return couponsQuery.data;
		return couponsQuery.data.filter(coupon => coupon.code.toLowerCase().includes(query));
	}, [couponsQuery.data, search]);

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.coupons.subtitle")} title={t("admin.coupons.title")} />
			<CreateCouponForm />
			<div className="max-w-sm">
				<TextField
					label={t("admin.coupons.search.label")}
					onValueChange={setSearch}
					placeholder={t("admin.coupons.search.placeholder")}
					value={search}
				/>
			</div>
			{couponsQuery.isPending || unitsQuery.isPending ? (
				<Skeleton className="h-40 w-full" />
			) : couponsQuery.isError || unitsQuery.isError ? (
				<ErrorState title={t("admin.coupons.loadError")} />
			) : (
				<CouponsTable coupons={filteredCoupons ?? []} units={unitsQuery.data} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/coupons/")({
	component: CouponsPage,
});
