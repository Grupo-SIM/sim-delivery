import { Link } from "@tanstack/react-router";
import { LuMapPin } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { ProfileMenu } from "./ProfileMenu";
import type { StorefrontBranding } from "./types";

interface StorefrontHeaderProps {
	branding?: StorefrontBranding;
	unitName?: string;
}

export function StorefrontHeader({ branding, unitName }: StorefrontHeaderProps) {
	const { t } = useTranslation();
	const companyName = branding?.companyName ?? "JB Delivery";

	return (
		<header className="border-border/70 border-b bg-background/95 backdrop-blur">
			<div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-5 px-5 py-3">
				<Link aria-label={companyName} className="flex min-w-0 items-center gap-3" to="/">
					{branding?.logoUrl ? (
						<img alt="" className="h-12 w-12 rounded-xl object-contain" src={branding.logoUrl} />
					) : (
						<span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-lg text-primary-foreground">
							{companyName.slice(0, 2).toUpperCase()}
						</span>
					)}
					<span className="flex min-w-0 flex-col">
						<span className="truncate font-display text-xl tracking-wide">{companyName}</span>
						{unitName && <span className="truncate text-muted-foreground text-sm">{unitName}</span>}
					</span>
				</Link>

				<div className="flex items-center gap-4">
					<Link className="hidden items-center gap-2 text-muted-foreground text-sm sm:flex" hash="unidades" to="/">
						<LuMapPin aria-hidden className="h-4 w-4 text-primary" />
						{t("store.unit.change")}
					</Link>
					<ProfileMenu />
				</div>
			</div>
		</header>
	);
}
