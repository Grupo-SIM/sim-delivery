import { createFileRoute } from "@tanstack/react-router";
import { BrandButton } from "@/components/ui/BrandButton";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GradientCard } from "@/components/ui/GradientCard";
import { KitSection, Swatch } from "./components";

function DesignKitPage() {
	return (
		<div className="min-h-screen bg-background py-12">
			<Container className="space-y-16">
				{/* Hero */}
				<header className="space-y-3">
					<Badge tone="accent">Design Kit</Badge>
					<DisplayHeading as="h1" size="xl">
						Zero Grau
					</DisplayHeading>
					<p className="max-w-2xl text-lg text-muted-foreground">
						Identidade visual do cardápio — cores, tipografia, componentes e animações da marca, sobre Base
						Web + Tailwind.
					</p>
				</header>

				{/* Palette */}
				<KitSection
					description="Azul royal é a cor de ação; amarelo e ciano são acentos decorativos. Vermelho para estados negativos."
					title="Paleta"
				>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
						<Swatch className="bg-brand-blue" name="Blue" value="#0012FF" />
						<Swatch className="bg-brand-blue-light" name="Blue Light" value="#3342FF" />
						<Swatch
							className="bg-brand-yellow"
							name="Yellow"
							textClassName="text-brand-blue"
							value="#FFED00"
						/>
						<Swatch
							className="bg-brand-yellow-dark"
							name="Yellow Dark"
							textClassName="text-brand-blue"
							value="#E6D600"
						/>
						<Swatch className="bg-brand-cyan" name="Cyan" textClassName="text-brand-ink" value="#00E5FF" />
						<Swatch className="bg-brand-cyan-deep" name="Cyan Deep" value="#00B4D8" />
						<Swatch className="bg-brand-red" name="Red Liras" value="#E33E2B" />
						<Swatch className="bg-brand-ink" name="Ink" value="#1A1A2E" />
					</div>
				</KitSection>

				{/* Typography */}
				<KitSection
					description="Luckiest Guy para títulos de destaque; Outfit para todo o resto (400 → 900)."
					title="Tipografia"
				>
					<div className="space-y-6 rounded-brand border border-border bg-card p-8 shadow-soft">
						<div className="space-y-1">
							<span className="text-muted-foreground text-xs uppercase tracking-wide">
								Display — Luckiest Guy
							</span>
							<DisplayHeading size="lg">Monte do seu jeito</DisplayHeading>
						</div>
						<div className="space-y-2">
							<span className="text-muted-foreground text-xs uppercase tracking-wide">Body — Outfit</span>
							<p className="font-black text-3xl">Sorvete artesanal</p>
							<p className="font-semibold text-xl">Açaí, milkshakes e pizza</p>
							<p className="text-base">
								Texto corrido em Outfit Regular, com ótima leitura em telas pequenas e grandes.
							</p>
						</div>
					</div>
				</KitSection>

				{/* Buttons */}
				<KitSection
					description="CTAs em pílula, com leve elevação no hover. Base Web + overrides de marca."
					title="Botões"
				>
					<div className="flex flex-wrap items-center gap-4">
						<BrandButton tone="primary">Fazer pedido</BrandButton>
						<BrandButton tone="accent">Ver cardápio</BrandButton>
						<BrandButton tone="cyan">Novidades</BrandButton>
						<BrandButton tone="whatsapp">WhatsApp</BrandButton>
						<BrandButton tone="outline">Saiba mais</BrandButton>
					</div>
				</KitSection>

				{/* Cards */}
				<KitSection
					description="Cards de produto com gradiente e hover 3D — a assinatura visual da vitrine."
					title="Cards"
				>
					<div className="grid gap-6 sm:grid-cols-2">
						<GradientCard tone="blue">
							<div>
								<p className="font-display text-3xl">Sorvetes</p>
								<p className="opacity-90">Do jeito que você monta</p>
							</div>
						</GradientCard>
						<GradientCard tone="yellow">
							<div>
								<p className="font-display text-3xl">Açaí</p>
								<p className="opacity-80">Cremoso e gelado</p>
							</div>
						</GradientCard>
						<GradientCard tone="cyan">
							<div>
								<p className="font-display text-3xl">Milkshakes</p>
								<p className="opacity-90">Cerca de mil combinações</p>
							</div>
						</GradientCard>
						<GradientCard tone="instagram">
							<div>
								<p className="font-display text-3xl">@zerograu</p>
								<p className="opacity-90">Siga a gente</p>
							</div>
						</GradientCard>
					</div>
				</KitSection>

				{/* Badges */}
				<KitSection description="Etiquetas de status em pílula, em todos os tons da marca." title="Badges">
					<div className="flex flex-wrap gap-3">
						<Badge tone="primary">Destaque</Badge>
						<Badge tone="accent">Novo</Badge>
						<Badge tone="cyan">Gelado</Badge>
						<Badge tone="success">Aberto</Badge>
						<Badge tone="danger">Esgotado</Badge>
						<Badge tone="neutral">Em breve</Badge>
					</div>
				</KitSection>

				{/* Animations */}
				<KitSection
					description="Movimentos sutis de flutuação e pulso, reaproveitados da vitrine."
					title="Animações"
				>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<div className="flex h-32 items-center justify-center rounded-brand bg-card shadow-soft">
							<span className="animate-float font-display text-2xl text-brand-blue">float</span>
						</div>
						<div className="flex h-32 items-center justify-center rounded-brand bg-card shadow-soft">
							<span className="animate-float-slow font-display text-2xl text-brand-cyan-deep">slow</span>
						</div>
						<div className="flex h-32 items-center justify-center rounded-brand bg-card shadow-soft">
							<span className="animate-float-fast font-display text-2xl text-brand-red">fast</span>
						</div>
						<div className="flex h-32 items-center justify-center rounded-brand bg-card shadow-soft">
							<span className="animate-pulse-soon font-display text-2xl text-brand-yellow-dark">pulse</span>
						</div>
					</div>
				</KitSection>
			</Container>
		</div>
	);
}

export const Route = createFileRoute("/design-kit/")({
	component: DesignKitPage,
});
