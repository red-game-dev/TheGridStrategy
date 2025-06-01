import type { NetworkConfig } from '$lib/types';
import { NETWORK_NAMES, EXPLORER_NAMES, NETWORK_NAMES_BY_CHAIN_ID } from '$lib/types';
import { NETWORKS } from '$lib/config/constants';
import { debugLog } from '$lib/config/debug';

/**
 * Get network display name
 * @param networkKey - Network identifier
 * @returns Human-readable network name
 */
export function getNetworkName(networkKey: string): string {
	return NETWORK_NAMES[networkKey] || networkKey;
}

export function getNetworkNamesByChainId(chainId: number): string | number {
	return NETWORK_NAMES_BY_CHAIN_ID[chainId] || chainId;
}

/**
 * Get explorer name for chain ID
 * @param chainId - Blockchain chain ID
 * @returns Explorer name
 */
export function getExplorerName(chainId: number): string {
	return EXPLORER_NAMES[chainId] || 'Explorer';
}

/**
 * Get network configuration by key
 * @param networkKey - Network identifier
 * @returns Network configuration or undefined
 */
export function getNetworkConfig(networkKey: string): NetworkConfig | undefined {
	return NETWORKS[networkKey];
}

/**
 * Format address for display (show first 6 and last 4 characters)
 * @param address - Ethereum address
 * @returns Formatted address string
 */
export function formatAddress(address: string): string {
	if (!address || address.length < 10) return address;
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format number with specified decimal places
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals = 2): string {
	return value.toFixed(decimals);
}

/**
 * Enhanced debounce function with better error handling
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
	func: T,
	wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
	let timeout: ReturnType<typeof setTimeout>;
	let lastArgs: Parameters<T>;

	return (...args: Parameters<T>): Promise<ReturnType<T>> => {
		return new Promise((resolve) => {
			lastArgs = args;
			clearTimeout(timeout);

			timeout = setTimeout(() => {
				try {
					const result = func(...lastArgs);
					resolve(result);
				} catch (error) {
					debugLog.error('Debounced function error:', error);
					resolve(undefined as ReturnType<T>);
				}
			}, wait);
		});
	};
}

/**
 * Enhanced address validation with more comprehensive checks
 * @param address - Address string to validate
 * @returns True if valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
	if (!address || typeof address !== 'string') {
		return false;
	}

	const basicCheck = /^0x[a-fA-F0-9]{40}$/.test(address);

	if (!basicCheck) {
		return false;
	}

	const hex = address.slice(2);

	if (hex === '0'.repeat(40)) {
		return false;
	}

	if (hex.toLowerCase() === 'f'.repeat(40)) {
		return false;
	}

	return true;
}

/**
 * Create explorer URL for viewing strategy
 * @param networkKey - Network identifier
 * @param orderbookAddress - Orderbook contract address
 * @returns Explorer URL
 */
export function createExplorerUrl(networkKey: string, orderbookAddress: string): string {
	return `https://v2.raindex.finance/orders/${networkKey}-${orderbookAddress}`;
}

/**
 * Format balance for display with appropriate decimal places
 * @param balance - Balance object with value, decimals, formatted, and symbol
 * @param maxDecimals - Maximum decimal places to show (default: 4)
 * @returns Formatted balance string
 */
export function formatBalance(
	balance: { value: bigint; decimals: number; formatted: string; symbol: string },
	maxDecimals: number = 4
): string {
	const num = parseFloat(balance.formatted);

	if (num < 0.0001 && num > 0) {
		return num.toExponential(2);
	}

	if (num < 1) {
		return num.toFixed(Math.min(maxDecimals, 6));
	}

	if (num >= 1000) {
		return num.toLocaleString(undefined, {
			maximumFractionDigits: 2,
			minimumFractionDigits: 0
		});
	}

	return num.toLocaleString(undefined, {
		maximumFractionDigits: maxDecimals,
		minimumFractionDigits: 0
	});
}
