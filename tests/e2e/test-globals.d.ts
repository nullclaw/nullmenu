export {};

declare global {
	interface InkLifecycleTelemetry {
		requestDeviceCalls: number;
		configureCalls: number[];
		unconfigureCalls: number;
		configuredDevice: number | null;
		destroyedDevices: number[];
		framesByDevice: Record<number, number>;
		flowStrokes: number;
		releaseFirstDevice: () => void;
	}

	interface Window {
		/** Mutable browser-side telemetry installed only by the WebGPU lifecycle tests. */
		__inkTest: InkLifecycleTelemetry;
	}
}
