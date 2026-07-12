import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/IconBadge";

interface AdminSectionCardProps {
	description: string;
	icon: ComponentType<{ className?: string }>;
	title: string;
	to: string;
}

export function AdminSectionCard({ description, icon: Icon, title, to }: AdminSectionCardProps) {
	return (
		<Link className="block" to={to}>
			<Card className="h-full transition-colors hover:border-primary">
				<CardHeader className="flex-row items-center gap-3 space-y-0">
					<IconBadge className="size-10 shrink-0 rounded-md" tone="primary">
						<Icon className="size-5" />
					</IconBadge>
					<CardTitle className="text-base">{title}</CardTitle>
				</CardHeader>
				<CardContent className="text-body-sm text-muted-foreground">{description}</CardContent>
			</Card>
		</Link>
	);
}
