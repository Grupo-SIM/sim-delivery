import { DomainError } from "@/shared/errors";
import type { CepReturn } from "../dtos";
import { CepErrors } from "../errors";

interface BrasilApiCepResponse {
	cep?: string;
	street?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
	location?: {
		coordinates?: {
			longitude?: string;
			latitude?: string;
		};
	};
}

/** Resolves a Brazilian CEP into an address (and, when available, coordinates) through
 * the free Brasil API CEP V2 service (docs/07). */
export class LookupCep {
	async execute(rawCep: string): Promise<CepReturn> {
		const cep = rawCep.replace(/\D/g, "");
		if (cep.length !== 8) {
			throw new DomainError(CepErrors.INVALID_CEP);
		}

		let response: Response;
		let payload: BrasilApiCepResponse;
		try {
			response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
			payload = (await response.json()) as BrasilApiCepResponse;
		} catch {
			throw new DomainError(CepErrors.CEP_NOT_FOUND);
		}

		if (!response.ok || !payload.cep) {
			throw new DomainError(CepErrors.CEP_NOT_FOUND);
		}

		const coordinates = payload.location?.coordinates;
		const latitude = coordinates?.latitude !== undefined ? Number(coordinates.latitude) : null;
		const longitude = coordinates?.longitude !== undefined ? Number(coordinates.longitude) : null;

		return {
			addressLine: payload.street ?? "",
			city: payload.city ?? "",
			complement: "",
			latitude,
			longitude,
			neighborhood: payload.neighborhood ?? "",
			state: payload.state ?? "",
			zipCode: payload.cep.replace(/\D/g, ""),
		};
	}
}
