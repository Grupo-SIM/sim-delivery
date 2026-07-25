import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuEye } from "react-icons/lu";
import { buttonClassName } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { GetCustomers200 } from "@/lib/api";

interface CustomersTableProps {
	customers: GetCustomers200;
}

function currency(cents: string | number) {
	return (Number(cents) / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

export function CustomersTable({ customers }: CustomersTableProps) {
	const { t } = useTranslation();

	if (customers.items.length === 0) return <EmptyState title={t("admin.customers.empty")} />;

	return (
		<DataTable>
			<thead>
				<tr className="border-border border-b text-left text-muted-foreground">
					<th className="px-4 py-3 font-medium">{t("admin.customers.columns.customer")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.customers.columns.contact")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.customers.columns.orders")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.customers.columns.totalSpent")}</th>
					<th className="px-4 py-3 font-medium">{t("admin.customers.columns.lastOrder")}</th>
					<th className="px-4 py-3" />
				</tr>
			</thead>
			<tbody>
				{customers.items.map(customer => (
					<tr className="border-border/60 border-b last:border-0" key={customer.id}>
						<td className="px-4 py-3">
							<p className="font-medium">{customer.name}</p>
							<p className="text-muted-foreground text-sm">{customer.email}</p>
						</td>
						<td className="px-4 py-3 text-sm">{customer.phone ?? t("admin.customers.none")}</td>
						<td className="px-4 py-3 text-sm">{customer.orderCount}</td>
						<td className="px-4 py-3 text-sm">{currency(customer.totalSpent)}</td>
						<td className="px-4 py-3 text-sm">
							{customer.lastOrderAt
								? new Date(customer.lastOrderAt).toLocaleDateString("pt-BR")
								: t("admin.customers.none")}
						</td>
						<td className="px-4 py-3 text-right">
							<Link
								className={buttonClassName({
									className: "inline-flex gap-2",
									size: "sm",
									variant: "outline",
								})}
								params={{ customerId: customer.id }}
								to="/admin/customers/$customerId"
							>
								<LuEye className="size-4" />
								{t("admin.customers.detail.action")}
							</Link>
						</td>
					</tr>
				))}
			</tbody>
		</DataTable>
	);
}
