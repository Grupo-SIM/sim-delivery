import { Checkbox } from "@/components/ui/Checkbox";
import type { GetProductsByProductIdOptionGroups200 } from "@/lib/api";

interface UnitOptionExclusionsFieldsProps {
	excludedOptionIds: string[];
	groups: GetProductsByProductIdOptionGroups200;
	onChange: (ids: string[]) => void;
}

export function UnitOptionExclusionsFields({
	excludedOptionIds,
	groups,
	onChange,
}: UnitOptionExclusionsFieldsProps) {
	function toggle(optionId: string) {
		onChange(
			excludedOptionIds.includes(optionId)
				? excludedOptionIds.filter(id => id !== optionId)
				: [...excludedOptionIds, optionId],
		);
	}
	return (
		<section className="space-y-2">
			<h3 className="font-medium text-sm">Opções indisponíveis nesta unidade</h3>
			{groups.map(group => (
				<div className="space-y-1 rounded border border-border p-2" key={group.id}>
					<p className="font-medium text-sm">{group.name}</p>
					{group.options.map(option => (
						<label
							className="flex cursor-pointer items-center gap-2 text-sm"
							htmlFor={`excluded-${option.id}`}
							key={option.id}
						>
							<Checkbox
								checked={excludedOptionIds.includes(option.id)}
								id={`excluded-${option.id}`}
								onChange={() => toggle(option.id)}
							/>
							<span>{option.name}</span>
						</label>
					))}
				</div>
			))}
		</section>
	);
}
