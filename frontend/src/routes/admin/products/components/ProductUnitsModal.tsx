import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getProductsByProductIdUnitsQueryKey,
	useGetProductsByProductIdUnits,
	useGetUnits,
	usePutProductsByProductIdUnits,
} from "@/lib/api";
import type { Product } from "./types";

interface ProductUnitsModalProps {
	onClose: () => void;
	product: Product | null;
}

export function ProductUnitsModal({ onClose, product }: ProductUnitsModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	const { data: units, isPending: unitsPending } = useGetUnits();
	const { data: productUnits, isPending: productUnitsPending } = useGetProductsByProductIdUnits(product?.id);
	const { isPending, mutate } = usePutProductsByProductIdUnits();

	useEffect(() => {
		setSelectedUnitIds(productUnits ?? []);
		setError(null);
	}, [productUnits]);

	function toggle(unitId: string) {
		setSelectedUnitIds(current =>
			current.includes(unitId) ? current.filter(id => id !== unitId) : [...current, unitId],
		);
	}

	function save() {
		if (!product) {
			return;
		}
		setError(null);
		mutate(
			{ data: { unitIds: selectedUnitIds }, productId: product.id },
			{
				onError: () => setError(t("admin.products.units.error")),
				onSuccess: async () => {
					await queryClient.invalidateQueries({
						queryKey: getProductsByProductIdUnitsQueryKey(product.id),
					});
					onClose();
				},
			},
		);
	}

	return (
		<Modal
			isOpen={product !== null}
			onClose={onClose}
			title={t("admin.products.units.title")}
			urlKey="product-units"
			urlState={product?.id}
		>
			<div className="space-y-4">
				{unitsPending || productUnitsPending ? (
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				) : units?.length === 0 ? (
					<p className="text-muted-foreground text-sm">{t("admin.products.units.empty")}</p>
				) : (
					<ScrollArea className="max-h-72 space-y-2 overflow-y-auto">
						{units?.map(unit => (
							<label
								className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2 text-sm hover:border-border hover:bg-muted/40"
								htmlFor={`unit-${unit.id}`}
								key={unit.id}
							>
								<Checkbox
									checked={selectedUnitIds.includes(unit.id)}
									id={`unit-${unit.id}`}
									onChange={() => toggle(unit.id)}
								/>
								<span>{unit.name}</span>
							</label>
						))}
					</ScrollArea>
				)}

				{error && <p className="text-destructive text-xs">{error}</p>}
				<div className="flex justify-end gap-2 pt-2">
					<Button disabled={isPending} onClick={onClose} type="button" variant="outline">
						{t("admin.products.units.cancel")}
					</Button>
					<Button disabled={isPending || unitsPending || productUnitsPending} onClick={save} type="button">
						{isPending ? t("admin.products.units.saving") : t("admin.products.units.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
