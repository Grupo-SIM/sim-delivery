import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { getStaffQueryKey, usePostStaff } from "@/lib/api";

type Role = "manager" | "attendant" | "kitchen" | "courier";

export function InviteStaffForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<Role>("attendant");
	const [error, setError] = useState<string | null>(null);

	const { isPending, mutate } = usePostStaff();

	const roleOptions = [
		{ label: t("admin.staff.roles.manager"), value: "manager" },
		{ label: t("admin.staff.roles.attendant"), value: "attendant" },
		{ label: t("admin.staff.roles.kitchen"), value: "kitchen" },
		{ label: t("admin.staff.roles.courier"), value: "courier" },
	];

	return (
		<form
			className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
			onSubmit={event => {
				event.preventDefault();
				setError(null);
				mutate(
					{ data: { email, name, password, role } },
					{
						onError: caught =>
							setError(
								caught.status === 409 ? t("admin.staff.invite.emailTaken") : t("admin.staff.invite.error"),
							),
						onSuccess: async () => {
							setName("");
							setEmail("");
							setPassword("");
							setRole("attendant");
							await queryClient.invalidateQueries({ queryKey: getStaffQueryKey() });
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
					onChange={event => setName(event.currentTarget.value)}
					placeholder={t("admin.staff.invite.namePlaceholder")}
					required
					value={name}
				/>
			</Label>
			<Label>
				<span>
					{t("admin.staff.invite.email")} <RequiredMark />
				</span>
				<Input
					onChange={event => setEmail(event.currentTarget.value)}
					placeholder={t("admin.staff.invite.emailPlaceholder")}
					required
					type="email"
					value={email}
				/>
			</Label>
			<Label>
				<span>
					{t("admin.staff.invite.password")} <RequiredMark />
				</span>
				<Input
					onChange={event => setPassword(event.currentTarget.value)}
					required
					type="password"
					value={password}
				/>
			</Label>
			<div className="flex flex-col gap-1.5">
				<span className="font-medium text-sm">{t("admin.staff.invite.role")}</span>
				<CustomSelect onChange={value => setRole(value as Role)} options={roleOptions} value={role} />
			</div>

			<div className="sm:col-span-2 lg:col-span-4">
				<Button disabled={isPending || !name || !email || password.length < 6} type="submit">
					{isPending ? t("admin.staff.invite.submitting") : t("admin.staff.invite.submit")}
				</Button>
				{error && <p className="mt-2 text-destructive text-xs">{error}</p>}
			</div>
		</form>
	);
}
