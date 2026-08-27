import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { cn } from "@/lib/utils";
import { type MenuSection, sectionAnchor } from "./types";

interface CategoryNavProps {
	onDockedChange: (docked: boolean) => void;
	sections: MenuSection[];
}

/** Mobile quick-access chips: moves to the thumb-friendly bottom edge after scrolling past it. */
export function CategoryNav({ onDockedChange, sections }: CategoryNavProps) {
	const { t } = useTranslation();
	const anchorRef = useRef<HTMLDivElement>(null);
	const dockedRef = useRef(false);
	const [docked, setDocked] = useState(false);
	const hasMultipleSections = sections.length > 1;

	useEffect(() => {
		if (!hasMultipleSections) return;

		const anchor = anchorRef.current;
		if (!anchor) return;

		const observer = new IntersectionObserver(([entry]) => {
			if (!entry) return;

			const docked = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
			if (docked === dockedRef.current) return;

			dockedRef.current = docked;
			setDocked(docked);
			onDockedChange(docked);
		});

		observer.observe(anchor);

		return () => {
			observer.disconnect();
			dockedRef.current = false;
			setDocked(false);
			onDockedChange(false);
		};
	}, [hasMultipleSections, onDockedChange]);

	if (!hasMultipleSections) {
		return null;
	}

	function jumpTo(categoryId: string | null) {
		document.getElementById(sectionAnchor(categoryId))?.scrollIntoView({ behavior: "smooth" });
	}

	return (
		<div className="h-14 lg:hidden" ref={anchorRef}>
			<nav
				aria-label={t("store.menu.categories")}
				className={cn(
					"-mx-4 bg-background/90 px-4 py-2 backdrop-blur",
					docked &&
						"fade-in slide-in-from-bottom-2 fixed inset-x-0 bottom-0 z-30 mx-0 animate-in border-border border-t bg-background/95 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(0_0_0/0.12)] duration-200",
				)}
			>
				<ScrollArea className="flex gap-2 overflow-x-auto pb-3">
				{sections
					.filter(section => section.categoryId !== null)
					.map(section => (
						<button
							className="shrink-0 cursor-pointer rounded-full border border-border bg-card px-3 py-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
							key={section.categoryId ?? "loose"}
							onClick={() => jumpTo(section.categoryId)}
							type="button"
						>
							{section.categoryName ?? t("store.menu.loose")}
						</button>
					))}
				</ScrollArea>
			</nav>
		</div>
	);
}
