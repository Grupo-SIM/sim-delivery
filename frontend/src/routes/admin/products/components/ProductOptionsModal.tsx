import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { getProductsByProductIdOptionGroupsQueryKey, useDeleteProductsByProductIdOptionGroupsByGroupId, useDeleteProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId, useGetProductsByProductIdOptionGroups, usePostProductsByProductIdOptionGroups, usePostProductsByProductIdOptionGroupsByGroupIdOptions } from "@/lib/api";
import { showToast } from "@/stores";
import type { Product } from "./types";

interface ProductOptionsModalProps { onClose: () => void; product: Product | null; }

export function ProductOptionsModal({ onClose, product }: ProductOptionsModalProps) {
	const queryClient = useQueryClient(); const [groupName, setGroupName] = useState(""); const [optionNames, setOptionNames] = useState<Record<string, string>>({});
	const groups = useGetProductsByProductIdOptionGroups(product?.id); const createGroup = usePostProductsByProductIdOptionGroups(); const createOption = usePostProductsByProductIdOptionGroupsByGroupIdOptions(); const deleteGroup = useDeleteProductsByProductIdOptionGroupsByGroupId(); const deleteOption = useDeleteProductsByProductIdOptionGroupsByGroupIdOptionsByOptionId();
	const refresh = () => product && queryClient.invalidateQueries({ queryKey: getProductsByProductIdOptionGroupsQueryKey(product.id) });
	if (!product) return null;
	function addGroup() { if (!groupName.trim() || !product) return; createGroup.mutate({ productId: product.id, data: { maxSelect: 1, minSelect: 0, name: groupName.trim(), priceRule: "sum", selectionType: "single" } }, { onSuccess: () => { setGroupName(""); void refresh(); showToast("Grupo criado", "positive"); } }); }
	function addOption(groupId: string) { const name = optionNames[groupId]?.trim(); if (!name || !product) return; createOption.mutate({ groupId, productId: product.id, data: { name, priceDeltaCents: 0 } }, { onSuccess: () => { setOptionNames(current => ({ ...current, [groupId]: "" })); void refresh(); showToast("Opção criada", "positive"); } }); }
	return <Modal isOpen onClose={onClose} title={`Customizações · ${product.title}`}><div className="space-y-4"><div className="flex gap-2"><Input onChange={event => setGroupName(event.currentTarget.value)} placeholder="Ex: Escolha o sabor" value={groupName} /><Button onClick={addGroup} type="button">Adicionar grupo</Button></div>{groups.data?.map(group => <section className="space-y-2 rounded border border-border p-3" key={group.id}><div className="flex items-center justify-between"><strong>{group.name}</strong><ConfirmActionButton confirmation="Excluir grupo e opções?" confirmLabel="Excluir" onConfirm={() => deleteGroup.mutate({ groupId: group.id, productId: product.id }, { onSuccess: refresh })} type="button" variant="outline">Excluir</ConfirmActionButton></div><ul className="space-y-1 text-sm">{group.options.map(option => <li className="flex justify-between" key={option.id}><span>{option.name}</span><ConfirmActionButton confirmation="Excluir opção?" confirmLabel="Excluir" onConfirm={() => deleteOption.mutate({ groupId: group.id, optionId: option.id, productId: product.id }, { onSuccess: refresh })} size="sm" type="button" variant="outline">Excluir</ConfirmActionButton></li>)}</ul><div className="flex gap-2"><Input onChange={event => setOptionNames(current => ({ ...current, [group.id]: event.currentTarget.value }))} placeholder="Ex: Calabresa" value={optionNames[group.id] ?? ""} /><Button onClick={() => addOption(group.id)} type="button" variant="outline">Adicionar opção</Button></div></section>)}</div></Modal>;
}
