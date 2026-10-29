import { trackMetaEvent } from "@/lib/meta-pixel";
import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { LuPhone } from "react-icons/lu";
import { Tooltip } from "@/components/ui/Tooltip";
import type { PublicUnit } from "../../../components/storefront/types";

interface UnitContactLinksProps {
	unit: PublicUnit;
}

interface ContactLink {
	href: string;
	icon: IconType;
	label: string;
	external?: boolean;
}

export function UnitContactLinks({ unit }: UnitContactLinksProps) {
	const links = [
		unit.whatsApp && {
			external: true,
			href: `https://wa.me/${unit.whatsApp.replace(/\D/g, "")}`,
			icon: FaWhatsapp,
			label: "WhatsApp",
		},
		unit.xUrl && { external: true, href: unit.xUrl, icon: FaXTwitter, label: "X (Twitter)" },
		unit.instagramUrl && { external: true, href: unit.instagramUrl, icon: FaInstagram, label: "Instagram" },
		unit.phone && { href: `tel:${unit.phone.replace(/\D/g, "")}`, icon: LuPhone, label: "Ligar" },
		unit.facebookUrl && { external: true, href: unit.facebookUrl, icon: FaFacebookF, label: "Facebook" },
	].filter((link): link is ContactLink => Boolean(link));

	if (!links.length) return null;

	return (
		<fieldset aria-label="Contato e redes sociais" className="flex flex-wrap items-center gap-2">
			{links.map(({ external, href, icon: Icon, label }) => (
				<Tooltip content={label} key={href}>
					<a
						aria-label={label}
						className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						href={href}
						onClick={() => {
							if (label === "WhatsApp" || href.startsWith("tel:")) {
								trackMetaEvent("Contact", { contact_method: label === "WhatsApp" ? "whatsapp" : "phone" });
							}
						}}
						rel={external ? "noreferrer" : undefined}
						target={external ? "_blank" : undefined}
					>
						<Icon aria-hidden className="size-4" />
					</a>
				</Tooltip>
			))}
		</fieldset>
	);
}
