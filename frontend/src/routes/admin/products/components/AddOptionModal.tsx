import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { closeActiveModalHistory } from "@/hooks/use-modal-history";
import type { EditableOption } from "./OptionEditor";
import { OptionFormFields } from "./OptionFormFields";

interface AddOptionModalProps {
	isSaving: boolean;
	onAdd: (option: EditableOption) => Promise<boolean>;
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

export function AddOptionModal({ isSaving, onAdd }: AddOptionModalProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const [option, setOption] = useState(() => createOption(0));
	const draftRef = useRef(option);
	const [isUploading, setIsUploading] = useState(false);

	function open() {
		const draft = createOption(0);
		draftRef.current = draft;
		setOption(draft);
		setIsOpen(true);
	}

	async function add() {
		if (!draftRef.current.name.trim()) return;
		if (await onAdd({ ...draftRef.current, name: draftRef.current.name.trim() })) closeActiveModalHistory();
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
				urlKey="product-option-add"
			>
				<div className="grid gap-3 md:grid-cols-2">
					<OptionFormFields
						draftRef={draftRef}
						onChange={setOption}
						onUploadingChange={setIsUploading}
						option={option}
					/>
					<div className="flex justify-end gap-2 md:col-span-2">
						<Button onClick={() => closeActiveModalHistory()} type="button" variant="outline">
							{t("admin.products.options.discardChanges")}
						</Button>
						<Button
							disabled={isSaving || isUploading || !option.name.trim()}
							onClick={() => void add()}
							type="button"
						>
							{t("admin.products.options.addOption")}
						</Button>
					</div>
				</div>
			</Modal>
		</>
	);
}
