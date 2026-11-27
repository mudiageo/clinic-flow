import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { initializeAppCheck, CustomProvider } from 'firebase/app-check';
import {
	getRemoteConfig,
	fetchAndActivate,
	getString,
	getBoolean,
	getNumber,
	type RemoteConfig
} from 'firebase/remote-config';
import {
	getAI,
	getGenerativeModel,
	GoogleAIBackend,
	InferenceMode,
	type ModelParams
} from 'firebase/ai';

export interface FirebaseClientState {
	app: FirebaseApp | null;
	ai: unknown;
	appCheck: unknown;
	remoteConfig: RemoteConfig | null;
	isInitialized: boolean;
	error: string | null;
}

let clientState: FirebaseClientState = {
	app: null,
	ai: null,
	appCheck: null,
	remoteConfig: null,
	isInitialized: false,
	error: null
};

// Safe access to environment configuration
const env =
	typeof window !== 'undefined'
		? (window as unknown as { __ENV?: Record<string, string> }).__ENV || {}
		: {};

function getEnvVar(key: string, fallback: string = ''): string {
	if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
		return import.meta.env[key] as string;
	}
	if (env[key]) {
		return env[key];
	}
	return fallback;
}

export function initFirebaseClient(): FirebaseClientState {
	if (clientState.isInitialized && clientState.app) {
		return clientState;
	}

	const apiKey = getEnvVar('PUBLIC_FIREBASE_API_KEY');
	const projectId = getEnvVar('PUBLIC_FIREBASE_PROJECT_ID');

	if (!apiKey || !projectId) {
		clientState.error = 'Firebase configuration is incomplete. Running in local simulation mode.';
		return clientState;
	}

	try {
		const config = {
			apiKey,
			authDomain: getEnvVar('PUBLIC_FIREBASE_AUTH_DOMAIN', `${projectId}.firebaseapp.com`),
			projectId,
			storageBucket: getEnvVar('PUBLIC_FIREBASE_STORAGE_BUCKET', `${projectId}.appspot.com`),
			messagingSenderId: getEnvVar('PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
			appId: getEnvVar('PUBLIC_FIREBASE_APP_ID')
		};

		const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];

		// Initialize App Check (accepts debug tokens)
		let appCheckInstance: unknown = null;
		if (typeof window !== 'undefined') {
			const debugToken = getEnvVar('PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN');
			if (debugToken) {
				(
					window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }
				).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
			}
			try {
				appCheckInstance = initializeAppCheck(app, {
					provider: new CustomProvider({
						getToken: () =>
							Promise.resolve({
								token: debugToken || 'demo-debug-token',
								expireTimeMillis: Date.now() + 3600000
							})
					}),
					isTokenAutoRefreshEnabled: true
				});
			} catch (e) {
				console.warn('[Firebase AppCheck] Setup warning:', e);
			}
		}

		// Remote Config setup
		let remoteConfig: RemoteConfig | null = null;
		if (typeof window !== 'undefined') {
			try {
				remoteConfig = getRemoteConfig(app);
				remoteConfig.settings.minimumFetchIntervalMillis = 60000;
				remoteConfig.defaultConfig = {
					hybrid_ai_enabled: true,
					cloud_fallback_model: 'gemini-2.5-flash',
					max_on_device_input_chars: 4000,
					allow_cloud_escalation: true
				};
				void fetchAndActivate(remoteConfig);
			} catch (e) {
				console.warn('[Firebase RemoteConfig] Setup warning:', e);
			}
		}

		// Firebase AI Logic
		const ai = getAI(app, { backend: new GoogleAIBackend() });

		clientState = {
			app,
			ai,
			appCheck: appCheckInstance,
			remoteConfig,
			isInitialized: true,
			error: null
		};
	} catch (err) {
		console.error('[Firebase AI Init Error]', err);
		clientState.error = err instanceof Error ? err.message : 'Failed to initialize Firebase AI';
	}

	return clientState;
}

export function getRemoteConfigValue<T extends string | number | boolean>(
	key: string,
	defaultValue: T
): T {
	const rc = clientState.remoteConfig;
	if (!rc) return defaultValue;

	if (typeof defaultValue === 'boolean') {
		return getBoolean(rc, key) as T;
	}
	if (typeof defaultValue === 'number') {
		return getNumber(rc, key) as T;
	}
	return (getString(rc, key) || defaultValue) as T;
}

export interface HybridExecutionMetadata {
	source: 'ON_DEVICE' | 'IN_CLOUD' | 'SERVER_FALLBACK';
	durationMs: number;
	redactedPiiCount: number;
	modelUsed: string;
	timestamp: number;
}

export interface HybridGenerateOptions {
	systemInstruction?: string;
	cloudModel?: string;
	mode?: InferenceMode;
	inCloudParams?: Record<string, unknown>;
	onDeviceParams?: Record<string, unknown>;
}

/**
 * Creates a configured hybrid GenerativeModel from Firebase AI Logic.
 */
export function getHybridGenerativeModel(options: HybridGenerateOptions = {}): unknown {
	const { ai } = initFirebaseClient();
	if (!ai) return null;

	const fallbackModel =
		options.cloudModel || getRemoteConfigValue('cloud_fallback_model', 'gemini-2.5-flash');

	const modelParams: ModelParams = {
		model: fallbackModel,
		mode: options.mode ?? InferenceMode.PREFER_ON_DEVICE
	};

	if (options.systemInstruction) {
		modelParams.systemInstruction = options.systemInstruction;
	}

	if (options.inCloudParams) {
		(modelParams as unknown as Record<string, unknown>).inCloudParams = options.inCloudParams;
	}

	if (options.onDeviceParams) {
		(modelParams as unknown as Record<string, unknown>).onDeviceParams = options.onDeviceParams;
	}

	return getGenerativeModel(ai, modelParams);
}
