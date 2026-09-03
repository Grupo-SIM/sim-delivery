import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuPause, LuPlay } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/Tooltip";
import { getProductsQueryKey, useGetProducts, usePatchProductsAvailability } from "@/lib/api";
import { requiresSelectedUnit } from "@/lib/staff-guard";
import { showAlert, showToast, useAdminSelectedUnitStore } from "@/stores";
import { useAuthStore } from "@/stores/auth";
import { areProductsAvailable } from "./product-availability";

type ProductAvailabilityScope = { categoryId: string } | { tagId: string };

interface ProductAvailabilityBulkActionsProps {
	disabled?: boolean;
	iconOnly?: boolean;
	scope: ProductAvailabilityScope;
}

export function ProductAvailabilityBulkActions({
	disabled = false,
	iconOnly = false,
	scope,
}: ProductAvailabilityBulkActionsProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const role = useAuthStore(state => state.role);
	const selectedUnitId = useAdminSelectedUnitStore(state => state.unitId);
	const updateAvailability = usePatchProductsAvailability();
	const { data: products, isPending: areProductsPending } = useGetProducts();
	const unitId = requiresSelectedUnit(role) ? selectedUnitId : null;
	const scopedProducts =
		products?.filter(product =>
			"categoryId" in scope
				? product.categories.some(category => category.id === scope.categoryId)
				: product.tags.some(tag => tag.id === scope.tagId),
		) ?? [];
	const productsAvailable = areProductsAvailable(scopedProducts, unitId);
	const isDisabled =
		disabled || areProductsPending || scopedProducts.length === 0 || (requiresSelectedUnit(role) && !unitId);

	function update(nextAvailable: boolean) {
		updateAvailability.mutate(
			{ data: { available: nextAvailable, ...scope, ...(unitId ? { unitId } : {}) } },
			{
				onError: () => void showAlert(t("admin.products.availability.bulk.error")),
				onSuccess: result => {
					void queryClient.invalidateQueries({ queryKey: getProductsQueryKey() });
					showToast(
						t(
							nextAvailable
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
	const actionLabel = t(
		productsAvailable
			? "admin.products.availability.bulk.pauseAction"
			: "admin.products.availability.bulk.resumeAction",
	);

	const button = (
		<Button
			aria-label={actionLabel}
			disabled={isDisabled || updateAvailability.isPending}
			onClick={() => update(!productsAvailable)}
			size={iconOnly ? "icon" : "sm"}
			type="button"
			variant="outline"
		>
			{productsAvailable ? <LuPause className="size-4" /> : <LuPlay className="size-4" />}
			{!iconOnly && actionLabel}
		</Button>
	);

	return iconOnly ? <Tooltip content={actionLabel}>{button}</Tooltip> : button;
}
