export interface StoreHours {
	closed: boolean;
	closesAt: string | null;
	opensAt: string | null;
	weekday: string | number;
}
