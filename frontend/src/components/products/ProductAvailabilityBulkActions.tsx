import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuPause, LuPlay } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { getProductsQueryKey, usePatchProductsAvailability } from "@/lib/api";
import { requiresSelectedUnit } from "@/lib/staff-guard";
import { showAlert, showToast, useAdminSelectedUnitStore } from "@/stores";
import { useAuthStore } from "@/stores/auth";

type ProductAvailabilityScope = { categoryId: string } | { tagId: string };

interface ProductAvailabilityBulkActionsProps {
	disabled?: boolean;
	scope: ProductAvailabilityScope;
}

export function ProductAvailabilityBulkActions({ disabled = false, scope }: ProductAvailabilityBulkActionsProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const role = useAuthStore(state => state.role);
	const selectedUnitId = useAdminSelectedUnitStore(state => state.unitId);
	const updateAvailability = usePatchProductsAvailability();
	const unitId = requiresSelectedUnit(role) ? selectedUnitId : null;
	const isDisabled = disabled || (requiresSelectedUnit(role) && !unitId);

	function update(available: boolean) {
		updateAvailability.mutate(
			{ data: { available, ...scope, ...(unitId ? { unitId } : {}) } },
			{
				onError: () => void showAlert(t("admin.products.availability.bulk.error")),
				onSuccess: result => {
					void queryClient.invalidateQueries({ queryKey: getProductsQueryKey() });
					showToast(
						t(
							available
								? "admin.products.availability.bulk.resumeSuccess"
								: "admin.products.availability.bulk.pauseSuccess",
							{ count: Number(result.updatedCount) },
						),
						"positive",
					);
				},
			},
		);
	}

	return (
		<div className="flex justify-end gap-2">
			<Button
				disabled={isDisabled || updateAvailability.isPending}
				onClick={() => update(false)}
				size="sm"
				type="button"
				variant="outline"
			>
				<LuPause className="size-4" />
				{t("admin.products.availability.bulk.pauseAction")}
			</Button>
			<Button
				disabled={isDisabled || updateAvailability.isPending}
				onClick={() => update(true)}
				size="sm"
				type="button"
				variant="outline"
			>
				<LuPlay className="size-4" />
				{t("admin.products.availability.bulk.resumeAction")}
			</Button>
		</div>
	);
}
