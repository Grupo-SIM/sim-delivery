import type { ReactNode } from "react";

interface FormSectionHeadingProps {
	children: ReactNode;
}

export function FormSectionHeading({ children }: FormSectionHeadingProps) {
	return (
		<div className="col-span-full flex items-center gap-3 pt-4">
			<span className="whitespace-nowrap font-bold text-muted-foreground text-xs uppercase tracking-widest">
				{children}
			</span>
			<hr className="flex-1 border-border" />
		</div>
	);
}
