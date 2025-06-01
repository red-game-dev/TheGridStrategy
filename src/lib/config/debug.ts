import { dev } from '$app/environment';
import { PUBLIC_DEBUG_MODE } from '$env/static/public';

/**
 * Debug configuration based on environment
 */
export const DEBUG_CONFIG = {
	enabled: dev || PUBLIC_DEBUG_MODE === 'true',

	features: {
		logging: dev || PUBLIC_DEBUG_MODE === 'true',
		debugPanels: dev || PUBLIC_DEBUG_MODE === 'true',
		verboseErrors: dev || PUBLIC_DEBUG_MODE === 'true',
		stateLogging: dev || PUBLIC_DEBUG_MODE === 'true'
	}
};

/**
 * Debug logger that only logs in debug mode
 */
export const debugLog = {
	log: (...args: any[]) => {
		if (DEBUG_CONFIG.features.logging) {
			console.log('[DEBUG]', ...args);
		}
	},

	error: (...args: any[]) => {
		if (DEBUG_CONFIG.features.logging) {
			console.error('[DEBUG ERROR]', ...args);
		}
	},

	warn: (...args: any[]) => {
		if (DEBUG_CONFIG.features.logging) {
			console.warn('[DEBUG WARN]', ...args);
		}
	},

	group: (label: string, ...args: any[]) => {
		if (DEBUG_CONFIG.features.logging) {
			console.group(`[DEBUG] ${label}`, ...args);
		}
	},

	groupEnd: () => {
		if (DEBUG_CONFIG.features.logging) {
			console.groupEnd();
		}
	}
};

/**
 * Utility to conditionally render debug components
 */
export const shouldShowDebug = (feature?: keyof typeof DEBUG_CONFIG.features): boolean => {
	if (!DEBUG_CONFIG.enabled) return false;
	if (!feature) return true;
	return DEBUG_CONFIG.features[feature];
};
