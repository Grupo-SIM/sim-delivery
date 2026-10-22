import { createFileRoute } from "@tanstack/react-router";
import { UnitStorePage } from "../components";
import { unitSearchSchema } from "../components/unit-search";

function UnitPage() {
	const { unitId } = Route.useParams();
	return <UnitStorePage unitSlug={unitId} />;
}

export const Route = createFileRoute("/_storefront/$unitId/")({ component: UnitPage, validateSearch: unitSearchSchema });
