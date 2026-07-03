import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	CreateUnitBody,
	SetUnitHoursBody,
	UnitHoursListReturn,
	UnitListReturn,
	UnitReturn,
	UpdateUnitBody,
} from "../../dtos";
import { CreateUnit, DeleteUnit, GetUnitHours, ListUnits, SetUnitHours, UpdateUnit } from "../../useCases";

export const UnitsController = new Elysia({
	detail: {
		tags: ["Units"],
	},
})
	.use([GlobalPlugin])
	.group("/units", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				createUnit: new CreateUnit(prisma),
				deleteUnit: new DeleteUnit(prisma),
				getUnitHours: new GetUnitHours(prisma),
				listUnits: new ListUnits(prisma),
				prisma,
				setUnitHours: new SetUnitHours(prisma),
				updateUnit: new UpdateUnit(prisma),
			}))
			.get(
				"/",
				async ({ listUnits, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "read");

					return listUnits.execute(scope.companyId);
				},
				{ response: UnitListReturn },
			)
			.post(
				"/",
				async ({ body, createUnit, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "create");

					return createUnit.execute(scope.companyId, body);
				},
				{ body: CreateUnitBody, response: UnitReturn },
			)
			.patch(
				"/:unitId",
				async ({ body, params, request, updateUnit }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "update");

					return updateUnit.execute(scope.companyId, params.unitId, body);
				},
				{ body: UpdateUnitBody, response: UnitReturn },
			)
			.get(
				"/:unitId/hours",
				async ({ getUnitHours, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "read");

					return getUnitHours.execute(scope.companyId, params.unitId);
				},
				{ response: UnitHoursListReturn },
			)
			.put(
				"/:unitId/hours",
				async ({ body, params, request, setUnitHours }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "update");

					return setUnitHours.execute(scope.companyId, params.unitId, body.hours);
				},
				{ body: SetUnitHoursBody, response: UnitHoursListReturn },
			)
			.delete(
				"/:unitId",
				async ({ deleteUnit, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "delete");

					await deleteUnit.execute(scope.companyId, params.unitId);

					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			),
	);
