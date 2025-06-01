import type { Token, NetworkConfig } from '$lib/types';
import type { Hex } from 'viem';

/**
 * Available tokens for trading
 */
export const TOKENS: Token[] = [
	{
		name: 'Bridged USDC (Stargate)',
		symbol: 'USDC.e',
		address: '0xfbda5f676cb37624f28265a144a48b0d6e87d3b6' as Hex,
		decimals: 6
	},
	{
		name: 'Bridged USDT (Stargate)',
		symbol: 'USDT.e',
		address: '0x0b38e83b86d491735feaa0a791f65c2b99535396' as Hex,
		decimals: 6
	},
	{
		name: 'Staked FLR',
		symbol: 'sFLR',
		address: '0x12e605bc104e93b45e1ad99f9e555f659051c2bb' as Hex,
		decimals: 18
	},
	{
		name: 'Wrapped FLR',
		symbol: 'WFLR',
		address: '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d' as Hex,
		decimals: 18
	},
	{
		name: 'Wrapped Ether',
		symbol: 'WETH',
		address: '0x1502fa4be69d526124d453619276faccab275d3d' as Hex,
		decimals: 18
	}
] as const;

/**
 * Network configurations
 */
export const NETWORKS: Record<string, NetworkConfig> = {
	base: {
		name: 'Base',
		key: 'base',
		chainId: 8453,
		subgraphUrl: 'https://example.com/subgraph',
		currency: 'ETH'
	},
	ethereum: {
		name: 'Ethereum',
		key: 'ethereum',
		chainId: 1,
		subgraphUrl: 'https://example.com/subgraph',
		currency: 'ETH'
	},
	bsc: {
		name: 'BSC',
		key: 'bsc',
		chainId: 56,
		subgraphUrl: 'https://example.com/subgraph',
		currency: 'BNB'
	},
	polygon: {
		name: 'Polygon',
		key: 'polygon',
		chainId: 137,
		subgraphUrl: 'https://example.com/subgraph',
		currency: 'POL'
	},
	flare: {
		name: 'Flare',
		key: 'flare',
		chainId: 14,
		subgraphUrl: 'https://example.com/subgraph',
		currency: 'FLR'
	}
} as const;

/**
 * Default deployment network
 */
export const DEFAULT_DEPLOYMENT = 'flare';

/**
 * Grid strategy dotrain file path
 */
export const GRID_STRATEGY_PATH =
	'https://raw.githubusercontent.com/rainlanguage/rain.strategies/9e24aef2dd972a63b35cf59d8ab91ed2a9b01c69/src/grid.rain';
