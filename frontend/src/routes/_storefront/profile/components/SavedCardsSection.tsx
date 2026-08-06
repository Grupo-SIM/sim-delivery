import { useTranslation } from "react-i18next";
import { FaCcAmex, FaCcDiscover, FaCcMastercard, FaCcVisa, FaCreditCard } from "react-icons/fa";
import { LuTrash2 } from "react-icons/lu";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDeletePaymentsCardsByCardId, useGetPaymentsCards } from "@/lib/api";
import { slug } from "@/lib/variant";
import { showToast } from "@/stores";

function brandIcon(brand: string) {
	switch (brand.toLowerCase()) {
		case "visa":
			return FaCcVisa;
		case "mastercard":
			return FaCcMastercard;
		case "american express":
			return FaCcAmex;
		case "discover":
			return FaCcDiscover;
		default:
			return FaCreditCard;
	}
}

export function SavedCardsSection() {
	const { t } = useTranslation();
	const companySlug = slug ?? "";
	const cardsQuery = useGetPaymentsCards(
		{ slug: companySlug },
		{ query: { enabled: !!companySlug, retry: false } },
	);
	const deleteCard = useDeletePaymentsCardsByCardId();

	async function handleDelete(cardId: string) {
		try {
			await deleteCard.mutateAsync({ cardId, params: { slug: companySlug } });
			await cardsQuery.refetch();
			showToast(t("store.account.profile.cardDeleted"), "positive");
		} catch {
			showToast(t("store.account.profile.cardDeleteError"), "negative");
		}
	}

	return (
		<section className="space-y-4 rounded-xl border border-border bg-card p-5">
			<div>
				<h2 className="font-semibold text-lg">{t("store.account.profile.savedCards")}</h2>
				<p className="text-muted-foreground text-sm">{t("store.account.profile.savedCardsHint")}</p>
			</div>

			{cardsQuery.isPending ? (
				<div className="space-y-3">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			) : cardsQuery.isError ? (
				<p className="text-destructive text-sm">{t("store.account.profile.cardsLoadError")}</p>
			) : cardsQuery.data?.length ? (
				<div className="space-y-3">
					{cardsQuery.data.map(card => {
						const Icon = brandIcon(card.brand);
						return (
							<div className="flex items-center gap-3 rounded-lg border border-border p-4" key={card.id}>
								<Icon aria-hidden className="size-7 shrink-0 text-muted-foreground" />
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium">
										{card.nickname ?? `${card.brand} •••• ${card.last4}`}
									</p>
									<p className="text-muted-foreground text-sm">
										{t("store.account.profile.cardExpiry", {
											month: card.expiryMonth,
											year: card.expiryYear.slice(-2),
										})}
										{card.isDefault ? ` · ${t("store.account.profile.defaultCard")}` : ""}
									</p>
								</div>
								<ConfirmActionButton
									aria-label={t("store.account.profile.deleteCard")}
									confirmation={t("store.account.profile.deleteCardConfirm")}
									confirmLabel={t("store.account.profile.deleteCard")}
									disabled={deleteCard.isPending}
									idleIcon={<LuTrash2 className="size-4" />}
									onConfirm={() => void handleDelete(card.id)}
									size="icon"
									type="button"
									variant="outline"
								>
									<span className="sr-only">{t("store.account.profile.deleteCard")}</span>
								</ConfirmActionButton>
							</div>
						);
					})}
				</div>
			) : (
				<p className="text-muted-foreground text-sm">{t("store.account.profile.noSavedCards")}</p>
			)}
		</section>
	);
}
