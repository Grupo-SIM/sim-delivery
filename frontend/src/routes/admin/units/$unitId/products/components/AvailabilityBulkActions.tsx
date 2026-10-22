import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCircleCheck, LuCircleX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
	getUnitsByUnitIdProductsQueryKey,
	usePatchUnitsByUnitIdProductsAvailability,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import type { Category } from "./types";

interface AvailabilityBulkActionsProps {
	categories: Category[];
	disabled: boolean;
	unitId: string;
}

export function AvailabilityBulkActions({
	categories,
	disabled,
	unitId,
}: AvailabilityBulkActionsProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [categoryId, setCategoryId] = useState("");
	const updateAvailability = usePatchUnitsByUnitIdProductsAvailability();

	function update(available: boolean) {
		updateAvailability.mutate(
			{
				data: { available, ...(categoryId && { categoryId }) },
				unitId,
			},
			{
				onError: () => void showAlert(t("admin.unitProducts.bulk.error")),
				onSuccess: result => {
					void queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdProductsQueryKey(unitId) });
					showToast(
						t(
							available
								? "admin.unitProducts.bulk.availableSuccess"
								: "admin.unitProducts.bulk.unavailableSuccess",
							{ count: Number(result.updatedCount) },
						),
						"positive",
					);
				},
			},
		);
	}

	return (
		<section className="rounded-xl border border-border bg-card text-card-foreground p-4 shadow-soft">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="max-w-xl">
					<h2 className="font-semibold text-foreground">{t("admin.unitProducts.bulk.title")}</h2>
					<p className="mt-1 text-muted-foreground text-sm">{t("admin.unitProducts.bulk.description")}</p>
				</div>
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
					<div className="min-w-64 space-y-1">
						<span className="font-medium text-sm">{t("admin.unitProducts.bulk.scope")}</span>
						<CustomSelect
							disabled={disabled || updateAvailability.isPending}
							onChange={setCategoryId}
							options={[
								{ label: t("admin.unitProducts.bulk.allProducts"), value: "" },
								...categories.map(category => ({ label: category.name, value: category.id })),
							]}
							value={categoryId}
						/>
					</div>
					<div className="flex gap-2">
						<Button
							disabled={disabled || updateAvailability.isPending}
							onClick={() => update(true)}
							type="button"
						>
							<LuCircleCheck />
							{t("admin.unitProducts.bulk.makeAvailable")}
						</Button>
						<Button
							disabled={disabled || updateAvailability.isPending}
							onClick={() => update(false)}
							type="button"
							variant="outline"
						>
							<LuCircleX />
							{t("admin.unitProducts.bulk.makeUnavailable")}
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
