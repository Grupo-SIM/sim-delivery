import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LuArrowRight } from "react-icons/lu";

interface CategoryShortcutProps {
	icon: ReactNode;
	imageUrl: string;
	label: string;
	description: string;
	tone: "blue" | "cyan" | "yellow" | "red";
}

const toneCard: Record<CategoryShortcutProps["tone"], string> = {
	blue: "bg-blue-50/70",
	cyan: "bg-cyan-50/70",
	red: "bg-orange-50/80",
	yellow: "bg-amber-50/80",
};

export function CategoryShortcut({ icon, imageUrl, label, description, tone }: CategoryShortcutProps) {
	return (
		<Link
			className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			hash="unidades"
			to="/"
		>
			<div
				className={`relative flex h-72 flex-col overflow-hidden rounded-3xl ${toneCard[tone]} p-6 shadow-sm ring-1 ring-black/[0.04] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl`}
			>
				<div className="relative z-10 max-w-[62%]">
					<div className="text-brand-ink [&>svg]:size-9 [&>svg]:stroke-[1.5]">{icon}</div>
					<h3 className="mt-4 font-display text-brand-ink text-xl">{label}</h3>
					<p className="mt-1.5 text-muted-foreground text-sm leading-snug">{description}</p>
				</div>

				<img
					alt=""
					className="pointer-events-none absolute right-0 bottom-0 w-3/5 translate-y-2 object-contain drop-shadow-xl transition duration-500 group-hover:translate-y-0 group-hover:scale-105"
					loading="lazy"
					src={imageUrl}
				/>

				<span className="absolute right-5 bottom-5 z-10 flex size-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition duration-300 group-hover:scale-110 group-hover:bg-emerald-600">
					<LuArrowRight aria-hidden className="size-5 transition-transform group-hover:translate-x-0.5" />
				</span>
			</div>
		</Link>
	);
}
