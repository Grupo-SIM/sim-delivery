import type { GetOrders200 } from "@/lib/api";

export type MobileColumn =
	| { kind: "status"; orders: GetOrders200; status: string }
	| { kind: "finalized"; orders: GetOrders200; status: "finalizado" };

export type MobileFinalizedStatus = "entregue" | "retirado" | "cancelado";
