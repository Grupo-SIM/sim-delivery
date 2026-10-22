import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { cn } from "@/lib/utils";
import { type MenuSection, sectionAnchor } from "./types";

interface CategoryNavProps {
	onDockedChange: (docked: boolean) => void;
	sections: MenuSection[];
}

/** Category shortcuts retain the active section while scrolling. */
export function CategoryNav({ onDockedChange, sections }: CategoryNavProps) {
	const { t } = useTranslation();
	const anchorRef = useRef<HTMLDivElement>(null);
	const dockedRef = useRef(false);
	const [docked, setDocked] = useState(false);
	const hasMultipleSections = sections.some(section => section.categoryId !== null);
	const [activeId, setActiveId] = useState(sections[0]?.categoryId);

	useEffect(() => {
		if (!hasMultipleSections) return;

		const anchor = anchorRef.current;
		if (!anchor) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry) return;

				const docked = !entry.isIntersecting && entry.boundingClientRect.bottom <= 80;
				if (docked === dockedRef.current) return;

				dockedRef.current = docked;
				setDocked(docked);
				onDockedChange(docked);
			},
			{ rootMargin: "-80px 0px 0px 0px" },
		);

		observer.observe(anchor);

		return () => {
			observer.disconnect();
			dockedRef.current = false;
			setDocked(false);
			onDockedChange(false);
		};
	}, [hasMultipleSections, onDockedChange]);

	useEffect(() => {
		function updateActiveSection() {
			let current = sections[0]?.categoryId;
			for (const section of sections) {
				const element = document.getElementById(sectionAnchor(section.categoryId));
				if (element && element.getBoundingClientRect().top <= 170) current = section.categoryId;
			}
			setActiveId(current);
		}
		window.addEventListener("scroll", updateActiveSection, { passive: true });
		updateActiveSection();
		return () => window.removeEventListener("scroll", updateActiveSection);
	}, [sections]);

	if (!hasMultipleSections) {
		return null;
	}

	function jumpTo(categoryId: string | null) {
		setActiveId(categoryId);
		document.getElementById(sectionAnchor(categoryId))?.scrollIntoView({ behavior: "smooth" });
	}

	return (
		<div className="category-nav-anchor h-14 lg:hidden" ref={anchorRef}>
			<nav
				aria-label={t("store.menu.categories")}
				className={cn(
					"category-nav -mx-4 bg-background/90 px-4 py-2 backdrop-blur",
					docked &&
						"category-nav-docked fade-in slide-in-from-bottom-2 fixed inset-x-0 bottom-0 z-30 mx-0 animate-in border-border border-t bg-background/95 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(0_0_0/0.12)] duration-200",
				)}
			>
				<ScrollArea className="flex gap-2 overflow-x-auto pb-3">
					{sections
						.filter(section => section.categoryId !== null)
						.map(section => (
							<button
								aria-pressed={activeId === section.categoryId}
								className="shrink-0 cursor-pointer rounded-full border border-border bg-card text-card-foreground px-3 py-1 text-sm transition-colors hover:bg-muted hover:text-foreground"
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
