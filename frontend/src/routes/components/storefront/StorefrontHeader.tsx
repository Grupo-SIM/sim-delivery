import { Link, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LuMapPin } from "react-icons/lu";
import { getStaffAreaPath, isOperationalStaff, isStaff } from "@/lib/staff-guard";
import { useAuthStore } from "@/stores/auth";
import { ProfileMenu } from "./ProfileMenu";
import type { StorefrontBranding } from "./types";

interface StorefrontHeaderProps {
	branding?: StorefrontBranding;
	menuOnly?: boolean;
	navbarContent?: ReactNode;
	staffAction?: "staffArea" | "unitSelection";
	hideUnitChange?: boolean;
	profileMenuOnlyLogout?: boolean;
	profileMenuLogoutTo?: "/" | "/identify";
	showBackToCustomerArea?: boolean;
	unitName?: string;
}

export function StorefrontHeader({
	branding,
	menuOnly = false,
	navbarContent,
	staffAction = "staffArea",
	hideUnitChange = false,
	profileMenuLogoutTo,
	profileMenuOnlyLogout = false,
	showBackToCustomerArea = false,
	unitName,
}: StorefrontHeaderProps) {
	const { t } = useTranslation();
	const { taxes } = useSearch({ strict: false });
	const role = useAuthStore(state => state.role);
	const companyName = branding?.companyName ?? "JB Delivery";
	const staffAreaPath = getStaffAreaPath(role);

	return (
		<header className="storefront-header relative z-30 border-border/70 border-b bg-background/95 backdrop-blur">
			<div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-5 px-5 py-3">
				<Link aria-label={companyName} className="flex min-w-0 items-center gap-3" search={menuOnly ? { menuOnly: true, taxes } : undefined} to="/">
					{branding?.logoUrl ? (
						<img alt="" className="h-12 w-12 rounded-xl object-contain" src={branding.logoUrl} />
					) : (
						<span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-lg text-primary-foreground">
							{companyName.slice(0, 2).toUpperCase()}
						</span>
					)}
					{unitName && <span className="storefront-unit-name min-w-0 truncate text-sm">{unitName}</span>}
				</Link>

				{!menuOnly && (
					<div className="flex items-center gap-4">
						{navbarContent}
						{!hideUnitChange && (
							<Link
								className="hidden items-center gap-2 text-muted-foreground text-sm sm:flex"
								hash="unidades"
								to="/"
							>
								<LuMapPin aria-hidden className="h-4 w-4 text-primary" />
								{t("store.unit.change")}
							</Link>
						)}
						{isStaff(role) && staffAction === "unitSelection" ? (
							<Link
								className="hidden cursor-pointer rounded-md border border-border px-3 py-2 font-semibold text-sm transition-colors hover:bg-muted sm:flex"
								hash="unidades"
								to="/"
							>
								{t("store.account.backToCustomerArea")}
							</Link>
						) : isStaff(role) ? (
							<Link
								className="hidden cursor-pointer rounded-md border border-border px-3 py-2 font-semibold text-sm transition-colors hover:bg-muted sm:flex"
								to={staffAreaPath}
							>
								{t(isOperationalStaff(role) ? "store.account.staffOrders" : "store.account.staffAdmin")}
							</Link>
						) : null}
						<ProfileMenu
							logoutTo={profileMenuLogoutTo}
							onlyLogout={profileMenuOnlyLogout}
							showBackToCustomerArea={showBackToCustomerArea}
						/>
					</div>
				)}
			</div>
		</header>
	);
}
