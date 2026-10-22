import type { ReactNode } from "react";

interface KitSectionProps {
	title: string;
	description?: string;
	children: ReactNode;
}

export function KitSection({ children, description, title }: KitSectionProps) {
	return (
		<section className="space-y-5">
			<div className="space-y-1">
				<h2 className="font-display text-3xl">{title}</h2>
				{description ? <p className="max-w-2xl text-muted-foreground">{description}</p> : null}
			</div>
			{children}
		</section>
	);
}
