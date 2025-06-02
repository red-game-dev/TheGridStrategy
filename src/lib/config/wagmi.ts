import { cookieStorage, createStorage } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import {
	mainnet,
	arbitrum,
	avalanche,
	base,
	optimism,
	polygon,
	flare
} from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { PUBLIC_REOWN_PROJECT_ID } from '$env/static/public';

/**
 * Get project ID from environment variables
 */
export const projectId = PUBLIC_REOWN_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

if (!projectId) {
	throw new Error(
		'Project ID is not defined. Please set PUBLIC_REOWN_PROJECT_ID in your environment.'
	);
}

/**
 * Supported networks for the application
 */
export const networks = [mainnet, arbitrum, avalanche, base, optimism, polygon, flare] as [
	AppKitNetwork,
	...AppKitNetwork[]
];

/**
 * Wagmi adapter configuration
 */
export const wagmiAdapter = new WagmiAdapter({
	storage: createStorage({
		storage: cookieStorage
	}),
	ssr: false,
	projectId,
	networks
});

/**
 * Wagmi configuration
 */
export const config = wagmiAdapter.wagmiConfig;
