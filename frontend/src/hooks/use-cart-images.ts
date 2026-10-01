import { useEffect } from "react";
import { useCartStore } from "@/stores";

export function useCartImages(
	unitId: string | undefined,
	sections: { items: { id: string; imageUrl: string }[] }[] | undefined,
) {
	const syncImages = useCartStore(state => state.syncImages);
	useEffect(() => {
		if (unitId && sections) syncImages(unitId, sections.flatMap(section => section.items));
	}, [unitId, sections, syncImages]);
}
