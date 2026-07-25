import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuTrash2 } from "react-icons/lu";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
	type GetStaff200,
	getStaffQueryKey,
	useDeleteStaffByStaffId,
	useGetUnits,
	usePatchStaffByStaffId,
	usePutStaffByCourierIdUnits,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";

type EditableRole = "manager" | "attendant" | "kitchen" | "courier";

const editableRoles = new Set<string>(["manager", "attendant", "kitchen", "courier"]);

interface StaffRowProps {
	member: GetStaff200[number];
}

export function StaffRow({ member }: StaffRowProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const patch = usePatchStaffByStaffId();
	const remove = useDeleteStaffByStaffId();
	const updateUnits = usePutStaffByCourierIdUnits();
	const unitsQuery = useGetUnits();

	const isEditableRole = editableRoles.has(member.role);
	const canRemove = isEditableRole || member.role === "courier";
	const invalidate = () => queryClient.invalidateQueries({ queryKey: getStaffQueryKey() });

	const roleOptions = [
		{ label: t("admin.staff.roles.manager"), value: "manager" },
		{ label: t("admin.staff.roles.attendant"), value: "attendant" },
		{ label: t("admin.staff.roles.kitchen"), value: "kitchen" },
		{ label: t("admin.staff.roles.courier"), value: "courier" },
	];

	function changeRole(role: string) {
		patch.mutate(
			{ data: { role: role as EditableRole }, staffId: member.id },
			{
				onError: () => void showAlert(t("admin.staff.row.updateError")),
				onSuccess: () => {
					void invalidate();
					showToast(t("admin.staff.row.updateSuccess"), "positive");
				},
			},
		);
	}

	function removeMember() {
		remove.mutate(
			{ staffId: member.id },
			{
				onError: () => void showAlert(t("admin.staff.row.removeError")),
				onSuccess: () => {
					void invalidate();
					showToast(t("admin.staff.row.removeSuccess"), "positive");
				},
			},
		);
	}

	function toggleUnit(unitId: string) {
		const unitIds = member.unitIds.includes(unitId)
			? member.unitIds.filter(id => id !== unitId)
			: [...member.unitIds, unitId];
		updateUnits.mutate(
			{ courierId: member.id, data: { unitIds } },
			{
				onError: () => void showAlert(t("admin.staff.row.updateError")),
				onSuccess: () => {
					void invalidate();
					showToast(t("admin.staff.row.updateSuccess"), "positive");
				},
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
			<td className="px-4 py-3">
				{(member.role === "courier" || member.role === "kitchen") &&
					(unitsQuery.isPending ? (
						<div className="h-8 w-40 animate-pulse rounded bg-muted" />
					) : (
						<div className="flex flex-wrap gap-2">
							{unitsQuery.data?.map(unit => (
								// biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is a custom control nested in the label.
								<label className="flex cursor-pointer items-center gap-1 text-sm" key={unit.id}>
									<Checkbox
										checked={member.unitIds.includes(unit.id)}
										disabled={updateUnits.isPending}
										onChange={() => toggleUnit(unit.id)}
									/>
									{unit.name}
								</label>
							))}
						</div>
					))}
			</td>
			<td className="px-4 py-3 text-right">
				{canRemove && (
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
			</td>
		</tr>
	);
}
