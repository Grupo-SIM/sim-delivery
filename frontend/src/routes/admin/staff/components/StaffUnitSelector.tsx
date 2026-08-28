import { Checkbox } from "@/components/ui/Checkbox";
import type { GetUnits200 } from "@/lib/api";

interface StaffUnitSelectorProps {
	idPrefix: string;
	onChange: (unitIds: string[]) => void;
	unitIds: string[];
	units: GetUnits200;
	allUnitsLabel: string;
}

export function StaffUnitSelector({ allUnitsLabel, idPrefix, onChange, unitIds, units }: StaffUnitSelectorProps) {
	const allUnitsSelected = units.length > 0 && units.every(unit => unitIds.includes(unit.id));

	return (
		<div className="mt-2 flex flex-wrap gap-3">
			<label className="flex cursor-pointer items-center gap-2 text-sm" htmlFor={`${idPrefix}-all`}>
				<Checkbox
					checked={allUnitsSelected}
					id={`${idPrefix}-all`}
					onChange={event => onChange(event.currentTarget.checked ? units.map(unit => unit.id) : [])}
				/>
				{allUnitsLabel}
			</label>
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
