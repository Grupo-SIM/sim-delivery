import { createFileRoute } from "@tanstack/react-router";
import { BrandButton } from "@/components/ui/BrandButton";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/Container";
import { DisplayHeading } from "@/components/ui/DisplayHeading";
import { GradientCard } from "@/components/ui/GradientCard";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { KitSection, Swatch } from "./components";

function DesignKitPage() {
 const branding = useLiveBranding();
 const { mode } = useThemePreference(branding.allowThemeToggle, branding.defaultTheme);
 const colors = branding.themeColors[mode];
	return (
		<div className="min-h-screen bg-background py-12">
			<Container className="space-y-16">
				{/* Hero */}
				<header className="space-y-3">
					<Badge tone="accent">Design Kit</Badge>
					<DisplayHeading as="h1" size="xl">
						{branding.companyName}
					</DisplayHeading>
					<p className="max-w-2xl text-lg text-muted-foreground">
						Identidade visual do cardápio — cores, tipografia, componentes e animações da marca, sobre Base
						Web + Tailwind.
					</p>
				</header>

				{/* Palette */}
				<KitSection
					description="Papéis fixos, cores da empresa atual: marca para ações e seleção, apoio para painéis de marca, destaque para promoções; estados usam suas próprias cores."
					title="Paleta"
				>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
 <Swatch className="bg-primary" name="Marca e ações" textClassName="text-primary-foreground" value={colors.primary} />
 <Swatch className="bg-secondary" name="Apoio da marca" textClassName="text-secondary-foreground" value={colors.secondary} />
 <Swatch className="bg-accent" name="Destaque promocional" textClassName="text-accent-foreground" value={colors.accent} />
 <Swatch className="bg-card" name="Cartões" textClassName="text-card-foreground" value={colors.card} />
 <Swatch className="bg-popover" name="Menus e pop-ups" textClassName="text-popover-foreground" value={colors.popover} />
 <Swatch className="bg-muted" name="Apoio neutro" textClassName="text-muted-foreground" value={colors.muted} />
 <Swatch className="bg-foreground" name="Conteúdo" textClassName="text-background" value={colors.foreground} />
 <Swatch className="bg-destructive" name="Erro / exclusão" textClassName="text-destructive-foreground" value={colors.destructive} />
 </div>
				</KitSection>

				{/* Typography */}
				<KitSection
					description={`${branding.fontDisplay} para marca, unidades e títulos principais da vitrine; ${branding.fontFamily} para leitura, controles e telas operacionais.`}
					title="Tipografia"
				>
					<div className="space-y-6 rounded-brand border border-border bg-card text-card-foreground p-8 shadow-soft">
						<div className="space-y-1">
							<span className="text-muted-foreground text-xs uppercase tracking-wide">
								Destaque — {branding.fontDisplay}
							</span>
							<DisplayHeading size="lg">Monte do seu jeito</DisplayHeading>
						</div>
						<div className="space-y-2">
							<span className="text-muted-foreground text-xs uppercase tracking-wide">Leitura — {branding.fontFamily}</span>
							<p className="font-black text-3xl">Sorvete artesanal</p>
							<p className="font-semibold text-xl">Açaí, milkshakes e pizza</p>
							<p className="text-base">
								Texto corrido em {branding.fontFamily}, com ótima leitura em telas pequenas e grandes.
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
						<BrandButton tone="accent">Fazer pedido</BrandButton>
						<BrandButton tone="primary">Ver cardápio</BrandButton>
						<BrandButton tone="secondary">Novidades</BrandButton>
						<BrandButton tone="whatsapp">WhatsApp</BrandButton>
						<BrandButton tone="outline">Saiba mais</BrandButton>
					</div>
				</KitSection>

				{/* Cards */}
				<KitSection
					description="Painéis de marca com pares consistentes de fundo e texto."
					title="Cards"
				>
					<div className="grid gap-6 sm:grid-cols-2">
						<GradientCard tone="primary">
							<div>
								<p className="font-display text-3xl">Sorvetes</p>
								<p className="opacity-90">Do jeito que você monta</p>
							</div>
						</GradientCard>
						<GradientCard tone="accent">
							<div>
								<p className="font-display text-3xl">Açaí</p>
								<p className="opacity-80">Cremoso e gelado</p>
							</div>
						</GradientCard>
						<GradientCard tone="secondary">
							<div>
								<p className="font-display text-3xl">Milkshakes</p>
								<p className="opacity-90">Cerca de mil combinações</p>
							</div>
						</GradientCard>
						<GradientCard tone="inverse">
							<div>
								<p className="font-display text-3xl">Sua marca</p>
								<p className="opacity-90">Siga a gente</p>
							</div>
						</GradientCard>
					</div>
				</KitSection>

				{/* Badges */}
				<KitSection description="Etiquetas de status em pílula, em todos os tons da marca." title="Badges">
					<div className="flex flex-wrap gap-3">
						<Badge tone="accent">Destaque</Badge>
						<Badge tone="secondary">Novo</Badge>
						<Badge tone="secondary">Gelado</Badge>
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
						<div className="flex h-32 items-center justify-center rounded-brand bg-card text-card-foreground shadow-soft">
							<span className="animate-float font-display text-2xl text-primary">float</span>
						</div>
						<div className="flex h-32 items-center justify-center rounded-brand bg-card text-card-foreground shadow-soft">
							<span className="animate-float-slow font-display text-2xl text-muted-foreground">slow</span>
						</div>
						<div className="flex h-32 items-center justify-center rounded-brand bg-card text-card-foreground shadow-soft">
							<span className="animate-float-fast font-display text-2xl text-primary">fast</span>
						</div>
						<div className="flex h-32 items-center justify-center rounded-brand bg-card text-card-foreground shadow-soft">
							<span className="animate-pulse-soon font-display text-2xl text-primary">pulse</span>
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
