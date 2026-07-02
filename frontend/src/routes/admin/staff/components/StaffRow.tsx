import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
	getStaffQueryKey,
	type GetStaff200,
	useDeleteStaffByStaffId,
	usePatchStaffByStaffId,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { showAlert, showConfirm } from "@/stores";

type Level = "manager" | "attendant" | "kitchen";

interface StaffRowProps {
	member: GetStaff200[number];
}

export function StaffRow({ member }: StaffRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patch = usePatchStaffByStaffId();
	const remove = useDeleteStaffByStaffId();

	const isEmployee = member.role === "employee";
	const invalidate = () => queryClient.invalidateQueries({ queryKey: getStaffQueryKey() });

	const levelOptions = [
		{ label: t("admin.staff.levels.manager"), value: "manager" },
		{ label: t("admin.staff.levels.attendant"), value: "attendant" },
		{ label: t("admin.staff.levels.kitchen"), value: "kitchen" },
	];

	function changeLevel(level: string) {
		patch.mutate(
			{ data: { level: level as Level }, staffId: member.id },
			{
				onError: () => void showAlert(t("admin.staff.row.updateError")),
				onSuccess: () => invalidate(),
			},
		);
	}

	async function removeMember() {
		if (!(await showConfirm(t("admin.staff.row.removeConfirm", { name: member.name })))) {
			return;
		}
		remove.mutate(
			{ staffId: member.id },
			{
				onError: () => void showAlert(t("admin.staff.row.removeError")),
				onSuccess: () => invalidate(),
			},
		);
	}

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-4 py-3 font-medium">{member.name}</td>
			<td className="px-4 py-3 text-muted-foreground">{member.email}</td>
			<td className="px-4 py-3 text-muted-foreground">{t(`admin.staff.roles.${member.role}`, { defaultValue: member.role })}</td>
			<td className="px-4 py-3">
				{isEmployee ? (
					<CustomSelect
						className="w-40"
						onChange={changeLevel}
						options={levelOptions}
						value={member.level ?? "attendant"}
					/>
				) : (
					<span className="text-muted-foreground">{t("admin.staff.levels.none")}</span>
				)}
			</td>
			<td className="px-4 py-3 text-right">
				{isEmployee && (
					<Button disabled={remove.isPending} onClick={removeMember} size="sm" type="button" variant="outline">
						{t("admin.staff.row.remove")}
					</Button>
				)}
			</td>
		</tr>
	);
}
