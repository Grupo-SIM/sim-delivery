import { LuCircleAlert } from "react-icons/lu";

export function IdentifyError({ children }: { children: string }) {
	return (
		<div
			className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-left text-destructive text-sm"
			role="alert"
		>
			<LuCircleAlert className="size-4 shrink-0" />
			{children}
		</div>
	);
}
