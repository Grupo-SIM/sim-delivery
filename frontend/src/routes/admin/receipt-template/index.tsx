import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuRotateCcw, LuSave } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { getReceiptTemplateQueryKey, useGetReceiptTemplate, usePutReceiptTemplate } from "@/lib/api";
import { showToast } from "@/stores";
import { DEFAULT_RECEIPT_TEMPLATE, ReceiptPreview, type ReceiptTemplate, ReceiptTemplateEditor } from "./components";

function ReceiptTemplatePage() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const query = useGetReceiptTemplate();
	const update = usePutReceiptTemplate();
	const [template, setTemplate] = useState<ReceiptTemplate>(DEFAULT_RECEIPT_TEMPLATE);

	useEffect(() => {
		if (query.data) setTemplate(query.data);
	}, [query.data]);

	function restoreDefault() {
		setTemplate(structuredClone(DEFAULT_RECEIPT_TEMPLATE));
		showToast(t("admin.receiptTemplate.restore.feedback"), "info");
	}

	function save() {
		if (template.blocks.length === 0) {
			showToast(t("admin.receiptTemplate.save.emptyError"), "negative");
			return;
		}
		update.mutate(
			{ data: template },
			{
				onError: () => showToast(t("admin.receiptTemplate.save.error"), "negative"),
				onSuccess: async data => {
					setTemplate(data);
					await queryClient.invalidateQueries({ queryKey: getReceiptTemplateQueryKey() });
					showToast(t("admin.receiptTemplate.save.success"), "positive");
				},
			},
		);
	}

	return (
		<Container className="flex flex-col gap-6 py-8 lg:h-dvh lg:min-h-0 lg:overflow-hidden" size="full">
			<SectionHeading subtitle={t("admin.receiptTemplate.subtitle")} title={t("admin.receiptTemplate.title")} />
			{query.isPending ? (
				<div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
					<div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-72" /></div>
					<Skeleton className="h-[720px] lg:h-full" />
				</div>
			) : query.isError ? (
				<ErrorState title={t("admin.receiptTemplate.loadError")} />
			) : (
				<div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
					<div className="flex min-h-0 flex-col gap-4">
						<div className="flex min-h-0 flex-1 flex-col">
							<ReceiptTemplateEditor onChange={setTemplate} template={template} />
						</div>
						<div className="z-30 flex shrink-0 flex-wrap justify-end gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur">
						<Button disabled={update.isPending} onClick={restoreDefault} type="button" variant="outline">
							<LuRotateCcw className="size-4" />{t("admin.receiptTemplate.restore.action")}
						</Button>
						<Button disabled={update.isPending} onClick={save} type="button">
							<LuSave className="size-4" />
							{update.isPending ? t("admin.receiptTemplate.save.pending") : t("admin.receiptTemplate.save.action")}
						</Button>
						</div>
					</div>
					<div className="min-h-0"><ReceiptPreview template={template} /></div>
				</div>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/receipt-template/")({ component: ReceiptTemplatePage });
