import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import type { StoreHours } from "./store-hours-types";

interface StoreHoursModalProps {
	hours: StoreHours[];
	isOpen: boolean;
	onClose: () => void;
}

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function StoreHoursModal({ hours, isOpen, onClose }: StoreHoursModalProps) {
	const { t } = useTranslation();

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={t("store.unit.hoursTitle")}>
			<ul className="divide-y divide-border text-sm">
				{WEEKDAYS.map((weekday, index) => {
					const day = hours.find(item => Number(item.weekday) === index);
					const schedule =
						day && !day.closed && day.opensAt && day.closesAt
							? `${day.opensAt}–${day.closesAt}`
							: t("store.status.closed");

					return (
						<li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0" key={weekday}>
							<span className="font-medium">{t(`store.unit.weekdays.${weekday}`)}</span>
							<span className={day?.closed !== false ? "text-muted-foreground" : "font-semibold"}>
								{schedule}
							</span>
						</li>
					);
				})}
			</ul>
		</Modal>
	);
}
