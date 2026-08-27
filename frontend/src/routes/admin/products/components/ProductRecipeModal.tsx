import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { CollapsibleModalSection } from "@/components/ui/CollapsibleModalSection";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { NumericInput } from "@/components/ui/NumericInput";
import { Skeleton } from "@/components/ui/Skeleton";
import {
	getProductsByProductIdRecipeQueryKey,
	useGetInventoryItems,
	useGetProductsByProductIdOptionGroups,
	useGetProductsByProductIdRecipe,
	usePutProductsByProductIdRecipe,
} from "@/lib/api";
import { showAlert, showToast } from "@/stores";
import type { Product } from "./types";

interface IngredientDraft {
	inventoryItemId: string;
	quantity: number;
}

interface ProductRecipeModalProps {
	onClose: () => void;
	product: Product | null;
}

export function ProductRecipeModal({ onClose, product }: ProductRecipeModalProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const productId = product?.id;
	const { data: items = [] } = useGetInventoryItems({ active: true });
	const { data, isPending } = useGetProductsByProductIdRecipe(productId);
	const { data: optionGroups = [] } = useGetProductsByProductIdOptionGroups(productId);
	const save = usePutProductsByProductIdRecipe();
	const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
	const [optionDeltas, setOptionDeltas] = useState<Record<string, IngredientDraft[]>>({});

	useEffect(() => {
		if (data) {
			setIngredients(
				data.ingredients.map(row => ({ inventoryItemId: row.inventoryItemId, quantity: row.quantity })),
			);
			setOptionDeltas(
				Object.fromEntries(
					data.optionDeltas.map(row => [
						row.optionId,
						row.ingredients.map(ingredient => ({
							inventoryItemId: ingredient.inventoryItemId,
							quantity: ingredient.quantityDelta,
						})),
					]),
				),
			);
		}
	}, [data]);

	function close() {
		setIngredients(
			data?.ingredients.map(row => ({ inventoryItemId: row.inventoryItemId, quantity: row.quantity })) ?? [],
		);
		setOptionDeltas(
			Object.fromEntries(
				data?.optionDeltas.map(row => [
					row.optionId,
					row.ingredients.map(ingredient => ({
						inventoryItemId: ingredient.inventoryItemId,
						quantity: ingredient.quantityDelta,
					})),
				]) ?? [],
			),
		);
		onClose();
	}

	function submit() {
		if (!productId || !data) return;
		save.mutate(
			{
				data: {
					ingredients: ingredients.filter(row => row.inventoryItemId && row.quantity > 0),
					optionDeltas: Object.entries(optionDeltas)
						.filter(([, rows]) => rows.length > 0)
						.map(([optionId, rows]) => ({
							ingredients: rows
								.filter(row => row.inventoryItemId && row.quantity !== 0)
								.map(row => ({ inventoryItemId: row.inventoryItemId, quantityDelta: row.quantity })),
							optionId,
						})),
				},
				productId,
			},
			{
				onError: () => void showAlert(t("admin.products.recipe.error")),
				onSuccess: () => {
					void queryClient.invalidateQueries({ queryKey: getProductsByProductIdRecipeQueryKey(productId) });
					showToast(t("admin.products.recipe.success"), "positive");
					onClose();
				},
			},
		);
	}

	return (
		<Modal
			isOpen={product !== null}
			maxWidth="720px"
			onClose={close}
			title={t("admin.products.recipe.title", { name: product?.title ?? "" })}
			urlKey="product-recipe"
			urlState={product?.id}
		>
			{isPending ? (
				<Skeleton className="h-40" />
			) : (
				<div className="space-y-4">
					<p className="text-muted-foreground text-sm">{t("admin.products.recipe.help")}</p>
					{ingredients.length === 0 ? (
						<p className="rounded-lg border border-border p-4 text-muted-foreground text-sm">
							{t("admin.products.recipe.empty")}
						</p>
					) : (
						ingredients.map((ingredient, index) => (
							<div
								className="grid items-end gap-3 sm:grid-cols-[1fr_180px_auto]"
								key={`${index}:${ingredient.inventoryItemId}`}
							>
								<div>
									<span className="mb-1 block font-medium text-sm">
										{t("admin.products.recipe.ingredient")}
									</span>
									<CustomSelect
										onChange={inventoryItemId =>
											setIngredients(rows =>
												rows.map((row, rowIndex) => (rowIndex === index ? { ...row, inventoryItemId } : row)),
											)
										}
										options={items.map(item => ({ label: item.name, value: item.id }))}
										value={ingredient.inventoryItemId}
									/>
								</div>
								<div>
									<span className="mb-1 block font-medium text-sm">
										{t("admin.products.recipe.quantity")}
									</span>
									<NumericInput
										decimalScale={3}
										onValueChange={({ floatValue }) =>
											setIngredients(rows =>
												rows.map((row, rowIndex) =>
													rowIndex === index ? { ...row, quantity: floatValue } : row,
												),
											)
										}
										placeholder="Ex: 0,250"
										value={ingredient.quantity}
									/>
								</div>
								<Button
									aria-label={t("admin.products.recipe.remove")}
									onClick={() => setIngredients(rows => rows.filter((_, rowIndex) => rowIndex !== index))}
									size="icon"
									type="button"
									variant="outline"
								>
									<LuTrash2 />
								</Button>
							</div>
						))
					)}
					<Button
						onClick={() => setIngredients(rows => [...rows, { inventoryItemId: "", quantity: 0 }])}
						type="button"
						variant="outline"
					>
						<LuPlus />
						{t("admin.products.recipe.add")}
					</Button>
					<CollapsibleModalSection
						summary={t("admin.products.recipe.optionsSummary")}
						title={t("admin.products.recipe.optionsTitle")}
					>
						{optionGroups
							.flatMap(group => group.options)
							.map(option => (
								<div className="space-y-3 rounded-lg border border-border p-3" key={option.id}>
									<p className="font-medium text-sm">{option.name}</p>
									{(optionDeltas[option.id] ?? []).map((ingredient, index) => (
										<div
											className="grid items-end gap-3 sm:grid-cols-[1fr_120px_180px_auto]"
											key={`${option.id}:${index}:${ingredient.inventoryItemId}`}
										>
											<div>
												<span className="mb-1 block text-sm">{t("admin.products.recipe.ingredient")}</span>
												<CustomSelect
													onChange={inventoryItemId =>
														setOptionDeltas(current => ({
															...current,
															[option.id]: (current[option.id] ?? []).map((row, rowIndex) =>
																rowIndex === index ? { ...row, inventoryItemId } : row,
															),
														}))
													}
													options={items.map(item => ({ label: item.name, value: item.id }))}
													value={ingredient.inventoryItemId}
												/>
											</div>
											<div>
												<span className="mb-1 block text-sm">{t("admin.products.recipe.operation")}</span>
												<CustomSelect
													onChange={operation =>
														setOptionDeltas(current => ({
															...current,
															[option.id]: (current[option.id] ?? []).map((row, rowIndex) =>
																rowIndex === index
																	? {
																			...row,
																			quantity:
																				operation === "remove"
																					? -Math.abs(row.quantity)
																					: Math.abs(row.quantity),
																		}
																	: row,
															),
														}))
													}
													options={[
														{ label: t("admin.products.recipe.addConsumption"), value: "add" },
														{ label: t("admin.products.recipe.removeConsumption"), value: "remove" },
													]}
													value={ingredient.quantity < 0 ? "remove" : "add"}
												/>
											</div>
											<div>
												<span className="mb-1 block text-sm">{t("admin.products.recipe.delta")}</span>
												<NumericInput
													decimalScale={3}
													onValueChange={({ floatValue }) =>
														setOptionDeltas(current => ({
															...current,
															[option.id]: (current[option.id] ?? []).map((row, rowIndex) =>
																rowIndex === index
																	? { ...row, quantity: row.quantity < 0 ? -floatValue : floatValue }
																	: row,
															),
														}))
													}
													placeholder="Ex: 0,050"
													value={Math.abs(ingredient.quantity)}
												/>
											</div>
											<Button
												aria-label={t("admin.products.recipe.remove")}
												onClick={() =>
													setOptionDeltas(current => ({
														...current,
														[option.id]: (current[option.id] ?? []).filter(
															(_, rowIndex) => rowIndex !== index,
														),
													}))
												}
												size="icon"
												type="button"
												variant="outline"
											>
												<LuTrash2 />
											</Button>
										</div>
									))}
									<Button
										onClick={() =>
											setOptionDeltas(current => ({
												...current,
												[option.id]: [...(current[option.id] ?? []), { inventoryItemId: "", quantity: 0 }],
											}))
										}
										type="button"
										variant="outline"
									>
										<LuPlus />
										{t("admin.products.recipe.addDelta")}
									</Button>
								</div>
							))}
					</CollapsibleModalSection>
					<div className="flex justify-end gap-2">
						<Button onClick={close} type="button" variant="outline">
							{t("actions.cancel")}
						</Button>
						<Button
							disabled={
								save.isPending ||
								ingredients.some(row => !row.inventoryItemId || row.quantity <= 0) ||
								Object.values(optionDeltas).some(rows =>
									rows.some(row => !row.inventoryItemId || row.quantity === 0),
								)
							}
							onClick={submit}
							type="button"
						>
							{t("admin.products.recipe.save")}
						</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}
