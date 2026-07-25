# Fix global superAdmin staff deletion

## Goal
Allow a global `superAdmin` to remove any eligible non-owner staff member (manager, attendant, kitchen, or courier) regardless of company, while keeping existing company-scoped removal for other roles.

## Findings
- `DELETE /staff/:staffId` derives a scope in `backend/src/modules/staff/infra/elysia/StaffController.ts` and currently passes only `scope.companyId` to `RemoveStaff`.
- `RemoveStaff.execute` in `backend/src/modules/staff/useCases/RemoveStaff.ts` requires the target’s `companyId` to equal that value and rejects a null company ID. A global superAdmin has no company scope, so deletion of the supplied manager returns `STAFF_NOT_FOUND`.
- The authorization guard already grants `staff.remove` to `superAdmin`, so authorization succeeds; the tenancy lookup is the failing layer.
- The use case explicitly protects owners by limiting the target role set to manager, attendant, kitchen, and courier. This invariant will remain intact.

## Implementation
1. Change the `RemoveStaff` input from only `companyId` to a scope that includes the authenticated role (or add an explicit global-delete flag derived by the controller).
2. Build the Prisma target filter so `superAdmin` omits the company predicate, while all other roles retain the required same-company predicate. Keep the allowed-role filter unchanged to continue protecting owner accounts.
3. Update the controller to pass the full resolved scope (or its role-aware deletion input) to the use case.
4. Extend `RemoveStaff.test.ts` with a passing case for a global superAdmin deleting a manager from another company, while retaining the existing cross-company rejection test for non-superAdmin callers and adding/retaining owner-protection coverage if absent.
5. Run the focused staff use-case test and the relevant backend checks/lint/typecheck configured by `backend/package.json`.

## Expected behavior
- Global superAdmin + target manager in any company → `204`/success response (`{ ok: true }`).
- Manager/owner context + target in another company → `STAFF_NOT_FOUND`.
- Any caller + target owner → `STAFF_NOT_FOUND`.
