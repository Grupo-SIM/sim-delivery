import { DomainError } from "@/shared/errors";
import type { CepReturn } from "../dtos";
import { CepErrors } from "../errors";

interface ViaCepResponse {
	cep?: string;
	logradouro?: string;
	bairro?: string;
	localidade?: string;
	uf?: string;
	erro?: boolean;
}

interface BrasilApiCepResponse {
	location?: {
		coordinates?: {
			longitude?: string;
			latitude?: string;
		};
	};
}

/** Resolves address fields through ViaCEP and supplements delivery coordinates with Brasil API. */
export class LookupCep {
	async execute(rawCep: string): Promise<CepReturn> {
		const cep = rawCep.replace(/\D/g, "");
		if (cep.length !== 8) {
			throw new DomainError(CepErrors.INVALID_CEP);
		}

		let response: Response;
		let payload: ViaCepResponse;
		try {
			response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
			payload = (await response.json()) as ViaCepResponse;
		} catch {
			throw new DomainError(CepErrors.CEP_NOT_FOUND);
		}

		if (!response.ok || payload.erro || !payload.cep) {
			throw new DomainError(CepErrors.CEP_NOT_FOUND);
		}

		let latitude: number | null = null;
		let longitude: number | null = null;
		try {
			const coordinatesResponse = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
			if (coordinatesResponse.ok) {
				const coordinatesPayload = (await coordinatesResponse.json()) as BrasilApiCepResponse;
				const coordinates = coordinatesPayload.location?.coordinates;
				if (coordinates?.latitude !== undefined && coordinates?.longitude !== undefined) {
					const nextLatitude = Number(coordinates.latitude);
					const nextLongitude = Number(coordinates.longitude);
					latitude = Number.isFinite(nextLatitude) ? nextLatitude : null;
					longitude = Number.isFinite(nextLongitude) ? nextLongitude : null;
				}
			}
		} catch {
			// A coordinate lookup must not prevent address lookup through ViaCEP.
		}

		return {
			addressLine: payload.logradouro ?? "",
			city: payload.localidade ?? "",
			complement: "",
			latitude,
			longitude,
			neighborhood: payload.bairro ?? "",
			state: payload.uf ?? "",
			zipCode: payload.cep.replace(/\D/g, ""),
		};
	}
}
