import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetPlatformFees } from "@/lib/api";
import { requireSuperAdminBeforeLoad } from "@/lib/super-admin-guard";
import { CompanyOverridesModal, CreateFeeForm, FeeEditModal, FeesTable } from "./components";
import type { PlatformFee } from "./components/types";

function PlatformFeesPage() {
	const query = useGetPlatformFees();
	const [editing, setEditing] = useState<PlatformFee | null>(null);
	const [companies, setCompanies] = useState<PlatformFee | null>(null);
	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle="Acréscimos sobre preços definidos pelos lojistas." title="Taxas da plataforma" />
			<CreateFeeForm />
			{query.isPending ? <Skeleton className="h-48 w-full" /> : query.isError ? <ErrorState title="Erro ao carregar taxas" /> : <FeesTable fees={query.data ?? []} onCompanies={setCompanies} onEdit={setEditing} />}
			<FeeEditModal fee={editing} onClose={() => setEditing(null)} />
			<CompanyOverridesModal fee={companies} onClose={() => setCompanies(null)} />
		</Container>
	);
}

export const Route = createFileRoute("/admin/platform/fees/")({ beforeLoad: requireSuperAdminBeforeLoad, component: PlatformFeesPage });
