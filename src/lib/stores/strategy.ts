import { writable, derived } from 'svelte/store';
import type { StrategyState, StrategyDeployment, NameAndDescriptionCfg } from '$lib/types';
import { strategyRegistry, type StrategyType } from '$lib/strategies';
import { debugLog } from '$lib/config/debug';
import { DEFAULT_DEPLOYMENT } from '$lib/config/constants';

/**
 * Strategy store with strategy configuration support
 */
function createStrategyStore() {
	const { subscribe, set, update } = writable<StrategyState>({
		strategyKey: 'grid',
		strategyDetails: null,
		deployments: [],
		selectedDeployment: DEFAULT_DEPLOYMENT,
		fieldValues: {},
		allTokensSelected: false,
		maxReturns: '0',
		showAdvancedOptions: false
	});

	return {
		subscribe,

		/**
		 * Set the current strategy
		 */
		setStrategy: (strategyKey: StrategyType) => {
			const strategy = strategyRegistry.get(strategyKey);
			if (!strategy) {
				console.error(`Strategy '${strategyKey}' not found in registry`);
				return;
			}

			update((state) => ({
				...state,
				strategyKey,
				fieldValues: {},
				maxReturns: '0'
			}));
		},

		/**
		 * Set field value and recalculate returns
		 */
		setFieldValue: (binding: string, value: string) =>
			update((state) => {
				const newFieldValues = { ...state.fieldValues, [binding]: value };

				const strategy = strategyRegistry.get(state.strategyKey);
				let maxReturns = '0';

				if (strategy) {
					const calculations = strategy.getCalculations();
					maxReturns = calculations.calculateMaxReturns(newFieldValues).toString();
				}

				debugLog.log('Field value updated:', { binding, value, maxReturns });

				return {
					...state,
					fieldValues: newFieldValues,
					maxReturns
				};
			}),

		/**
		 * Set multiple field values
		 */
		setFieldValues: (values: Record<string, string>) =>
			update((state) => {
				const newFieldValues = { ...state.fieldValues, ...values };

				const strategy = strategyRegistry.get(state.strategyKey);
				let maxReturns = '0';

				if (strategy) {
					const calculations = strategy.getCalculations();
					maxReturns = calculations.calculateMaxReturns(newFieldValues).toString();
				}

				return {
					...state,
					fieldValues: newFieldValues,
					maxReturns
				};
			}),

		/**
		 * Calculate max returns using current strategy
		 */
		calculateMaxReturns: () =>
			update((state) => {
				const strategy = strategyRegistry.get(state.strategyKey);
				let maxReturns = '0';

				if (strategy) {
					const calculations = strategy.getCalculations();
					maxReturns = calculations.calculateMaxReturns(state.fieldValues).toString();
				}

				return { ...state, maxReturns };
			}),

		setStrategyDetails: (details: NameAndDescriptionCfg) =>
			update((state) => ({ ...state, strategyDetails: details })),
		setDeployments: (deployments: StrategyDeployment[]) =>
			update((state) => ({ ...state, deployments })),
		setSelectedDeployment: (deployment: string) =>
			update((state) => ({ ...state, selectedDeployment: deployment })),

		/**
		 * Set all tokens selected status
		 */
		setAllTokensSelected: (selected: boolean) =>
			update((state) => ({ ...state, allTokensSelected: selected })),

		/**
		 * Toggle advanced options
		 */
		toggleAdvancedOptions: () =>
			update((state) => ({ ...state, showAdvancedOptions: !state.showAdvancedOptions })),

		/**
		 * Reset strategy state
		 */
		reset: () =>
			set({
				strategyKey: 'grid',
				selectedDeployment: DEFAULT_DEPLOYMENT,
				strategyDetails: null,
				deployments: [],
				allTokensSelected: false,
				fieldValues: {},
				maxReturns: '0.00',
				showAdvancedOptions: false
			})
	};
}

export const strategyStore = createStrategyStore();

/**
 * Derived store for grid levels (strategy-specific)
 */
export const gridLevels = derived([strategyStore], ([$strategy]) => {
	const strategy = strategyRegistry.get($strategy.strategyKey);

	if (!strategy || $strategy.strategyKey !== 'grid') {
		return [];
	}

	const calculations = strategy.getCalculations();

	if (
		'calculateGridLevels' in calculations &&
		typeof calculations.calculateGridLevels === 'function'
	) {
		return calculations.calculateGridLevels($strategy.fieldValues);
	}

	return [];
});
