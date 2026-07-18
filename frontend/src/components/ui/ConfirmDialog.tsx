import { LuCircleAlert } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { Button } from "./button";
import { Modal } from "./Modal";
import { useDialogStore } from "@/stores/dialog";
export function ConfirmDialog() {
	const { t } = useTranslation(); const { close, current } = useDialogStore(); if (!current) return null;
	const confirm = current.type === "confirm"; const title = current.title ?? t(confirm ? "actions.confirm" : "actions.attention", { defaultValue: "Atenção" });
	return <Modal isOpen onClose={() => close(false)} title={<span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary"><LuCircleAlert className="size-5" /></span>{title}</span>}><p className="whitespace-pre-line text-muted-foreground text-sm leading-6">{current.message}</p><div className="mt-6 flex justify-end gap-3">{confirm && <Button onClick={() => close(false)} type="button" variant="outline">{t("actions.cancel")}</Button>}<Button autoFocus onClick={() => close(true)} type="button">{confirm ? (current.confirmLabel ?? t("actions.confirm")) : t("actions.ok")}</Button></div></Modal>;
}