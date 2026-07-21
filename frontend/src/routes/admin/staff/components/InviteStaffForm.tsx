import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { getStaffQueryKey, useGetUnits, usePostStaff } from "@/lib/api";

type Role = "manager" | "attendant" | "kitchen" | "courier";

export function InviteStaffForm() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [role, setRole] = useState<Role>("attendant");
	const [unitIds, setUnitIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [localName, setLocalName] = useDebouncedInput(name, setName);
	const [localEmail, setLocalEmail] = useDebouncedInput(email, setEmail);
	const unitsQuery = useGetUnits();

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
					{ data: { email, name, password, role, ...(role === "courier" ? { unitIds } : {}) } },
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
							setUnitIds([]);
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
			<Label>
				<span>
					{t("admin.staff.invite.password")} <RequiredMark />
				</span>
				<div className="relative">
					<Input
						className="pr-11"
						onChange={event => setPassword(event.currentTarget.value)}
						placeholder="Ex: Senha temporária"
						required
						type={showPassword ? "text" : "password"}
						value={password}
					/>
					<button
						aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
						className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						onClick={() => setShowPassword(current => !current)}
						title={showPassword ? "Ocultar senha" : "Mostrar senha"}
						type="button"
					>
						{showPassword ? <LuEyeOff className="size-4" /> : <LuEye className="size-4" />}
					</button>
				</div>
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

			{role === "courier" && (
				<fieldset className="sm:col-span-2 lg:col-span-4">
					<legend className="font-medium text-sm">{t("admin.staff.invite.units")}</legend>
					{unitsQuery.isPending ? (
						<div className="mt-2 h-11 animate-pulse rounded-md bg-muted" />
					) : (
						<div className="mt-2 flex flex-wrap gap-3">
							{unitsQuery.data?.map(unit => (
								<label
									className="flex cursor-pointer items-center gap-2 text-sm"
									htmlFor={`unit-${unit.id}`}
									key={unit.id}
								>
									<Checkbox
										checked={unitIds.includes(unit.id)}
										id={`unit-${unit.id}`}
										onChange={event => {
											const checked = event.currentTarget.checked;
											setUnitIds(current =>
												checked ? [...current, unit.id] : current.filter(unitId => unitId !== unit.id),
											);
										}}
									/>
									{unit.name}
								</label>
							))}
						</div>
					)}
				</fieldset>
			)}

			<div className="sm:col-span-2 lg:col-span-4">
				<Button
					disabled={
						isPending ||
						unitsQuery.isPending ||
						!name ||
						!email ||
						password.length < 6 ||
						(role === "courier" && unitIds.length === 0)
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
