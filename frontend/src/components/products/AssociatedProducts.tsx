import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

interface AssociatedProduct {
	id: string;
	title: string;
}

interface AssociatedProductsProps {
	emptyLabel: string;
	modalTitle: string;
	products: AssociatedProduct[];
	urlKey: string;
	urlState: string;
	viewLabel: string;
}

export function AssociatedProducts({
	emptyLabel,
	modalTitle,
	products,
	urlKey,
	urlState,
	viewLabel,
}: AssociatedProductsProps) {
	const [isOpen, setIsOpen] = useState(false);

	if (products.length === 0) {
		return <span className="text-muted-foreground text-sm">{emptyLabel}</span>;
	}

	return (
		<>
			<Button className="cursor-pointer" onClick={() => setIsOpen(true)} size="sm" type="button" variant="outline">
				{viewLabel}
			</Button>
			<Modal
				isOpen={isOpen}
				maxWidth="480px"
				onClose={() => setIsOpen(false)}
				title={modalTitle}
				urlKey={urlKey}
				urlState={urlState}
			>
				<div className="flex flex-wrap gap-1.5">
					{products.map(product => (
						<Badge key={product.id} tone="neutral">
							{product.title}
						</Badge>
					))}
				</div>
			</Modal>
		</>
	);
}
