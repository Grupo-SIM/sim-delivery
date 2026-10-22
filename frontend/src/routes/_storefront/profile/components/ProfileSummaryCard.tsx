import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuCoins, LuPackage, LuSparkles } from "react-icons/lu";
import { formatMoney } from "@/lib/formatMoney";
import type { AuthUser } from "@/stores/auth";

interface ProfileSummaryCardProps {
	cashbackBalanceCents: number;
	loyaltyBalancePoints: number;
	user: AuthUser;
}

function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileSummaryCard({
	cashbackBalanceCents,
	loyaltyBalancePoints,
	user,
}: ProfileSummaryCardProps) {
	const { t } = useTranslation();
	return (
		<section className="space-y-4 rounded-xl border border-border bg-card text-card-foreground p-5">
			<div className="flex items-center gap-4">
				{user.image ? (
					<img alt="" className="size-16 rounded-full object-cover" src={user.image} />
				) : (
					<span className="grid size-16 place-items-center rounded-full bg-primary font-semibold text-lg text-primary-foreground">
						{initials(user.name)}
					</span>
				)}
				<div className="min-w-0">
					<p className="truncate font-semibold">{user.name}</p>
					<p className="truncate text-muted-foreground text-sm">{user.email}</p>
					<p className="mt-1 text-muted-foreground text-xs">
						{t("store.account.profile.customerSince", {
							date: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
								new Date(user.createdAt),
							),
						})}
					</p>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<div className="rounded-lg bg-muted p-3">
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						<LuCoins className="size-4" /> {t("store.account.profile.cashback")}
					</div>
					<p className="mt-1 font-semibold">{formatMoney(cashbackBalanceCents / 100)}</p>
				</div>
				<div className="rounded-lg bg-muted p-3">
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						<LuSparkles className="size-4" /> {t("store.account.profile.points")}
					</div>
					<p className="mt-1 font-semibold">{loyaltyBalancePoints}</p>
				</div>
			</div>
			<Link className="inline-flex items-center gap-2 text-primary text-sm underline" to="/orders">
				<LuPackage className="size-4" /> {t("store.account.myOrders")}
			</Link>
		</section>
	);
}
