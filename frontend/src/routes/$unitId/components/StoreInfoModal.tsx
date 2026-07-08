import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { money } from "./types";

type Unit = {
	addressLine: string | null;
	city: string | null;
	deliveryFee: string | number;
	deliveryMethods: string[];
	minOrderCents: string | number;
	name: string;
	neighborhood: string | null;
	phone: string | null;
	prepTimeMaxMinutes: string | number | null;
	prepTimeMinMinutes: string | number | null;
};

interface StoreInfoModalProps {
	isOpen: boolean;
	onClose: () => void;
	unit: Unit;
}

export function StoreInfoModal({ isOpen, onClose, unit }: StoreInfoModalProps) {
	const { t } = useTranslation();

	const address = [unit.addressLine, unit.neighborhood, unit.city].filter(Boolean).join(", ");
	const minOrder = Number(unit.minOrderCents);
	const fee = Number(unit.deliveryFee);
	const prepMin = unit.prepTimeMinMinutes != null ? Number(unit.prepTimeMinMinutes) : null;
	const prepMax = unit.prepTimeMaxMinutes != null ? Number(unit.prepTimeMaxMinutes) : null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={t("store.unit.storeProfile")}>
			<dl className="space-y-3 text-sm">
				{address && (
					<div>
						<dt className="font-medium text-muted-foreground">{t("store.unit.address")}</dt>
						<dd>{address}</dd>
					</div>
				)}
				{unit.phone && (
					<div>
						<dt className="font-medium text-muted-foreground">{t("store.unit.phone")}</dt>
						<dd>{unit.phone}</dd>
					</div>
				)}
				{prepMin != null && prepMax != null && (
					<div>
						<dt className="font-medium text-muted-foreground">{t("store.unit.eta")}</dt>
						<dd>{t("store.unit.etaRange", { max: prepMax, min: prepMin })}</dd>
					</div>
				)}
				<div>
					<dt className="font-medium text-muted-foreground">{t("store.unit.minOrder")}</dt>
					<dd>{minOrder > 0 ? money.format(minOrder / 100) : t("store.unit.noMinOrder")}</dd>
				</div>
				{unit.deliveryMethods.includes("delivery") && (
					<div>
						<dt className="font-medium text-muted-foreground">{t("store.cart.deliveryFee")}</dt>
						<dd>{fee > 0 ? money.format(fee / 100) : t("store.unit.freeDelivery")}</dd>
					</div>
				)}
				<div>
					<dt className="font-medium text-muted-foreground">{t("store.unit.deliveryMethods")}</dt>
					<dd className="flex flex-wrap gap-1 mt-0.5">
						{unit.deliveryMethods.map(m => (
							<span className="rounded bg-muted px-2 py-0.5 text-xs capitalize" key={m}>
								{t(`store.checkout.order.${m}`, { defaultValue: m })}
							</span>
						))}
					</dd>
				</div>
			</dl>
		</Modal>
	);
}
