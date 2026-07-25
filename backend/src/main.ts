import { startExpiredUnpaidOrderCancellation } from "./modules/orders/useCases";
import { server } from "./server";
import { auth } from "./shared/infra/betterAuth";
import { app } from "./shared/infra/elysia";
import { SeedAdmin } from "./shared/infra/SeedAdmin";
import { prisma } from "./shared/infra/sql";
import { createWhatsAppProvider } from "./shared/infra/whatsapp";

// Add modules here
await new SeedAdmin(prisma, input => auth.api.signUpEmail(input)).execute();
startExpiredUnpaidOrderCancellation(prisma, createWhatsAppProvider());

server.listen(process.env.PORT || 3333);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
