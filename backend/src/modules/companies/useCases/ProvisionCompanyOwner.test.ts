import { describe, expect, it, mock } from "bun:test";
import { ProvisionCompanyOwner } from "./ProvisionCompanyOwner";

const company = { cnpj: null, id: "company", name: "Shop", siteUrl: "https://shop.example", slug: "shop" };
const owner = { companyId: "company", createdAt: new Date(), email: "owner@example.com", id: "owner", name: "Shop", role: "owner", unitIds: [] };
function setup(first: typeof owner | null = null, existing: typeof owner | null = null) {
	let currentFirst = first;
	const prisma = {
		company: { update: mock(async () => company) },
		user: { findFirst: mock(async () => currentFirst), findUnique: mock(async () => existing) },
	};
	const invite = { execute: mock(async () => { currentFirst ??= owner; return owner; }) };
	const simpay = { provisionOwner: mock(async () => ({ id: "merchant" })) };
	const reset = mock(async () => ({}));
	return { invite, prisma, reset, simpay, service: new ProvisionCompanyOwner(prisma as never, invite as never, simpay as never, reset) };
}
describe("ProvisionCompanyOwner", () => {
	it("provisions first owner without requiring CNPJ and forwards supplied password", async () => {
		const { service, simpay, prisma, invite, reset } = setup();
		expect(await service.execute(company, { email: " Owner@Example.com ", password: "secret123" })).toEqual(owner);
		expect(invite.execute).toHaveBeenCalledWith({ companyId: "company", email: "owner@example.com", name: "Shop", role: "owner", unitIds: [] }, { password: "secret123", siteUrl: company.siteUrl });
		expect(simpay.provisionOwner).toHaveBeenCalledWith({ externalMerchantId: "company", integrationKey: "sim-delivery_shop" }, { cnpj: null, email: "owner@example.com", legalName: "Shop", password: "secret123" });
		expect(prisma.company.update).toHaveBeenCalledWith({ data: { simpayMerchantId: "merchant" }, where: { id: "company" } });
		expect(reset).not.toHaveBeenCalled();
	});
	it("omits password and forwards existing CNPJ", async () => {
		const { service, simpay } = setup();
		await service.execute({ ...company, cnpj: "10802530000107", siteUrl: null }, { email: owner.email });
		expect(simpay.provisionOwner.mock.calls[0]).toEqual([{ externalMerchantId: "company", integrationKey: "sim-delivery_shop" }, { cnpj: "10802530000107", email: owner.email, legalName: "Shop", password: undefined }]);
	});
	it("retries first owner after provider failure without recreating local account", async () => {
		const { service, simpay, invite } = setup(owner, owner);
		simpay.provisionOwner.mockRejectedValueOnce(new Error("Provider unavailable"));
		await expect(service.execute(company, { email: owner.email, password: "secret123" })).rejects.toThrow("WITHDRAWAL_PROVIDER_ERROR");
		await service.execute(company, { email: owner.email, password: "secret123" });
		expect(invite.execute).not.toHaveBeenCalled();
		expect(simpay.provisionOwner).toHaveBeenCalledTimes(2);
	});
	it("retries local password definition email when password omitted", async () => {
		const { service, reset } = setup(owner, owner);
		await service.execute(company, { email: owner.email });
		expect(reset).toHaveBeenCalledWith({ body: { email: owner.email, redirectTo: "https://shop.example/reset-password" } });
	});
	it("does not replace merchant for additional owners", async () => {
		const { service, invite, simpay, prisma } = setup({ ...owner, id: "first" });
		await service.execute(company, { email: owner.email });
		expect(invite.execute).toHaveBeenCalledTimes(1);
		expect(simpay.provisionOwner).not.toHaveBeenCalled();
		expect(prisma.company.update).not.toHaveBeenCalled();
	});
	it("rejects email already belonging to another user", async () => {
		const { service, invite, simpay } = setup(owner, { ...owner, id: "other" });
		await expect(service.execute(company, { email: owner.email })).rejects.toThrow();
		expect(invite.execute).not.toHaveBeenCalled();
		expect(simpay.provisionOwner).not.toHaveBeenCalled();
	});
});
