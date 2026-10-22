import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { getStaffQueryKey, useGetUnits, usePostStaff } from "@/lib/api";
import { showToast, useAuthStore } from "@/stores";
import { StaffUnitSelector } from "./StaffUnitSelector";

type Role = "owner" | "manager" | "attendant" | "kitchen" | "courier";

export function InviteStaffForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const currentUserRole = useAuthStore(state => state.role);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<Role>("attendant");
	const [unitIds, setUnitIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [localName, setLocalName] = useDebouncedInput(name, setName);
	const [localEmail, setLocalEmail] = useDebouncedInput(email, setEmail);
	const unitsQuery = useGetUnits();

	const { isPending, mutate } = usePostStaff();

	const roleOptions = [
		...(currentUserRole === "owner" || currentUserRole === "superAdmin"
			? [{ label: t("admin.staff.roles.owner"), value: "owner" }]
			: []),
		{ label: t("admin.staff.roles.manager"), value: "manager" },
		{ label: t("admin.staff.roles.attendant"), value: "attendant" },
		{ label: t("admin.staff.roles.kitchen"), value: "kitchen" },
		{ label: t("admin.staff.roles.courier"), value: "courier" },
	];
	const needsUnits = role !== "owner";

	return (
		<form
			className="grid gap-4 rounded-lg border border-border bg-card text-card-foreground p-4 sm:grid-cols-2 lg:grid-cols-4"
			onSubmit={event => {
				event.preventDefault();
				setError(null);
				mutate(
					{ data: { email, name, role, ...(needsUnits ? { unitIds } : {}) } },
					{
						onError: caught =>
							setError(
								caught.status === 409 ? t("admin.staff.invite.emailTaken") : t("admin.staff.invite.error"),
							),
						onSuccess: async () => {
							setName("");
							setEmail("");
							setRole("attendant");
							setUnitIds([]);
							await queryClient.invalidateQueries({ queryKey: getStaffQueryKey() });
							showToast(t("admin.staff.invite.emailSent"), "positive");
						},
					},
				);
			}}
		>
			<Label>
				<span>
					{t("admin.staff.invite.name")} <RequiredMark />
				</span>
				<Input
					onChange={event => setLocalName(event.currentTarget.value)}
					placeholder={t("admin.staff.invite.namePlaceholder")}
					required
					value={localName}
				/>
			</Label>
			<Label>
				<span>
					{t("admin.staff.invite.email")} <RequiredMark />
				</span>
				<Input
					onChange={event => setLocalEmail(event.currentTarget.value)}
					placeholder={t("admin.staff.invite.emailPlaceholder")}
					required
					type="email"
					value={localEmail}
				/>
			</Label>
			<div className="flex flex-col gap-1.5">
				<span className="font-medium text-sm">{t("admin.staff.invite.role")}</span>
				<CustomSelect
					onChange={value => {
						setRole(value as Role);
						setUnitIds([]);
					}}
					options={roleOptions}
					value={role}
				/>
			</div>

			{needsUnits && (
				<fieldset className="sm:col-span-2 lg:col-span-4">
					<legend className="font-medium text-sm">{t("admin.staff.invite.units")}</legend>
					{unitsQuery.isPending ? (
						<div className="mt-2 h-11 animate-pulse rounded-md bg-muted" />
					) : (
						<StaffUnitSelector
							idPrefix="invite-staff-unit"
							onChange={setUnitIds}
							unitIds={unitIds}
							units={unitsQuery.data ?? []}
						/>
					)}
				</fieldset>
			)}

			<div className="sm:col-span-2 lg:col-span-4">
				<Button
					disabled={
						isPending || unitsQuery.isPending || !name || !email || (needsUnits && unitIds.length === 0)
					}
					type="submit"
				>
					{isPending ? t("admin.staff.invite.submitting") : t("admin.staff.invite.submit")}
				</Button>
				{error && <p className="mt-2 text-destructive text-xs">{error}</p>}
			</div>
		</form>
	);
}
