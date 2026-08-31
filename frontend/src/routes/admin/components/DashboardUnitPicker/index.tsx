import { useEffect } from "react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Skeleton } from "@/components/ui/Skeleton";
import { authClient } from "@/lib/auth-client";
import { useGetUnits } from "@/lib/api";

interface DashboardUnitPickerProps {
	onChange: (unitId: string) => void;
	value: string;
}

export function DashboardUnitPicker({ onChange, value }: DashboardUnitPickerProps) {
	const { data: units = [], isPending } = useGetUnits();
	const { data: session, isPending: isSessionPending } = authClient.useSession();
	const canViewAllUnits = ["owner", "superAdmin"].includes(session?.user.role ?? "");
	const options = [
		...(canViewAllUnits ? [{ label: "Todas as unidades", value: "" }] : []),
		...units.map(unit => ({ label: unit.name, value: unit.id })),
	];

	useEffect(() => {
		if (isSessionPending || canViewAllUnits || units.length === 0 || units.some(unit => unit.id === value)) return;

		onChange(units[0].id);
	}, [canViewAllUnits, isSessionPending, onChange, units, value]);

	if (isPending || isSessionPending) return <Skeleton className="h-11 w-48" />;

	return (
		<div className="w-48">
			<CustomSelect onChange={onChange} options={options} value={value} />
		</div>
	);
}
