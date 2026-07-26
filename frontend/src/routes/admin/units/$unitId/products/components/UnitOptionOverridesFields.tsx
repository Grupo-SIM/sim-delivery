import { useTranslation } from "react-i18next";
import type { GetProductsByProductIdOptionGroups200 } from "@/lib/api";
import { UnitAdditionalOptionRow } from "./UnitAdditionalOptionRow";
import { UnitOptionOverrideRow } from "./UnitOptionOverrideRow";

export interface UnitAdditionalOption {
	available: boolean;
	description: string;
	groupId: string;
	imageUrl: string | null;
	maxPerItem: number | null;
	name: string;
	priceDeltaCents: number;
	sortOrder: number;
}

export interface UnitOptionOverride {
	available: boolean | null;
	description: string | null;
	imageUrl: string | null;
	maxPerItem: number | null;
	name: string | null;
	optionId: string;
	priceDeltaCents: number | null;
	sortOrder: number | null;
}

interface UnitOptionOverridesFieldsProps {
	additionalOptions: UnitAdditionalOption[];
	groups: GetProductsByProductIdOptionGroups200;
	onAdditionalOptionsChange: (options: UnitAdditionalOption[]) => void;
	onOptionOverridesChange: (overrides: UnitOptionOverride[]) => void;
	optionOverrides: UnitOptionOverride[];
}

export function UnitOptionOverridesFields({
	additionalOptions,
	groups,
	onAdditionalOptionsChange,
	onOptionOverridesChange,
	optionOverrides,
}: UnitOptionOverridesFieldsProps) {
	const { t } = useTranslation();
	const overrideByOptionId = new Map(optionOverrides.map(override => [override.optionId, override]));

	function updateOverride(optionId: string, changes: Partial<UnitOptionOverride>) {
		const existing = overrideByOptionId.get(optionId) ?? {
			available: null,
			description: null,
			imageUrl: null,
			maxPerItem: null,
			name: null,
			optionId,
			priceDeltaCents: null,
			sortOrder: null,
		};
		const next = { ...existing, ...changes };
		const isEmpty = Object.entries(next).every(([key, value]) => key === "optionId" || value === null);
		onOptionOverridesChange(
			isEmpty
				? optionOverrides.filter(override => override.optionId !== optionId)
				: [...optionOverrides.filter(override => override.optionId !== optionId), next],
		);
	}

	function addOption(groupId: string) {
		onAdditionalOptionsChange([
			...additionalOptions,
			{
				available: true,
				description: "",
				groupId,
				imageUrl: null,
				maxPerItem: null,
				name: "",
				priceDeltaCents: 0,
				sortOrder: 0,
			},
		]);
	}

	return (
		<section className="space-y-3">
			<h3 className="font-medium text-sm">{t("admin.products.options.title")}</h3>
			<p className="text-muted-foreground text-xs">{t("admin.products.options.optionDescription")}</p>
			{groups.map(group => (
				<div className="space-y-2 rounded border border-border p-2" key={group.id}>
					<div className="flex items-center justify-between gap-2">
						<p className="font-medium text-sm">{group.name}</p>
						<button
							className="cursor-pointer rounded border border-border px-2 py-1 text-sm"
							onClick={() => addOption(group.id)}
							type="button"
						>
							{t("admin.products.options.addOption")}
						</button>
					</div>
					{group.options.map(option => {
						const override = overrideByOptionId.get(option.id);
						const disabled = override?.available === false;
						return (
							<UnitOptionOverrideRow
								disabled={disabled}
								key={option.id}
								onDisabledChange={nextDisabled =>
									updateOverride(option.id, { available: nextDisabled ? false : null })
								}
								onPriceChange={priceDeltaCents => updateOverride(option.id, { priceDeltaCents })}
								option={option}
								override={override}
							/>
						);
					})}
					{additionalOptions
						.map((option, index) => ({ index, option }))
						.filter(({ option }) => option.groupId === group.id)
						.map(({ index, option }) => (
							<UnitAdditionalOptionRow
								key={`${group.id}-${index}`}
								onChange={next =>
									onAdditionalOptionsChange(
										additionalOptions.map((item, itemIndex) => (itemIndex === index ? next : item)),
									)
								}
								onRemove={() =>
									onAdditionalOptionsChange(additionalOptions.filter((_, itemIndex) => itemIndex !== index))
								}
								option={option}
							/>
						))}
				</div>
			))}
		</section>
	);
}
