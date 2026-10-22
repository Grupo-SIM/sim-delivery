interface SwatchProps {
	name: string;
	value: string;
	className: string;
	textClassName?: string;
}

/** A single color chip for the palette grid. */
export function Swatch({ className, name, textClassName = "text-inherit", value }: SwatchProps) {
	return (
		<div className="overflow-hidden rounded-brand shadow-soft">
			<div className={`flex h-24 items-end p-3 ${className}`}>
				<span className={`font-semibold text-sm ${textClassName}`}>{name}</span>
			</div>
			<div className="bg-card text-card-foreground px-3 py-2">
				<span className="font-mono text-muted-foreground text-xs uppercase">{value}</span>
			</div>
		</div>
	);
}
