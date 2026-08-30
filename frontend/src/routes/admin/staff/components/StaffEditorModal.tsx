import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import {
	type GetStaff200,
	getStaffQueryKey,
	useGetUnits,
	usePatchStaffByStaffId,
	usePutStaffByStaffIdUnits,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { StaffUnitSelector } from "./StaffUnitSelector";

type EditableRole = "manager" | "attendant" | "kitchen" | "courier";

interface StaffEditorModalProps {
	member: GetStaff200[number] | null;
	onClose: () => void;
}

export function StaffEditorModal({ member, onClose }: StaffEditorModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const unitsQuery = useGetUnits();
	const patch = usePatchStaffByStaffId();
	const updateUnits = usePutStaffByStaffIdUnits();
	const [role, setRole] = useState<EditableRole>("attendant");
	const [unitIds, setUnitIds] = useState<string[]>([]);

	useEffect(() => {
		if (!member) return;
		setRole(member.role as EditableRole);
		setUnitIds(member.unitIds);
	}, [member]);

	const roleOptions = [
		{ label: t("admin.staff.roles.manager"), value: "manager" },
		{ label: t("admin.staff.roles.attendant"), value: "attendant" },
		{ label: t("admin.staff.roles.kitchen"), value: "kitchen" },
		{ label: t("admin.staff.roles.courier"), value: "courier" },
	];
	const isSaving = patch.isPending || updateUnits.isPending;

	async function save() {
		if (!member || unitIds.length === 0) return;
		try {
			await patch.mutateAsync({ data: { role }, staffId: member.id });
			await updateUnits.mutateAsync({ data: { unitIds }, staffId: member.id });
			await queryClient.invalidateQueries({ queryKey: getStaffQueryKey() });
			showToast(t("admin.staff.row.updateSuccess"), "positive");
			onClose();
		} catch {
			void showAlert(t("admin.staff.row.updateError"));
		}
	}

	return (
		<Modal
			isOpen={member !== null}
			onClose={onClose}
			title={t("admin.staff.row.editTitle")}
			urlKey="staff-edit"
			urlState={member?.id}
		>
			<div className="space-y-5">
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<span className="font-medium text-sm">{t("admin.staff.columns.name")}</span>
						<p className="mt-1 text-muted-foreground">{member?.name}</p>
					</div>
					<div>
						<span className="font-medium text-sm">{t("admin.staff.columns.email")}</span>
						<p className="mt-1 text-muted-foreground">{member?.email}</p>
					</div>
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="font-medium text-sm">{t("admin.staff.columns.role")}</span>
					<CustomSelect
						onChange={value => setRole(value as EditableRole)}
						options={roleOptions}
						value={role}
					/>
				</div>
				<fieldset>
					<legend className="font-medium text-sm">{t("admin.staff.invite.units")}</legend>
					{unitsQuery.isPending ? (
						<div className="mt-2 h-11 animate-pulse rounded-md bg-muted" />
					) : (
						<StaffUnitSelector
							idPrefix={`staff-edit-unit-${member?.id ?? ""}`}
							onChange={setUnitIds}
							unitIds={unitIds}
							units={unitsQuery.data ?? []}
						/>
					)}
				</fieldset>
				<div className="flex justify-end gap-2">
					<Button disabled={isSaving} onClick={onClose} type="button" variant="outline">
						{t("admin.staff.row.cancel")}
					</Button>
					<Button
						disabled={isSaving || unitsQuery.isPending || unitIds.length === 0}
						onClick={() => void save()}
						type="button"
					>
						{isSaving ? t("admin.staff.row.saving") : t("admin.staff.row.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
