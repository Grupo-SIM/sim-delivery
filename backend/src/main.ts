import { startMetaCapiWorker } from "./shared/infra/MetaCapiWorker";
import { startExpiredUnpaidOrderCancellation } from "./modules/orders/useCases";
import { startPendingPaymentReconciliation } from "./modules/payments/useCases";
import { server } from "./server";
import { auth } from "./shared/infra/betterAuth";
import { app } from "./shared/infra/elysia";
import { SeedAdmin } from "./shared/infra/SeedAdmin";
import { SeedOwner } from "./shared/infra/SeedOwner";
import { prisma } from "./shared/infra/sql";
import { simpay } from "./shared/infra/simpay";
import {
	createWhatsAppProvider,
	getWahaClientOptions,
	startWhatsAppOutboxWorker,
	startWhatsAppSessionWatchdog,
	WahaClient,
	WahaWhatsAppProvider,
} from "./shared/infra/whatsapp";

// Add modules here
await new SeedAdmin(prisma, input => auth.api.signUpEmail(input)).execute();
await new SeedOwner(prisma, input => auth.api.signUpEmail(input)).execute();
const whatsApp = createWhatsAppProvider();
startExpiredUnpaidOrderCancellation(prisma, whatsApp);
startWhatsAppOutboxWorker(prisma, whatsApp);
if (whatsApp instanceof WahaWhatsAppProvider) startWhatsAppSessionWatchdog(prisma, new WahaClient(getWahaClientOptions()));
startMetaCapiWorker(prisma);
startPendingPaymentReconciliation(prisma, simpay);

server.listen(process.env.PORT || 3333);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
