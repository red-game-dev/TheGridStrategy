import { writable } from 'svelte/store';
import type {
	DotrainOrderGui,
	GuiSelectTokensCfg,
	GuiFieldDefinitionCfg,
	GuiDepositCfg,
	OrderIOCfg,
	TokenInfo,
	GuiState
} from '$lib/types';

/**
 * GUI instance and related data store
 */
function createGuiStore() {
	const { subscribe, set, update } = writable<GuiState>({
		gui: null,
		selectTokens: [],
		fieldDefinitions: [],
		fieldDefinitionsWithDefaults: [],
		deposits: [],
		tokenInputs: [],
		tokenOutputs: [],
		allTokenInfos: [],
		networkKey: '',
		isLoading: false,
		error: null
	});

	return {
		subscribe,

		/**
		 * Set GUI instance
		 */
		setGui: (gui: DotrainOrderGui | null) => update((state) => ({ ...state, gui })),

		/**
		 * Set select tokens configuration
		 */
		setSelectTokens: (selectTokens: GuiSelectTokensCfg[]) =>
			update((state) => ({ ...state, selectTokens })),

		/**
		 * Set field definitions
		 */
		setFieldDefinitions: (
			fieldDefinitions: GuiFieldDefinitionCfg[],
			withDefaults: GuiFieldDefinitionCfg[]
		) =>
			update((state) => ({
				...state,
				fieldDefinitions,
				fieldDefinitionsWithDefaults: withDefaults
			})),

		/**
		 * Set deposits configuration
		 */
		setDeposits: (deposits: GuiDepositCfg[]) => update((state) => ({ ...state, deposits })),

		/**
		 * Set token I/O configuration
		 */
		setTokenIO: (tokenInputs: OrderIOCfg[], tokenOutputs: OrderIOCfg[]) =>
			update((state) => ({ ...state, tokenInputs, tokenOutputs })),

		/**
		 * Set all token infos
		 */
		setAllTokenInfos: (allTokenInfos: TokenInfo[]) =>
			update((state) => ({ ...state, allTokenInfos })),

		/**
		 * Set network key
		 */
		setNetworkKey: (networkKey: string) => update((state) => ({ ...state, networkKey })),

		/**
		 * Set loading state
		 */
		setLoading: (isLoading: boolean) => update((state) => ({ ...state, isLoading })),

		/**
		 * Set error
		 */
		setError: (error: string | null) => update((state) => ({ ...state, error })),

		/**
		 * Reset GUI state
		 */
		reset: () =>
			set({
				gui: null,
				selectTokens: [],
				fieldDefinitions: [],
				fieldDefinitionsWithDefaults: [],
				deposits: [],
				tokenInputs: [],
				tokenOutputs: [],
				allTokenInfos: [],
				networkKey: '',
				isLoading: false,
				error: null
			})
	};
}

export const guiStore = createGuiStore();
