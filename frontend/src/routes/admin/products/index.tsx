import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetCategories, useGetProducts, useGetTags } from "@/lib/api";
import { CategoriesBoard, CreateCategoryForm } from "../categories/components";
import { CreateTagForm, TagsTable } from "../tags/components";
import { CreateProductForm, ProductsTable } from "./components";

function ProductsPage() {
	const { t } = useTranslation();
	const { tab } = Route.useSearch();

	const { data: products, isError: prodError, isPending: prodPending } = useGetProducts();
	const { data: categories, isError: catError, isPending: catPending } = useGetCategories();
	const { data: tags, isError: tagsError, isPending: tagsPending } = useGetTags();

	const tabs = [
		{ key: "products", label: t("admin.products.tabs.products") },
		{ key: "categories", label: t("admin.products.tabs.categories") },
		{ key: "tags", label: t("admin.products.tabs.tags") },
	] as const;

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("admin.products.catalogSubtitle")} title={t("admin.products.title")} />

			{/* Tab bar */}
			<div className="flex gap-1 border-border border-b">
				{tabs.map(({ key, label }) => (
					<Link
						className={`-mb-px border-b-2 px-4 py-2 font-medium text-sm transition-colors ${
							tab === key
								? "border-primary text-primary"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
						key={key}
						search={{ tab: key }}
						to="/admin/products"
					>
						{label}
					</Link>
				))}
			</div>

			{/* Products tab */}
			{tab === "products" && (
				<>
					<CreateProductForm />
					{prodPending ? (
						<Skeleton className="h-40 w-full" />
					) : prodError ? (
						<ErrorState title={t("admin.products.loadError")} />
					) : (
						<ProductsTable products={products} />
					)}
				</>
			)}

			{/* Categories tab */}
			{tab === "categories" && (
				<>
					<CreateCategoryForm />
					{catPending ? (
						<Skeleton className="h-40 w-full" />
					) : catError ? (
						<ErrorState title={t("admin.categories.loadError")} />
					) : (
						<CategoriesBoard categories={categories} />
					)}
				</>
			)}

			{/* Tags tab */}
			{tab === "tags" && (
				<>
					<CreateTagForm />
					{tagsPending ? (
						<Skeleton className="h-40 w-full" />
					) : tagsError ? (
						<ErrorState title={t("admin.tags.loadError")} />
					) : (
						<TagsTable tags={tags} />
					)}
				</>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/admin/products/")({
	component: ProductsPage,
	validateSearch: z.object({
		tab: z.enum(["products", "categories", "tags"]).default("products"),
	}),
});
