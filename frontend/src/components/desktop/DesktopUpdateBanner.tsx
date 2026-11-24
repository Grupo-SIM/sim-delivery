import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { canUpdateNatively, checkNativeUpdate } from "@/lib/native-updater";
import { showToast } from "@/stores";

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Desktop-only: announces a new release and installs it on demand, so the app is never reinstalled by hand. */
export function DesktopUpdateBanner() {
	const { t } = useTranslation();
	const updateQuery = useQuery({
		enabled: canUpdateNatively(),
		queryFn: checkNativeUpdate,
		queryKey: ["native-update"],
		refetchInterval: CHECK_INTERVAL_MS,
		retry: false,
		staleTime: CHECK_INTERVAL_MS,
	});
	const installMutation = useMutation({
		mutationFn: async () => {
			await updateQuery.data?.install();
		},
		onError: () => showToast(t("desktopUpdate.error"), "negative"),
	});

	const update = updateQuery.data;
	if (!update) return null;

	return (
		<aside className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 flex justify-end sm:inset-x-5">
			<section className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
				<p className="text-sm">{t("desktopUpdate.available", { version: update.version })}</p>
				<Button disabled={installMutation.isPending} onClick={() => installMutation.mutate()} size="sm" type="button" variant="outline">
					{t(installMutation.isPending ? "desktopUpdate.installing" : "desktopUpdate.install")}
				</Button>
			</section>
		</aside>
	);
}
