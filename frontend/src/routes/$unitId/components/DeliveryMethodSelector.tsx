import { useTranslation } from "react-i18next";
import { type DeliveryMethod, useDeliveryMethodStore } from "@/stores";

interface DeliveryMethodSelectorProps {
	deliveryMethods: string[];
	unitId: string;
}

export function DeliveryMethodSelector({ deliveryMethods, unitId }: DeliveryMethodSelectorProps) {
	const { t } = useTranslation();
	const getMethod = useDeliveryMethodStore(state => state.getMethod);
	const setMethod = useDeliveryMethodStore(state => state.setMethod);
	const current = getMethod(unitId, deliveryMethods);

	if (deliveryMethods.length <= 1) return null;

	return (
		<div className="flex overflow-hidden rounded-lg border border-border bg-muted text-xs">
			{(["delivery", "pickup"] as DeliveryMethod[])
				.filter(m => deliveryMethods.includes(m))
				.map(method => (
					<button
						className={
							current === method
								? "flex-1 bg-primary px-3 py-1.5 font-semibold text-primary-foreground transition-colors"
								: "flex-1 px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
						}
						key={method}
						onClick={() => setMethod(unitId, method)}
						type="button"
					>
						{t(`store.checkout.order.${method}`)}
					</button>
				))}
		</div>
	);
}
