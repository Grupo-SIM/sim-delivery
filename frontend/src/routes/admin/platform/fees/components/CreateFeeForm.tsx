import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { postPlatformFees } from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import { FeeForm } from "./FeeForm";
import type { FeeFormValue } from "./types";

export function CreateFeeForm() {
	const queryClient = useQueryClient();
	const [formKey, setFormKey] = useState(0);
	const [isPending, setIsPending] = useState(false);
	async function create(value: FeeFormValue) {
		setIsPending(true);
		try {
			await postPlatformFees(value);
			await queryClient.invalidateQueries({ queryKey: ["Platform Fees"] });
			setFormKey(current => current + 1);
			showToast("Taxa criada.", "positive");
		} catch { void showAlert("Não foi possível criar a taxa. Verifique nome e valor."); }
		finally { setIsPending(false); }
	}
	return <div className="rounded-xl border border-border bg-card text-card-foreground p-5"><h2 className="mb-4 font-semibold">Nova taxa</h2><FeeForm isPending={isPending} key={formKey} onSubmit={value => void create(value)} /></div>;
}
