import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { useGetStaff } from "@/lib/api";
import { isAttendant } from "@/lib/staff-guard";
import { useAuthStore } from "@/stores";
import { InviteStaffForm, StaffTable } from "./components";

function StaffPage() {
	const { t } = useTranslation();
	const { data: staff, isError, isPending } = useGetStaff();
	const role = useAuthStore(state => state.role);
	const assignmentOnly = isAttendant(role);
	const [search, setSearch] = useState("");

	const filteredStaff = useMemo(() => {
		if (!staff) return staff;
		const query = search.trim().toLowerCase();
		const filtered = !query
			? staff
			: staff.filter(
					member => member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query),
				);
		return [...filtered].sort((left, right) =>
			left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" }),
		);
	}, [staff, search]);

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.staff.subtitle")} title={t("admin.staff.title")} />

			{!assignmentOnly && <InviteStaffForm />}

			<div className="max-w-sm">
				<TextField
					label={t("admin.staff.search.label")}
					onValueChange={setSearch}
					placeholder={t("admin.staff.search.placeholder")}
					value={search}
				/>
			</div>

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("admin.staff.loadError")} />
			) : (
				<StaffTable assignmentOnly={assignmentOnly} staff={filteredStaff ?? []} />
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/staff/")({
	component: StaffPage,
});
