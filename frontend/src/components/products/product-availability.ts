export interface ProductAvailability {
	unitAvailability: { available: boolean; unitId: string }[];
}

/** A group is available only when every product is available in the affected scope. */
export function areProductsAvailable(products: ProductAvailability[], unitId: string | null): boolean {
	return (
		products.length > 0 &&
		products.every(product => {
			if (unitId) return product.unitAvailability.find(unit => unit.unitId === unitId)?.available === true;
			return product.unitAvailability.length > 0 && product.unitAvailability.every(unit => unit.available);
		})
	);
}
