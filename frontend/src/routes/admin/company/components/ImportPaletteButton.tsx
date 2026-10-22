import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuImageUp } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import type { ThemeColors } from "@/lib/theme-colors";
import { importPaletteSvg } from "@/lib/visual-identity/import-palette";
import { showToast } from "@/stores";

interface ImportPaletteButtonProps {
	onImport: (colors: ThemeColors) => void;
}

export function ImportPaletteButton({ onImport }: ImportPaletteButtonProps) {
	const { t } = useTranslation();
	const input = useRef<HTMLInputElement>(null);
	const [isPending, setIsPending] = useState(false);
	return (
		<div className="space-y-2">
			<Button disabled={isPending} onClick={() => input.current?.click()} type="button" variant="outline">
				<LuImageUp aria-hidden />
				{t(isPending ? "admin.branding.paletteImport.loading" : "admin.branding.paletteImport.action")}
			</Button>
			<input
				accept=".svg,image/svg+xml"
				aria-label={t("admin.branding.paletteImport.action")}
				className="hidden"
				disabled={isPending}
				onChange={async event => {
					const file = event.currentTarget.files?.[0];
					event.currentTarget.value = "";
					if (!file) return;
					setIsPending(true);
					try {
						if (file.size > 2_000_000) throw new Error("File too large");
						const colors = importPaletteSvg(await file.text());
						onImport(colors);
						showToast(t("admin.branding.paletteImport.success"), "positive");
					} catch {
						showToast(t("admin.branding.paletteImport.error"), "negative");
					} finally {
						setIsPending(false);
					}
				}}
				ref={input}
				type="file"
			/>
			<p className="text-muted-foreground text-sm">{t("admin.branding.paletteImport.hint")}</p>
		</div>
	);
}
