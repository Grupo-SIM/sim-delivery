import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetCustomers } from "@/lib/api";
import { CustomersTable } from "./components";

function CustomersPage() {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const customersQuery = useGetCustomers({ search: search.trim() || undefined });

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.customers.subtitle")} title={t("admin.customers.title")} />
			<div className="max-w-sm">
				<TextField
					label={t("admin.customers.search.label")}
					onValueChange={setSearch}
					placeholder={t("admin.customers.search.placeholder")}
					value={search}
				/>
			</div>
			{customersQuery.isPending ? (
				<Skeleton className="h-40 w-full" />
			) : customersQuery.isError ? (
				<ErrorState title={t("admin.customers.loadError")} />
			) : (
				<CustomersTable customers={customersQuery.data} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/customers/")({
	component: CustomersPage,
});
