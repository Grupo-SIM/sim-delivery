import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatMoney";
import type { PostCustomersMe200 } from "@/lib/api";
import type { CartItem } from "@/stores";

export type DeliveryMethod = "delivery" | "pickup";
type Address = PostCustomersMe200["addresses"][number];

interface OrderReviewProps {
	address: Address | null;
	deliveryMethod: DeliveryMethod;
	items: CartItem[];
	isPending: boolean;
	onChangeDeliveryMethod: (method: DeliveryMethod) => void;
	onSubmit: () => void;
	subtotal: number;
	unitDeliveryFee: number;
}

export function OrderReview({
	address,
	deliveryMethod,
	items,
	isPending,
	onChangeDeliveryMethod,
	onSubmit,
	subtotal,
	unitDeliveryFee,
}: OrderReviewProps) {
	const { t } = useTranslation();
	const deliveryFee = deliveryMethod === "delivery" ? unitDeliveryFee : 0;
	const total = subtotal + deliveryFee;

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				{items.map(item => (
					<div className="flex justify-between text-sm" key={item.id}>
						<span>
							{item.quantity}× {item.title}
						</span>
						<span>{formatMoney((item.priceCents * item.quantity) / 100)}</span>
					</div>
				))}
			</div>

			<div className="space-y-2">
				<span className="font-medium text-sm">{t("store.checkout.order.deliveryMethod")}</span>
				<div className="flex gap-2">
					{(["delivery", "pickup"] as DeliveryMethod[]).map(method => (
						<Button
							key={method}
							onClick={() => onChangeDeliveryMethod(method)}
							size="sm"
							type="button"
							variant={deliveryMethod === method ? "default" : "outline"}
						>
							{t(`store.checkout.order.${method}`)}
						</Button>
					))}
				</div>
			</div>

			{address && (
				<div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
					<p className="font-medium">{address.addressLine}, {address.number}</p>
					{address.complement && <p className="text-muted-foreground">{address.complement}</p>}
					<p className="text-muted-foreground">{[address.neighborhood, address.city, address.state].filter(Boolean).join(", ")}</p>
				</div>
			)}

			<div className="space-y-1 border-border border-t pt-3">
				{deliveryFee > 0 && (
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Frete</span>
						<span>{formatMoney(deliveryFee / 100)}</span>
					</div>
				)}
				<div className="flex justify-between font-semibold">
					<span>Total</span>
					<span>{formatMoney(total / 100)}</span>
				</div>
			</div>

			<Button className="w-full" disabled={isPending} onClick={onSubmit} type="button">
				{isPending ? t("store.checkout.order.placing") : t("store.checkout.order.place")}
			</Button>
		</div>
	);
}
