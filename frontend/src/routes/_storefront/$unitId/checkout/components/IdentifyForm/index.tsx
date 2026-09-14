import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuMail } from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { EmailIdentifyForm } from "./EmailIdentifyForm";
import { WhatsAppIdentifyForm } from "./WhatsAppIdentifyForm";

type Channel = "email" | "whatsapp";

interface IdentifyFormProps {
	enableWhatsApp?: boolean;
	unitSlug?: string;
}

export function IdentifyForm({ enableWhatsApp = false, unitSlug }: IdentifyFormProps) {
	const { t } = useTranslation();
	const [channel, setChannel] = useState<Channel>("email");
	const channels = [
		{ icon: LuMail, key: "email" as const, label: t("store.checkout.identify.channels.email") },
		{ icon: FaWhatsapp, key: "whatsapp" as const, label: t("store.checkout.identify.channels.whatsapp") },
	];

	return (
		<div className="space-y-5">
			{enableWhatsApp && (
				<div className="flex rounded-pill border border-border bg-muted p-1" role="tablist">
					{channels.map(option => {
						const isActive = channel === option.key;
						return (
							<button
								aria-selected={isActive}
								className={cn(
									"flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-pill border px-3 py-2.5 font-semibold text-sm transition-all duration-300",
									isActive
										? "border-primary bg-primary text-primary-foreground shadow-sm"
										: "border-transparent text-foreground hover:border-border hover:bg-background/70",
								)}
								key={option.key}
								onClick={() => setChannel(option.key)}
								role="tab"
								type="button"
							>
								<option.icon className="size-4" />
								{option.label}
							</button>
							);
						})}
				</div>
			)}

			{!enableWhatsApp || channel === "email" ? (
				<EmailIdentifyForm unitSlug={unitSlug} />
			) : (
				<WhatsAppIdentifyForm />
			)}
		</div>
	);
}
