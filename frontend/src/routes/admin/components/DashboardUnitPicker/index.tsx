import { CustomSelect } from "@/components/ui/CustomSelect";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetUnits } from "@/lib/api";

interface DashboardUnitPickerProps {
	onChange: (unitId: string) => void;
	value: string;
}

export function DashboardUnitPicker({ onChange, value }: DashboardUnitPickerProps) {
	const { data: units = [], isPending } = useGetUnits();

	if (isPending) return <Skeleton className="h-11 w-48" />;

	return (
		<div className="w-48">
			<CustomSelect
				onChange={onChange}
				options={[
					{ label: "Todas as unidades", value: "" },
					...units.map(unit => ({ label: unit.name, value: unit.id })),
				]}
				value={value}
			/>
		</div>
	);
}
