import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { type GetStaff200, getStaffQueryKey, useDeleteStaffByStaffId, useGetUnits } from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { StaffEditorModal } from "./StaffEditorModal";

interface StaffRowProps {
	assignmentOnly?: boolean;
	member: GetStaff200[number];
}

export function StaffRow({ assignmentOnly = false, member }: StaffRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const remove = useDeleteStaffByStaffId();
	const unitsQuery = useGetUnits();
	const [isEditing, setIsEditing] = useState(false);
	const isOwner = member.role === "owner";
	const unitNames =
		unitsQuery.data?.filter(unit => member.unitIds.includes(unit.id)).map(unit => unit.name) ?? [];

	function removeMember() {
		remove.mutate(
			{ staffId: member.id },
			{
				onError: () => void showAlert(t("admin.staff.row.removeError")),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getStaffQueryKey() });
					showToast(t("admin.staff.row.removeSuccess"), "positive");
				},
			},
		);
	}

	return (
		<tr className="border-border/60 border-b last:border-0">
			<td className="px-4 py-3 font-medium">{member.name}</td>
			<td className="px-4 py-3 text-muted-foreground">{member.email}</td>
			<td className="px-4 py-3 text-muted-foreground">
				{t(`admin.staff.roles.${member.role}`, { defaultValue: member.role })}
			</td>
			<td className="px-4 py-3 text-muted-foreground">
				{isOwner ? (
					"—"
				) : unitsQuery.isPending ? (
					<div className="h-5 w-28 animate-pulse rounded bg-muted" />
				) : unitNames.length > 0 ? (
					unitNames.join(", ")
				) : (
					t("admin.staff.row.noUnits")
				)}
			</td>
			<td className="px-4 py-3 text-right">
				{!isOwner && (
					<div className="flex justify-end gap-2">
						<Tooltip content={t("admin.staff.row.edit")}>
							<Button
								className="cursor-pointer"
								onClick={() => setIsEditing(true)}
								size="sm"
								type="button"
								variant="outline"
							>
								<LuPencil className="size-4" />
								{t("admin.staff.row.edit")}
							</Button>
						</Tooltip>
						{!assignmentOnly && (
							<ConfirmActionButton
								confirmation={t("admin.staff.row.removeConfirm", { name: member.name })}
								confirmLabel={t("admin.staff.row.remove")}
								disabled={remove.isPending}
								onConfirm={removeMember}
								size="sm"
								type="button"
								variant="outline"
							>
								<LuTrash2 className="size-4" />
								{t("admin.staff.row.remove")}
							</ConfirmActionButton>
						)}
					</div>
				)}
			</td>
			<StaffEditorModal assignmentOnly={assignmentOnly} member={isEditing ? member : null} onClose={() => setIsEditing(false)} />
		</tr>
	);
}
