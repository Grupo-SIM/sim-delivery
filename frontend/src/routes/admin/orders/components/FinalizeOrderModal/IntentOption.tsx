import type { IconType } from "react-icons";
import { Button } from "@/components/ui/button";

interface IntentOptionProps {
	description: string;
	icon: IconType;
	isSelected: boolean;
	label: string;
	onClick: () => void;
	variant?: "default" | "destructive";
}

export function IntentOption({
	description,
	icon: Icon,
	isSelected,
	label,
	onClick,
	variant = "default",
}: IntentOptionProps) {
	const colors =
		variant === "destructive"
			? "border-destructive/35 bg-destructive/5 text-destructive"
			: "border-primary/35 bg-primary/5 text-primary";

	return (
		<Button
			aria-pressed={isSelected}
			className={`h-auto min-h-20 justify-start gap-3 whitespace-normal px-4 py-3 text-left ${
				isSelected ? colors : "border-border bg-card text-card-foreground"
			}`}
			onClick={onClick}
			type="button"
			variant="outline"
		>
			<span
				className={`grid size-9 shrink-0 place-items-center rounded-lg ${
					isSelected ? colors : "bg-muted text-muted-foreground"
				}`}
			>
				<Icon className="size-5" />
			</span>
			<span className="min-w-0">
				<span className="block font-semibold text-sm">{label}</span>
				<span className="mt-0.5 block text-muted-foreground text-xs leading-5">{description}</span>
			</span>
		</Button>
	);
}
