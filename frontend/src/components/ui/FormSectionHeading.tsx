import type { ReactNode } from "react";

interface FormSectionHeadingProps {
	children: ReactNode;
}

export function FormSectionHeading({ children }: FormSectionHeadingProps) {
	return (
		<div className="col-span-full flex items-center gap-3 pt-4">
			<span className="whitespace-nowrap text-label-bold text-muted-foreground">{children}</span>
			<hr className="flex-1 border-border" />
		</div>
	);
}
