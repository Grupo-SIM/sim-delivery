import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetStaff } from "@/lib/api";
import { InviteStaffForm, StaffTable } from "./components";

function StaffPage() {
	const { t } = useTranslation();
	const { data: staff, isError, isPending } = useGetStaff();

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.staff.subtitle")} title={t("admin.staff.title")} />

			<InviteStaffForm />

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.staff.loadError")} />
			) : (
				<StaffTable staff={staff} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/staff/")({
	component: StaffPage,
});
