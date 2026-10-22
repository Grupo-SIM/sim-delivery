/** Waiting: warning. Active: primary. Ready/completed: success. Failed: destructive. */
const statusClassNames: Record<string, string> = {
	awaiting_payment: "border-warning/30 bg-warning/10 text-warning",
	cancelado: "border-destructive/30 bg-destructive/10 text-destructive",
	em_preparo: "border-primary/30 bg-primary/10 text-primary",
	entregue: "border-success/30 bg-success/10 text-success",
	problema: "border-destructive/30 bg-destructive/10 text-destructive",
	pronto: "border-success/30 bg-success/10 text-success",
	recebido: "border-primary/30 bg-primary/10 text-primary",
	retirado: "border-success/30 bg-success/10 text-success",
	saiu_para_entrega: "border-primary/30 bg-primary/10 text-primary",
};

export function orderStatusClassName(status: string) {
 return statusClassNames[status] ?? "border-border bg-muted text-muted-foreground";
}
