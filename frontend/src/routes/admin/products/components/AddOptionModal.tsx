import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import type { EditableOption } from "./OptionEditor";
import { OptionFormFields } from "./OptionFormFields";

interface AddOptionModalProps {
	onAdd: (option: EditableOption) => void;
}

function createOption(sortOrder: number): EditableOption {
	return {
		available: true,
		description: "",
		id: crypto.randomUUID(),
		imageUrl: null,
		name: "",
		priceDeltaCents: 0,
		sortOrder,
	};
}

export function AddOptionModal({ onAdd }: AddOptionModalProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const [option, setOption] = useState(() => createOption(0));
	const draftRef = useRef(option);

	function open() {
		const draft = createOption(0);
		draftRef.current = draft;
		setOption(draft);
		setIsOpen(true);
	}

	function add() {
		if (!draftRef.current.name.trim()) return;
		onAdd({ ...draftRef.current, name: draftRef.current.name.trim() });
		setIsOpen(false);
	}

	return (
		<>
			<Button onClick={open} type="button" variant="outline">
				{t("admin.products.options.addOption")}
			</Button>
			<Modal
				isOpen={isOpen}
				maxWidth="640px"
				onClose={() => setIsOpen(false)}
				title={t("admin.products.options.addOption")}
			>
				<div className="grid gap-3 md:grid-cols-2">
					<OptionFormFields draftRef={draftRef} onChange={setOption} option={option} />
					<p className="text-muted-foreground text-xs md:col-span-2">
						{t("admin.products.options.draftChangesHint")}
					</p>
					<div className="flex justify-end gap-2 md:col-span-2">
						<Button onClick={() => setIsOpen(false)} type="button" variant="outline">
							{t("admin.products.options.discardChanges")}
						</Button>
						<Button onClick={add} type="button">
							{t("admin.products.options.addOption")}
						</Button>
					</div>
				</div>
			</Modal>
		</>
	);
}
