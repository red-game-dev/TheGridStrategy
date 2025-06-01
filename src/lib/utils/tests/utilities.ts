/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { render, type RenderResult } from '@testing-library/svelte';
import type { ComponentProps, SvelteComponent, ComponentType } from 'svelte';
import type { GuiPresetCfg } from '@rainlanguage/orderbook';

export const mockWalletAddress = '0x1234567890123456789012345678901234567890';
export const mockTokenAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

export const createMockFormData = (overrides = {}) => ({
	baselineIoRatio: '0.5',
	ioRatioGrowth: '0.05',
	trancheSize: '100',
	secondsPerTranche: '3600',
	...overrides
});

export const createMockTokenInfo = (overrides = {}) => ({
	address: '0x1234567890123456789012345678901234567890',
	name: 'Test Token',
	symbol: 'TEST',
	decimals: 18,
	...overrides
});

export const createMockGridLevel = (overrides = {}) => ({
	level: 1,
	price: 100,
	total: 1000,
    amount: 10,
	...overrides
});

export const createMockFieldDefinition = (overrides = {}) => ({
	binding: 'test-field',
	name: 'Test Field',
	description: 'A test field',
	showCustomField: false,
	default: '',
	presets: [] as GuiPresetCfg[],
	...overrides
});

export const createMockSelectToken = (overrides = {}) => ({
	key: 'token1',
	name: 'Token to buy',
	description: 'Select the token you want to purchase',
	...overrides
});

export const createMockDeployment = (overrides = {}) => ({
	key: 'flare',
	value: {
		name: 'Flare',
		description: 'Deploy strategy on Flare',
		...overrides
	}
});

export function createMockWritableStore<T>(initialValue: T) {
	let value = initialValue;
	const subscribers = new Set<(val: T) => void>();

	const subscribe = vi.fn((run: (val: T) => void) => {
		subscribers.add(run);
		run(value);
		return vi.fn(() => {
			subscribers.delete(run);
		});
	});

	const set = vi.fn((newValue: T) => {
		value = newValue;
		subscribers.forEach((run) => run(value));
	});

	const update = vi.fn((updater: (val: T) => T) => {
		value = updater(value);
		subscribers.forEach((run) => run(value));
	});

	Object.defineProperty(subscribe, 'current', {
		get: () => value,
		enumerable: true,
		configurable: true
	});

	return {
		subscribe: subscribe as typeof subscribe & { current: T },
		set,
		update
	};
}

export const createMockGui = () => ({
	getSelectTokens: vi.fn().mockReturnValue({ error: null, value: [] }),
	getNetworkKey: vi.fn().mockReturnValue({ error: null, value: 'ethereum' }),
	getAllTokenInfos: vi.fn().mockReturnValue({ error: null, value: [] }),
	getAllFieldDefinitions: vi.fn().mockReturnValue({ error: null, value: [] }),
	getCurrentDeployment: vi.fn().mockReturnValue({
		error: null,
		value: {
			deposits: [],
			deployment: { order: { inputs: [], outputs: [] } }
		}
	}),
	areAllTokensSelected: vi.fn().mockReturnValue({ error: null, value: false }),
	hasAnyDeposit: vi.fn().mockReturnValue({ error: null, value: false }),
	hasAnyVaultId: vi.fn().mockReturnValue({ error: null, value: false }),
	getTokenInfo: vi.fn().mockReturnValue({ error: null, value: null }),
	saveSelectToken: vi.fn().mockResolvedValue(undefined),
	removeSelectToken: vi.fn().mockResolvedValue(undefined),
	getFieldValue: vi.fn().mockReturnValue({ error: null, value: '' }),
	saveFieldValue: vi.fn().mockResolvedValue(undefined),
	getDeposits: vi.fn().mockReturnValue({ error: null, value: [] }),
	saveDeposit: vi.fn().mockResolvedValue(undefined),
	getVaultIds: vi.fn().mockReturnValue({
		error: null,
		value: new Map([
			['input', {}],
			['output', {}]
		])
	}),
	setVaultId: vi.fn().mockResolvedValue(undefined)
});

