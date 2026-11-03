import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPlus } from "react-icons/lu";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatMoney";

interface CheckoutFeesProps {
	fees: { amountCents: number | string; components?: { amountCents: number | string; name: string }[]; id: string; name: string }[];
	totalCents: number;
}

export function CheckoutFees({ fees, totalCents }: CheckoutFeesProps) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<div className="flex items-center justify-between gap-3 text-sm">
				<div className="flex items-center gap-2">
					<span>{t("store.checkout.order.fees")}</span>
					<Tooltip content={t("store.checkout.order.feesDetails")}>
						<Button
							aria-label={t("store.checkout.order.feesDetails")}
							className="size-[1em] rounded-[2px]"
							onClick={() => setIsOpen(true)}
							size="icon"
							type="button"
							variant="outline"
						>
							<LuPlus aria-hidden="true" className="size-[0.75em]" />
						</Button>
					</Tooltip>
				</div>
				<span>{formatMoney(totalCents / 100)}</span>
			</div>
			<Modal
				isOpen={isOpen}
				maxWidth="420px"
				onClose={() => setIsOpen(false)}
				title={t("store.checkout.order.fees")}
				urlKey="checkout-fees"
			>
				<div className="space-y-3">
					{fees
						.flatMap(fee => fee.components?.map(component => ({ ...component, id: `${fee.id}:${component.name}` })) ?? [fee])
						.map(fee => (
							<div className="flex justify-between gap-4 text-sm" key={fee.id}>
								<span>{fee.name}</span>
								<span className="shrink-0">{formatMoney(Number(fee.amountCents) / 100)}</span>
							</div>
						))}
					<div className="flex justify-between gap-4 border-t border-border pt-3 font-semibold text-sm">
						<span>{t("store.checkout.order.feesTotal")}</span>
						<span className="shrink-0">{formatMoney(totalCents / 100)}</span>
					</div>
				</div>
			</Modal>
		</>
	);
}
