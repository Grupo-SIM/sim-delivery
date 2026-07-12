import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { useGetPublicUnitsByUnitIdMenu } from "@/lib/api";
import type { SelectedOption } from "@/stores";
import { useCartStore } from "@/stores";
import { money } from "../../components/types";
import type { OptionGroup, Selections } from "./components";
import { AddToCartModal, OptionGroupBlock, PopularOptionsStrip } from "./components";

function ProductPage() {
	const { t } = useTranslation();
	const { productId, unitId } = Route.useParams();
	const navigate = useNavigate();
	const addItem = useCartStore(s => s.addItem);
	const menu = useGetPublicUnitsByUnitIdMenu(unitId);

	const item = menu.data?.flatMap(s => s.items).find(i => i.productId === productId);

	const [query, setQuery] = useState("");
	const [localQuery, setLocalQuery] = useDebouncedInput(query, setQuery);
	const [selections, setSelections] = useState<Selections>({});
	const [modalOpen, setModalOpen] = useState(false);

	const basePriceCents = Number(item?.priceCents ?? 0);

	const totalDelta =
		item?.optionGroups.reduce((acc, group) => {
			const sels = selections[group.id] ?? [];
			if (sels.length === 0) return acc;
			if (group.priceRule === "highest") {
				return acc + Math.max(...sels.map(s => s.priceDeltaCents));
			}
			if (group.priceRule === "average") {
				const sum = sels.reduce((s, x) => s + x.priceDeltaCents * x.quantity, 0);
				const count = sels.reduce((s, x) => s + x.quantity, 0);
				return acc + (count > 0 ? Math.round(sum / count) : 0);
			}
			return acc + sels.reduce((s, x) => s + x.priceDeltaCents * x.quantity, 0);
		}, 0) ?? 0;

	const totalCents = basePriceCents + totalDelta;

	const firstInvalidGroup = item?.optionGroups.find(g => {
		const qty = (selections[g.id] ?? []).reduce((s, x) => s + x.quantity, 0);
		return qty < Number(g.minSelect);
	});

	function handleToggle(groupId: string, optionId: string, optionName: string, priceDeltaCents: number) {
		setSelections(prev => {
			const current = prev[groupId] ?? [];
			const isAlreadySelected = current.some(s => s.optionId === optionId);
			return {
				...prev,
				[groupId]: isAlreadySelected ? [] : [{ optionId, optionName, priceDeltaCents, quantity: 1 }],
			};
		});
	}

	function handleChangeQty(
		groupId: string,
		optionId: string,
		optionName: string,
		priceDeltaCents: number,
		delta: number,
	) {
		setSelections(prev => {
			const current = prev[groupId] ?? [];
			const existing = current.find(s => s.optionId === optionId);
			let next: any[];

			if (!existing) {
				if (delta <= 0) return prev;
				next = [...current, { optionId, optionName, priceDeltaCents, quantity: delta }];
			} else {
				const newQty = existing.quantity + delta;
				next =
					newQty <= 0
						? current.filter(s => s.optionId !== optionId)
						: current.map(s => (s.optionId === optionId ? { ...s, quantity: newQty } : s));
			}
			return { ...prev, [groupId]: next };
		});
	}

	function handleSelectPopular(
		group: OptionGroup,
		optionId: string,
		optionName: string,
		priceDeltaCents: number,
	) {
		if (group.selectionType === "single") {
			handleToggle(group.id, optionId, optionName, priceDeltaCents);
		} else {
			handleChangeQty(group.id, optionId, optionName, priceDeltaCents, 1);
		}
	}

	function buildOptions(): SelectedOption[] {
		if (!item) return [];
		return item.optionGroups.flatMap(group =>
			(selections[group.id] ?? []).map(s => ({
				groupId: group.id,
				groupName: group.name,
				optionId: s.optionId,
				optionName: s.optionName,
				priceDeltaCents: s.priceDeltaCents,
				quantity: s.quantity,
			})),
		);
	}

	function handleAdd() {
		if (!item || firstInvalidGroup) return;
		setModalOpen(true);
	}

	function commitAdd(quantity: number, note: string) {
		if (!item) return;
		addItem(
			unitId,
			{
				id: item.id,
				imageUrl: item.imageUrl,
				options: buildOptions(),
				priceCents: totalCents,
				productId: item.productId,
				title: item.title,
			},
			quantity,
			note,
		);
	}

	function handleConfirmAndStay(quantity: number, note: string) {
		commitAdd(quantity, note);
		setModalOpen(false);
		void navigate({ params: { unitId }, to: "/$unitId" });
	}

	function handleConfirmAndCheckout(quantity: number, note: string) {
		commitAdd(quantity, note);
		setModalOpen(false);
		void navigate({ params: { unitId }, to: "/$unitId/checkout" });
	}

	if (menu.isPending) {
		return (
			<Container className="space-y-4 py-8">
				<Skeleton className="h-52 w-full" />
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-40 w-full" />
			</Container>
		);
	}

	if (!item) {
		return (
			<Container className="space-y-4 py-8">
				<ErrorState title={t("store.product.notFound")} />
				<Link className="text-primary text-sm" params={{ unitId }} to="/$unitId">
					← {t("store.checkout.back")}
				</Link>
			</Container>
		);
	}

	const hasGroups = item.optionGroups.length > 0;

	return (
		<>
			<Container className="space-y-4 pt-6 pb-32">
				<Link className="text-primary text-sm" params={{ unitId }} to="/$unitId">
					← {t("store.checkout.back")}
				</Link>

				<div className="overflow-hidden rounded-brand">
					<img alt={item.title} className="h-52 w-full object-cover" src={item.imageUrl} />
				</div>

				<div className="space-y-1">
					<h1 className="font-bold text-xl">{item.title}</h1>
					{item.description && <p className="text-muted-foreground text-sm">{item.description}</p>}
					<p className="font-semibold text-primary">
						{hasGroups
							? `${t("store.product.from")} ${money.format(Number(item.fromPriceCents) / 100)}`
							: money.format(basePriceCents / 100)}
					</p>
				</div>

				{hasGroups && (
					<>
						<PopularOptionsStrip
							groups={item.optionGroups}
							onSelect={handleSelectPopular}
							selections={selections}
						/>

						<Input
							onChange={e => setLocalQuery(e.currentTarget.value)}
							placeholder={t("store.product.searchOptions")}
							value={localQuery}
						/>

						<div className="space-y-3">
							{item.optionGroups.map(group => (
								<OptionGroupBlock
									group={group}
									key={group.id}
									onChangeQty={(optionId, optionName, priceDeltaCents, delta) =>
										handleChangeQty(group.id, optionId, optionName, priceDeltaCents, delta)
									}
									onToggle={(optionId, optionName, priceDeltaCents) =>
										handleToggle(group.id, optionId, optionName, priceDeltaCents)
									}
									query={query}
									selections={selections[group.id] ?? []}
								/>
							))}
						</div>
					</>
				)}

				<div className="fixed inset-x-0 bottom-0 border-border/60 border-t bg-background px-4 py-4 shadow-lg">
					<div className="mx-auto max-w-3xl">
						<Button className="w-full" disabled={!!firstInvalidGroup} onClick={handleAdd} type="button">
							{firstInvalidGroup
								? t("store.product.chooseGroup", { group: firstInvalidGroup.name })
								: `${t("store.cart.add")} · ${money.format(totalCents / 100)}`}
						</Button>
					</div>
				</div>
			</Container>

			{item && (
				<AddToCartModal
					isOpen={modalOpen}
					onClose={() => setModalOpen(false)}
					onConfirmAndCheckout={handleConfirmAndCheckout}
					onConfirmAndStay={handleConfirmAndStay}
					priceCents={totalCents}
					title={item.title}
				/>
			)}
		</>
	);
}

export const Route = createFileRoute("/$unitId/product/$productId/")({
	component: ProductPage,
});
