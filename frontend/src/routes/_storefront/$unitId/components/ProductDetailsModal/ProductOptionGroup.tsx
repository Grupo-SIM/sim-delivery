import { useTranslation } from "react-i18next";
import { LuChevronDown } from "react-icons/lu";
import type { SelectedOption } from "@/stores";
import { isGroupComplete } from "../product-options";
import { ProductOptionRow } from "./ProductOptionRow";
import type { OptionImagePreview, ProductOption, ProductOptionGroup as ProductOptionGroupType } from "./types";

interface ProductOptionGroupProps {
	expanded: boolean;
	group: ProductOptionGroupType;
	onImagePreview: (preview: OptionImagePreview) => void;
	onQuantityChange: (option: ProductOption, quantity: number) => void;
	onToggleExpanded: () => void;
	options: SelectedOption[];
}

export function ProductOptionGroup({
	expanded,
	group,
	onImagePreview,
	onQuantityChange,
	onToggleExpanded,
	options,
}: ProductOptionGroupProps) {
	const { t } = useTranslation();
	const groupSelected = options.filter(value => value.groupId === group.id);
	const groupQuantity = groupSelected.reduce((sum, value) => sum + value.quantity, 0);
	const complete = isGroupComplete(group, options);
	const collapsed = complete && !expanded;
	const summary =
		group.maxSelect === 1
			? groupSelected[0]?.optionName
			: groupSelected
					.filter(value => value.quantity > 0)
					.map(value => `${value.quantity}x ${value.optionName}`)
					.join(", ");
	const selectedImageUrl =
		group.maxSelect === 1
			? group.options.find(option => option.id === groupSelected[0]?.optionId)?.imageUrl
			: null;
	const priceRuleHint =
		group.priceRule === "average"
			? t("store.product.priceRuleAverage")
			: group.priceRule === "highest"
				? t("store.product.priceRuleHighest")
				: null;

	function chooseLabel() {
		const maxSelect = group.maxSelect == null ? null : Number(group.maxSelect);
		if (maxSelect == null) return t(group.required ? "store.product.chooseAtLeast" : "store.product.chooseAny");
		if (group.required && maxSelect === 1) return t("store.product.chooseExact", { count: 1 });
		if (!group.required) return t("store.product.chooseUpTo", { count: maxSelect });
		return t("store.product.chooseRange", { max: maxSelect, min: 1 });
	}

	return (
		<section className="relative min-w-0">
			<button
				className={`sticky top-0 z-10 block w-full min-w-0 border border-border bg-muted px-4 py-3 text-left shadow-sm ${
					collapsed ? "rounded-brand" : "rounded-t-brand"
				} ${complete ? "cursor-pointer" : "cursor-default"}
				}`}
				onClick={() => complete && onToggleExpanded()}
				type="button"
			>
				<div className="flex min-w-0 items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-3">
						{collapsed && selectedImageUrl && (
							<img alt="" className="size-10 shrink-0 rounded object-cover" src={selectedImageUrl} />
						)}
						<h3 className="truncate font-semibold text-foreground">{group.name}</h3>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						{complete ? (
							<span className="font-bold text-primary" title={t("store.product.optional")}>
								✓
							</span>
						) : group.required ? (
							<span className="rounded bg-foreground px-2 py-1 font-semibold text-[10px] text-background uppercase">
								{t("store.product.required")}
							</span>
						) : null}
						{complete && (
							<LuChevronDown
								aria-hidden="true"
								className={`text-muted-foreground transition-transform ${collapsed ? "" : "rotate-180"}`}
							/>
						)}
					</div>
				</div>
				<p className="mt-1 truncate text-muted-foreground text-sm">{collapsed ? summary : chooseLabel()}</p>
				{priceRuleHint && <p className="mt-1 text-muted-foreground text-xs leading-snug">{priceRuleHint}</p>}
				{group.maxSelect != null && (
					<p className="mt-2 font-medium text-muted-foreground text-xs">
						{t("store.product.selectionProgress", {
							count: groupQuantity,
							max: Number(group.maxSelect),
							selected: groupQuantity,
						})}
					</p>
				)}
			</button>
			{!collapsed && (
				<div className="divide-y divide-border overflow-hidden rounded-b-brand border-x border-b border-border">
					{group.options.map(option => (
						<ProductOptionRow
							group={group}
							groupQuantity={groupQuantity}
							key={option.id}
							onImagePreview={onImagePreview}
							onQuantityChange={onQuantityChange}
							option={option}
							selected={options.find(value => value.optionId === option.id)}
						/>
					))}
				</div>
			)}
		</section>
	);
}
