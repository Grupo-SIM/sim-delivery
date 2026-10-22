/** Read-only report; never provisions accounts, credentials or money. */
import { prisma } from "../src/shared/infra/sql";
try {
 const companies = await prisma.company.findMany({ select: { id: true, simpayMerchantId: true, simpayIntegration: { select: { status: true, platformId: true, merchantId: true } } } });
 const pending = await prisma.payment.findMany({ where: { status: "pending", simpayPaymentId: { not: null } }, select: { id: true, orderId: true, order: { select: { companyId: true } } } });
 const attempts = await prisma.paymentAttempt.findMany({ where: { state: { in: ["preparing", "submitting", "pending"] } }, select: { id: true, companyId: true, orderId: true, state: true } });
 const withdrawals = await prisma.withdrawal.findMany({ where: { status: { in: ["submitting", "PENDING", "APPROVED"] } }, select: { id: true, companyId: true, externalWithdrawalId: true, status: true } });
 const legacyCards = await prisma.savedCard.count({ where: { bin: null } });
 console.log(JSON.stringify({ dryRun: true, companies: companies.map(c => ({ companyId: c.id, status: c.simpayIntegration?.status ?? "NOT_BOOTSTRAPPED", conflicts: c.simpayIntegration?.merchantId && c.simpayMerchantId && c.simpayIntegration.merchantId !== c.simpayMerchantId ? ["MERCHANT_ID_CONFLICT"] : [] })), pendingPayments: pending.map(p => ({ id: p.id, orderId: p.orderId, companyId: p.order.companyId })), attempts, withdrawals, cardsRequiringMetadata: legacyCards }, null, 2));
} finally { await prisma.$disconnect(); }
