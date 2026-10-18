import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RequiredMark } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import { type GetCompanies200, usePostCompaniesByCompanyIdOwner } from "@/lib/api";
import { showToast } from "@/stores";

interface ProvisionOwnerModalProps {
	company: GetCompanies200[number];
	isOpen: boolean;
	onClose: () => void;
}

export function ProvisionOwnerModal({ company, isOpen, onClose }: ProvisionOwnerModalProps) {
	const { t } = useTranslation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const provision = usePostCompaniesByCompanyIdOwner();
	useEffect(() => {
		if (!isOpen) return;
		setEmail(company.ownerEmail ?? "");
		setPassword("");
	}, [company.ownerEmail, isOpen]);
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t("admin.companies.owner.title", { name: company.name })}
			urlKey="company-owner"
			urlState={company.id}
		>
			<form
				className="space-y-5"
				onSubmit={event => {
					event.preventDefault();
					if (provision.isPending) return;
					provision.mutate(
						{ companyId: company.id, data: { email: email.trim(), ...(password ? { password } : {}) } },
						{
							onError: () => showToast(t("admin.companies.owner.error"), "negative"),
							onSuccess: () => {
								showToast(
									t(password ? "admin.companies.owner.created" : "admin.companies.owner.invited"),
									"positive",
								);
								closeActiveModalHistory();
							},
						},
					);
				}}
			>
				<TextField
					autoComplete="email"
					label={
						<span>
							{t("admin.companies.owner.email")} <RequiredMark />
						</span>
					}
					name="owner-email"
					onValueChange={setEmail}
					placeholder="dono@empresa.com.br"
					required
					type="email"
					value={email}
				/>
				<TextField
					autoComplete="new-password"
					label={t("admin.companies.owner.password")}
					maxLength={128}
					minLength={6}
					name="owner-password"
					onValueChange={setPassword}
					placeholder={t("admin.companies.owner.passwordPlaceholder")}
					type="password"
					value={password}
				/>
				<p className="text-muted-foreground text-sm">{t("admin.companies.owner.hint")}</p>
				<div className="flex justify-end gap-2">
					<Button onClick={() => closeActiveModalHistory()} type="button" variant="outline">
						{t("admin.companies.owner.discard")}
					</Button>
					<Button disabled={provision.isPending || !email.trim()} type="submit">
						{t(provision.isPending ? "admin.companies.owner.saving" : "admin.companies.owner.save")}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
