import { Checkbox } from "@/components/ui/Checkbox";
import type { GetUnits200 } from "@/lib/api";

interface StaffUnitSelectorProps {
	idPrefix: string;
	onChange: (unitIds: string[]) => void;
	unitIds: string[];
	units: GetUnits200;
}

export function StaffUnitSelector({ idPrefix, onChange, unitIds, units }: StaffUnitSelectorProps) {
	return (
		<div className="mt-2 flex flex-wrap gap-3">
			{units.map(unit => (
				<label className="flex cursor-pointer items-center gap-2 text-sm" htmlFor={`${idPrefix}-${unit.id}`} key={unit.id}>
					<Checkbox
						checked={unitIds.includes(unit.id)}
						id={`${idPrefix}-${unit.id}`}
						onChange={event =>
							onChange(
								event.currentTarget.checked
									? [...unitIds, unit.id]
									: unitIds.filter(unitId => unitId !== unit.id),
							)
						}
					/>
					{unit.name}
				</label>
			))}
		</div>
	);
}
