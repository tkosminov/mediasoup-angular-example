import { IDevice } from './Device';

declare module 'mediasoup-client' {
	export const Device: IDevice;

	export const version: string;

	export function parseScalabilityMode(scalabilityMode: any): any;
}