export const createMockWalletStore = () => ({
	isConnected: false,
	isConnecting: false,
	address: null,
	chainId: null,
	balance: null,
	networkName: null,
	ensName: null,
	error: null
});

export const createMockStrategyStore = () => ({
	strategyKey: 'grid',
	strategyDetails: null,
	deployments: [],
	selectedDeployment: 'ethereum',
	fieldValues: {},
	maxReturns: '0',
	allTokensSelected: false,
	showAdvancedOptions: false
});

export const createMockGuiStore = () => ({
	gui: null,
	isLoading: false,
	error: null,
	selectTokens: [],
	networkKey: null,
	fieldDefinitions: [],
	fieldDefinitionsWithDefaults: [],
	allTokenInfos: [],
	deposits: [],
	tokenInputs: [],
	tokenOutputs: []
});

export const renderWithMocks = <T extends SvelteComponent>(
	component: ComponentType<T>,
	props?: ComponentProps<T>,
	options?: {
		mockStores?: boolean;
		customMocks?: Record<string, any>;
	}
): RenderResult<T> => {
	const { mockStores = true, customMocks = {} } = options || {};

	if (mockStores) {
		vi.doMock('$lib/stores/wallet', () => ({
			walletStore: createMockWritableStore({
				isConnected: false,
				address: undefined,
				chainId: undefined,
				isConnecting: false,
				error: undefined,
				balance: undefined,
				ensName: undefined,
				networkName: undefined
			})
		}));

		vi.doMock('$lib/stores/strategy', () => ({
			strategyStore: createMockWritableStore(createMockStrategyStore()),
			gridLevels: createMockWritableStore([])
		}));

		vi.doMock('$lib/stores/gui', () => ({
			guiStore: createMockWritableStore({
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
		}));

		vi.doMock('$lib/stores/validation', () => ({
			validationStore: {
				...createMockWritableStore({
					isValid: false,
					errors: {},
					isValidating: false
				}),
				setValidation: vi.fn(function (this: any, isValid, errors = {}) {
					this.set({ isValid, errors, isValidating: false });
				}),
				clearFieldErrors: vi.fn(function (this: any, field) {
					this.update((state: any) => {
						const newErrors = { ...state.errors };
						delete newErrors[field];
						return { ...state, errors: newErrors, isValid: Object.keys(newErrors).length === 0 };
					});
				}),
				addFieldError: vi.fn(function (this: any, field, error) {
					this.update((state: any) => {
						const newErrors = { ...state.errors };
						newErrors[field] = [...(newErrors[field] || []), error];
						return { ...state, errors: newErrors, isValid: false };
					});
				}),
				reset: vi.fn(function (this: any) {
					this.set({ isValid: false, errors: {}, isValidating: false });
				})
			},
			canSubmit: createMockWritableStore(false),
			hasRequiredValues: createMockWritableStore(false)
		}));
	}

	Object.entries(customMocks).forEach(([module, mock]) => {
		vi.doMock(module, () => mock);
	});

	return render(component as any, props);
};

export const waitFor = (predicate: () => boolean, timeout = 1000): Promise<void> => {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();

		const check = () => {
			if (predicate()) {
				resolve();
			} else if (Date.now() - startTime >= timeout) {
				reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
			} else {
				setTimeout(check, 10);
			}
		};

		check();
	});
};

export const createEvent = (type: string, properties: Record<string, any> = {}) => {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.assign(event, properties);
	return event;
};

export const mockAsyncOperation = <T>(result: T, delay = 0, shouldReject = false): Promise<T> => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (shouldReject) {
				reject(new Error('Mock async operation failed'));
			} else {
				resolve(result);
			}
		}, delay);
	});
};

export const cleanupMocks = () => {
	vi.clearAllMocks();
	vi.resetAllMocks();
};
