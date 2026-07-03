import { DomainError } from "@/shared/errors";
import type { CepReturn } from "../dtos";
import { CepErrors } from "../errors";

interface ViaCepResponse {
	cep?: string;
	logradouro?: string;
	complemento?: string;
	bairro?: string;
	localidade?: string;
	uf?: string;
	erro?: boolean | string;
}

/** Resolves a Brazilian CEP into an address through the free ViaCEP service (docs/07). */
export class LookupCep {
	async execute(rawCep: string): Promise<CepReturn> {
		const cep = rawCep.replace(/\D/g, "");
		if (cep.length !== 8) {
			throw new DomainError(CepErrors.INVALID_CEP);
		}

		let payload: ViaCepResponse;
		try {
			const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
			payload = (await response.json()) as ViaCepResponse;
		} catch {
			throw new DomainError(CepErrors.CEP_NOT_FOUND);
		}

		// ViaCEP answers 200 with `{ erro: true }` for unknown postal codes.
		if (payload.erro || !payload.cep) {
			throw new DomainError(CepErrors.CEP_NOT_FOUND);
		}

		return {
			addressLine: payload.logradouro ?? "",
			city: payload.localidade ?? "",
			complement: payload.complemento ?? "",
			neighborhood: payload.bairro ?? "",
			state: payload.uf ?? "",
			zipCode: payload.cep.replace(/\D/g, ""),
		};
	}
}
