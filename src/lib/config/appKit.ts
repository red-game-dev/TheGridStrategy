import { createAppKit } from '@reown/appkit/react';
import { wagmiAdapter, projectId, networks } from './wagmi.js';
import { mainnet } from '@reown/appkit/networks';

/**
 * App metadata for AppKit
 */
const metadata = {
	name: 'Grid Strategy',
	description: 'Automated grid trading strategy on multiple blockchains',
	url: 'https://the-grid-strategy-5lanl7ldc-redeemer-paces-projects.vercel.app', // origin must match your domain & subdomain
	icons: ['https://assets.reown.com/reown-profile-pic.png']
};

/**
 * Create and configure AppKit modal
 */
export const modal = createAppKit({
	adapters: [wagmiAdapter],
	projectId,
	networks,
	defaultNetwork: mainnet,
	metadata,
	features: {
		analytics: true
	}
});
