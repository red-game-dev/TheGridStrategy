import { writable, derived } from 'svelte/store';
import type { ValidationState } from '$lib/types';
import { strategyStore } from './strategy';
import { deploymentStore } from './deployment';
import { walletStore } from './wallet';
import { strategyRegistry } from '$lib/strategies';
import { debugLog } from '$lib/config/debug';

/**
 * Enhanced validation store with strategy configuration support
 */
function createValidationStore() {
	const { subscribe, set, update } = writable<ValidationState>({
		isValid: false,
		errors: {},
		isValidating: false
	});

	return {
		subscribe,

		/**
		 * Set validation state with both isValid flag and errors
		 */
		setValidation: (isValid: boolean, errors: Record<string, string[]> = {}) => {
			debugLog.log('Setting validation:', { isValid, errors });
			update((state) => ({
				...state,
				isValid,
				errors,
				isValidating: false
			}));
		},

		/**
		 * Set validating state
		 */
		setValidating: (isValidating: boolean) => update((state) => ({ ...state, isValidating })),

		/**
		 * Add field error
		 */
		addFieldError: (field: string, error: string) =>
			update((state) => ({
				...state,
				errors: {
					...state.errors,
					[field]: [...(state.errors[field] || []), error]
				},
				isValid: false
			})),

		/**
		 * Set multiple field errors (from Felte) - Enhanced to handle strategy-specific validation
		 */
		setFieldErrors: (errors: Zod.ZodError) => {
			debugLog.log('Raw validation errors received:', errors);

			update((state) => {
				const normalizedErrors: Record<string, string[]> = {};

				const processErrors = (obj: Zod.ZodError, prefix = '') => {
					if (!obj || typeof obj !== 'object') return;

					Object.entries(obj).forEach(([key, value]) => {
						const fullKey = prefix ? `${prefix}.${key}` : key;

						if (typeof value === 'string' && value.trim()) {
							normalizedErrors[fullKey] = [value];
						} else if (Array.isArray(value)) {
							const validErrors = value.filter((v) => v && typeof v === 'string' && v.trim());
							if (validErrors.length > 0) {
								normalizedErrors[fullKey] = validErrors;
							}
						} else if (typeof value === 'object' && value !== null) {
							processErrors(value, fullKey);
						}
					});
				};

				processErrors(errors);

				debugLog.log('Normalized errors:', normalizedErrors);

				return {
					...state,
					errors: normalizedErrors,
					isValid: Object.keys(normalizedErrors).length === 0
				};
			});
		},

		/**
		 * Clear field errors
		 */
		clearFieldErrors: (field: string) =>
			update((state) => {
				const newErrors = { ...state.errors };
				delete newErrors[field];
				return {
					...state,
					errors: newErrors,
					isValid: Object.keys(newErrors).length === 0
				};
			}),

		/**
		 * Clear all errors
		 */
		clearAllErrors: () =>
			update((state) => ({
				...state,
				errors: {},
				isValid: false
			})),

		/**
		 * Reset validation state
		 */
		reset: () =>
			set({
				isValid: false,
				errors: {},
				isValidating: false
			})
	};
}

export const validationStore = createValidationStore();

/**
 * Enhanced derived store to check if all required fields have values
 * Now uses strategy configuration to determine required fields
 */
export const hasRequiredValues = derived([strategyStore], ([$strategy]) => {
	const strategyConfig = strategyRegistry.get($strategy.strategyKey);

	if (!strategyConfig) {
		debugLog.warn('No strategy configuration found for:', $strategy.strategyKey);
		return false;
	}

	const allFieldMetadata = strategyConfig.getAllFieldMetadata();
	const requiredFields = allFieldMetadata
		.filter((field) => field.validation?.required)
		.map((field) => field.binding);

	const fieldsToCheck =
		requiredFields.length > 0
			? requiredFields
			: ['baseline-io-ratio', 'io-ratio-growth', 'tranche-size'];

	const hasValues = fieldsToCheck.every((field) => {
		const value = $strategy.fieldValues[field];
		return value && value.trim() !== '' && value !== '0' && value !== 'NaN';
	});

	debugLog.log('hasRequiredValues check:', {
		strategyKey: $strategy.strategyKey,
		fieldValues: $strategy.fieldValues,
		requiredFields: fieldsToCheck,
		hasValues
	});

	return hasValues;
});

/**
 * Enhanced derived store to check if form can be submitted
 * Now uses strategy-aware validation
 */
export const canSubmit = derived(
	[walletStore, strategyStore, validationStore, deploymentStore, hasRequiredValues],
	([$wallet, $strategy, $validation, $deployment, $hasRequiredValues]) => {
		const walletConnected = $wallet.isConnected;
		const tokensSelected = $strategy.allTokensSelected;
		const hasValues = $hasRequiredValues;
		const formValid = $validation.isValid && Object.keys($validation.errors).length === 0;
		const notDeploying = !$deployment.isDeploying;

		debugLog.log('canSubmit check:', {
			walletConnected,
			tokensSelected,
			hasValues,
			formValid,
			notDeploying,
			validationErrors: $validation.errors,
			fieldValues: $strategy.fieldValues,
			strategyKey: $strategy.strategyKey
		});

		return walletConnected && tokensSelected && hasValues && formValid && notDeploying;
	}
);

/**
 * Enhanced derived store for form validation status display
 * Now uses strategy configuration for better messaging
 */
export const formValidationStatus = derived(
	[validationStore, hasRequiredValues, strategyStore],
	([$validation, $hasRequiredValues, $strategy]) => {
		const strategyConfig = strategyRegistry.get($strategy.strategyKey);
		const strategyName = strategyConfig?.name || 'Strategy';

		debugLog.log('formValidationStatus check:', {
			hasRequiredValues: $hasRequiredValues,
			isValid: $validation.isValid,
			errorCount: Object.keys($validation.errors).length,
			errors: $validation.errors,
			strategyKey: $strategy.strategyKey
		});

		if (!$hasRequiredValues) {
			return {
				isValid: false,
				message: `Please fill in all required ${strategyName.toLowerCase()} parameters`,
				type: 'warning'
			};
		}

		if (Object.keys($validation.errors).length > 0) {
			return {
				isValid: false,
				message: `Please fix validation errors (${Object.keys($validation.errors).length} errors)`,
				type: 'error'
			};
		}

		if ($validation.isValid && $hasRequiredValues) {
			return {
				isValid: true,
				message: `All ${strategyName.toLowerCase()} parameters are valid`,
				type: 'success'
			};
		}

		return {
			isValid: false,
			message: `Please complete the ${strategyName.toLowerCase()} form`,
			type: 'warning'
		};
	}
);

/**
 * Strategy-aware field validation helper
 */
export const getFieldValidationStatus = derived(
	[validationStore, strategyStore],
	([$validation, $strategy]) => {
		return (binding: string) => {
			const strategyConfig = strategyRegistry.get($strategy.strategyKey);
			const fieldMetadata = strategyConfig?.getFieldMetadata(binding);
			const fieldPath = `parameters.${binding}`;

			const hasError = $validation.errors[fieldPath]?.length > 0;
			const isRequired = fieldMetadata?.validation?.required ?? true;
			const currentValue = $strategy.fieldValues[binding];
			const hasValue = currentValue && currentValue.trim() !== '';

			return {
				hasError,
				isRequired,
				hasValue,
				errors: $validation.errors[fieldPath] || [],
				metadata: fieldMetadata
			};
		};
	}
);
