import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { WalletState } from '$lib/types';
import type { Hex } from 'viem';
import { getNetworkNamesByChainId } from '$lib/utils/helpers';

/**
 * Wallet connection state store with proper initialization
 */
function createWalletStore() {
	const { subscribe, set, update } = writable<WalletState>({
		isConnected: false,
		address: undefined,
		chainId: undefined,
		isConnecting: false,
		error: undefined,
		balance: undefined,
		ensName: undefined,
		networkName: undefined
	});

	const store = {
		subscribe,

		/**
		 * Initialize wallet state from existing connection and set up listeners
		 */
		initialize: async () => {
			if (!browser) return;

			try {
				const { getAccount, getBalance, getEnsName } = await import('@wagmi/core');
				const { config } = await import('$lib/config/wagmi');

				const account = getAccount(config);
				if (account.isConnected && account.address) {
					const [balance, ensName] = await Promise.allSettled([
						getBalance(config, { address: account.address }),
						getEnsName(config, { address: account.address })
					]);

					const networkName = getNetworkNamesByChainId(account?.chainId || 1) as string;

					update((state) => ({
						...state,
						isConnected: true,
						address: account.address,
						chainId: account.chainId,
						isConnecting: false,
						error: undefined,
						balance: balance.status === 'fulfilled' ? balance.value : undefined,
						ensName: ensName.status === 'fulfilled' ? ensName.value : undefined,
						networkName
					}));
				}

				await setupAppKitListeners();
			} catch (error) {
				console.error('Failed to initialize wallet state:', error);
				store.setError(error instanceof Error ? error.message : 'Initialization failed');
			}
		},

		/**
		 * Set wallet as connected with comprehensive account info
		 */
		setConnected: async (address: Hex, chainId: number) => {
			try {
				const { getBalance, getEnsName } = await import('@wagmi/core');
				const { config } = await import('$lib/config/wagmi');

				const [balance, ensName] = await Promise.allSettled([
					getBalance(config, { address }),
					getEnsName(config, { address })
				]);

				const networkName = getNetworkNamesByChainId(chainId) as string;

				update((state) => ({
					...state,
					isConnected: true,
					address,
					chainId,
					isConnecting: false,
					error: undefined,
					balance: balance.status === 'fulfilled' ? balance.value : undefined,
					ensName: ensName.status === 'fulfilled' ? ensName.value : undefined,
					networkName
				}));
			} catch {
				update((state) => ({
					...state,
					isConnected: true,
					address,
					chainId,
					isConnecting: false,
					error: undefined,
					networkName: getNetworkNamesByChainId(chainId) as string
				}));
			}
		},

		/**
		 * Set wallet as disconnected and clear all data
		 */
		setDisconnected: () =>
			set({
				isConnected: false,
				address: undefined,
				chainId: undefined,
				isConnecting: false,
				error: undefined,
				balance: undefined,
				ensName: undefined,
				networkName: undefined
			}),

		/**
		 * Set connecting state
		 */
		setConnecting: (isConnecting: boolean) =>
			update((state) => ({
				...state,
				isConnecting,
				error: isConnecting ? undefined : state.error
			})),

		/**
		 * Set wallet error
		 */
		setError: (error: string) =>
			update((state) => ({
				...state,
				error,
				isConnecting: false
			})),

		/**
		 * Update chain ID and related network info
		 */
		setChainId: (chainId: number) =>
			update((state) => ({
				...state,
				chainId,
				networkName: getNetworkNamesByChainId(chainId) as string
			})),

		/**
		 * Update balance
		 */
		setBalance: (balance: { value: bigint; decimals: number; formatted: string; symbol: string }) =>
			update((state) => ({
				...state,
				balance
			})),

		/**
		 * Clear error
		 */
		clearError: () =>
			update((state) => ({
				...state,
				error: undefined
			})),

		/**
		 * Refresh account data (balance, ENS, etc.)
		 * FIXED: Use store reference instead of 'this'
		 */
		refresh: async () => {
			try {
				let currentState: WalletState;
				const unsubscribe = subscribe((state) => {
					currentState = state;
				});
				unsubscribe();

				if (currentState!.isConnected && currentState!.address && currentState!.chainId) {
					await store.setConnected(currentState!.address as Hex, currentState!.chainId);
				}
			} catch (error) {
				console.error('Failed to refresh wallet data:', error);
			}
		}
	};

	return store;
}

/**
 * Set up AppKit event listeners for state synchronization
 */
async function setupAppKitListeners() {
	try {
		const { modal } = await import('$lib/config/appKit');

		if (!modal) return;

		modal.subscribeState((state) => {
			console.log('AppKit state changed:', state);

			if (state.open === false && state.selectedNetworkId) {
				walletStore.refresh();
			}
		});

		modal.subscribeAccount(async (account) => {
			console.log('AppKit account changed:', account);

			if (account.isConnected && account.address) {
				try {
					const { getAccount } = await import('@wagmi/core');
					const { config } = await import('$lib/config/wagmi');
					const wagmiAccount = getAccount(config);
					const chainId = wagmiAccount.chainId || 1;

					walletStore.setConnected(account.address as Hex, chainId);
				} catch {
					walletStore.setConnected(account.address as Hex, 1);
				}
			} else {
				walletStore.setDisconnected();
			}
		});
	} catch (error) {
		console.error('Failed to setup AppKit listeners:', error);
	}
}

export const walletStore = createWalletStore();
