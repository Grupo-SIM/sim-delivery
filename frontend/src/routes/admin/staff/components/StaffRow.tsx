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

type EditableRole = "manager" | "attendant" | "kitchen";

const editableRoles = new Set<string>(["manager", "attendant", "kitchen"]);

interface StaffRowProps {
	member: GetStaff200[number];
}

export function StaffRow({ member }: StaffRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patch = usePatchStaffByStaffId();
	const remove = useDeleteStaffByStaffId();

	const isEditableRole = editableRoles.has(member.role);
	const invalidate = () => queryClient.invalidateQueries({ queryKey: getStaffQueryKey() });

	const roleOptions = [
		{ label: t("admin.staff.roles.manager"), value: "manager" },
		{ label: t("admin.staff.roles.attendant"), value: "attendant" },
		{ label: t("admin.staff.roles.kitchen"), value: "kitchen" },
	];

	function changeRole(role: string) {
		patch.mutate(
			{ data: { role: role as EditableRole }, staffId: member.id },
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
			<td className="px-4 py-3">
				{isEditableRole ? (
					<CustomSelect className="w-40" onChange={changeRole} options={roleOptions} value={member.role} />
				) : (
					<span className="text-muted-foreground">
						{t(`admin.staff.roles.${member.role}`, { defaultValue: member.role })}
					</span>
				)}
			</td>
			<td className="px-4 py-3 text-right">
				{isEditableRole && (
					<Button disabled={remove.isPending} onClick={removeMember} size="sm" type="button" variant="outline">
						{t("admin.staff.row.remove")}
					</Button>
				)}
			</td>
		</tr>
	);
}
