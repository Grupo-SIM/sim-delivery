import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	CreateUnitBody,
	DeliveryZoneListReturn,
	SetDeliveryZonesBody,
	SetUnitHoursBody,
	UnitHoursListReturn,
	UnitReturn,
	UnitWithStatusListReturn,
	UpdateUnitBody,
} from "../../dtos";
import {
	CreateUnit,
	DeleteUnit,
	GetUnitHours,
	ListDeliveryZones,
	ListUnits,
	SetDeliveryZones,
	SetUnitHours,
	UpdateUnit,
} from "../../useCases";

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
				listDeliveryZones: new ListDeliveryZones(prisma),
				listUnits: new ListUnits(prisma),
				prisma,
				setDeliveryZones: new SetDeliveryZones(prisma),
				setUnitHours: new SetUnitHours(prisma),
				updateUnit: new UpdateUnit(prisma),
			}))
			.get(
				"/",
				async ({ listUnits, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "read");

					return listUnits.execute(scope.companyId, scope.role, scope.userId, request.headers.get("x-time-zone") ?? undefined);
				},
				{ response: UnitWithStatusListReturn },
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
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					return updateUnit.execute(scope.companyId, params.unitId, body);
				},
				{ body: UpdateUnitBody, response: UnitReturn },
			)
			.get(
				"/:unitId/hours",
				async ({ getUnitHours, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "read");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					return getUnitHours.execute(scope.companyId, params.unitId);
				},
				{ response: UnitHoursListReturn },
			)
			.put(
				"/:unitId/hours",
				async ({ body, params, request, setUnitHours }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "update");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					return setUnitHours.execute(scope.companyId, params.unitId, body.hours);
				},
				{ body: SetUnitHoursBody, response: UnitHoursListReturn },
			)
			.get(
				"/:unitId/delivery-zones",
				async ({ listDeliveryZones, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "read");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					return listDeliveryZones.execute(scope.companyId, params.unitId);
				},
				{ response: DeliveryZoneListReturn },
			)
			.put(
				"/:unitId/delivery-zones",
				async ({ body, params, request, setDeliveryZones }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "update");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					return setDeliveryZones.execute(scope.companyId, params.unitId, body.zones);
				},
				{ body: SetDeliveryZonesBody, response: DeliveryZoneListReturn },
			)
			.delete(
				"/:unitId",
				async ({ deleteUnit, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "units", "delete");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					await deleteUnit.execute(scope.companyId, params.unitId);

					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			),
	);
