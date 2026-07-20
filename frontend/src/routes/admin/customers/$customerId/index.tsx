import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuArrowLeft } from "react-icons/lu";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetCustomersByCustomerId, useGetOrders } from "@/lib/api";
import { CustomerMetrics, CustomerOrdersTable } from "../components";

function CustomerDetailPage() {
	const { t } = useTranslation();
	const { customerId } = Route.useParams();
	const customerQuery = useGetCustomersByCustomerId(customerId);
	const ordersQuery = useGetOrders({ customerId });

	if (customerQuery.isPending || ordersQuery.isPending) {
		return <Container className="py-8"><Skeleton className="h-80 w-full" /></Container>;
	}

	if (customerQuery.isError || ordersQuery.isError) {
		return <Container className="py-8"><ErrorState title={t("admin.customers.detail.loadError")} /></Container>;
	}

	const customer = customerQuery.data;
	return (
		<Container className="space-y-6 py-8">
			<Link className={buttonClassName({ className: "inline-flex gap-2", size: "sm", variant: "outline" })} to="/admin/customers">
				<LuArrowLeft className="size-4" />
				{t("admin.customers.detail.back")}
			</Link>
			<SectionHeading subtitle={customer.email} title={customer.name} />
			<CustomerMetrics customer={customer} />
			<section className="space-y-3">
				<h2 className="font-semibold text-lg">{t("admin.customers.detail.orders")}</h2>
				<CustomerOrdersTable orders={ordersQuery.data} />
			</section>
		</Container>
	);
}

export const Route = createFileRoute("/admin/customers/$customerId/")({
	component: CustomerDetailPage,
});
