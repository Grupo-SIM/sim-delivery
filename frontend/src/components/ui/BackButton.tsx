import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuArrowLeft } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface BackButtonProps {
	className?: string;
}

/** Goes back in history, falling back to the homepage when the page was opened directly (desktop app, deep link). */
export function BackButton({ className }: BackButtonProps) {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<button
			aria-label={t("actions.back")}
			className={cn(
				"flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border transition-colors hover:bg-muted",
				className,
			)}
			onClick={() => (router.history.canGoBack() ? router.history.back() : void router.navigate({ to: "/" }))}
			type="button"
		>
			<LuArrowLeft aria-hidden className="h-5 w-5" />
		</button>
	);
}
