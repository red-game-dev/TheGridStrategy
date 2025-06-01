import type { GetEnsNameReturnType, Hex } from 'viem';
import type {
	DotrainOrderGui,
	GuiDepositCfg,
	GuiFieldDefinitionCfg,
	GuiSelectTokensCfg,
	NameAndDescriptionCfg,
	OrderIOCfg,
	TokenInfo,
} from '@rainlanguage/orderbook';
import type { StrategyType } from '$lib/strategies';

/**
 * Token information interface for the application
 */
export interface Token {
	/** Human-readable name of the token */
	name: string;
	/** Token symbol (e.g., 'USDC', 'WFLR') */
	symbol: string;
	/** Contract address as hexadecimal string */
	address: Hex;
	/** Number of decimal places for the token */
	decimals: number;
}

/**
 * Field metadata for dynamic rendering
 */
export interface FieldMetadata {
	binding: string;
	inputType: 'number' | 'text' | 'select';
	placeholder: string;
	helpText: string;
	step?: string;
	min?: string;
	max?: string;
	validation?: {
		required: boolean;
		customMessage?: string;
	};
}

/**
 * Network configuration mapping
 */
export interface NetworkConfig {
	/** Display name for the network */
	name: string;
	/** Network identifier key */
	key: string;
	/** Chain ID for the network */
	chainId: number;
	/** Subgraph URL for this network */
	subgraphUrl: string;
	/** Native currency symbol */
	currency: string;
}

/**
 * Deployment transaction preparation result
 */
export interface DeploymentTransactionArgs {
	/** Token approval transactions needed before deployment */
	approvals: Array<{
		/** Token contract address */
		token: string;
		/** Approval transaction calldata */
		calldata: Hex;
	}>;
	/** Main deployment transaction calldata */
	deploymentCalldata: Hex;
	/** Orderbook contract address */
	orderbookAddress: string;
	/** Target chain ID for deployment */
	chainId: number;
}

/**
 * Form validation state
 */
export interface ValidationState {
	/** Whether all required fields are valid */
	isValid: boolean;
	/** Field-specific error messages */
	errors: Record<string, string[]>;
	/** Whether form is currently being validated */
	isValidating: boolean;
}

/**
 * Strategy deployment state
 */
export interface DeploymentState {
	/** Whether deployment is in progress */
	isDeploying: boolean;
	/** Current deployment step */
	currentStep: 'idle' | 'approving' | 'deploying' | 'success' | 'error';
	/** Transaction hash if successful */
	transactionHash?: string;
	/** Explorer URL for viewing the strategy */
	explorerUrl?: string;
	/** Error message if deployment failed */
	error?: string;
}

/**
 * Wallet connection state
 */
export interface WalletState {
	/** Whether wallet is connected */
	isConnected: boolean;

	/** Connected wallet address */
	address?: string;

	/** Current chain ID */
	chainId?: number;

	/** Whether connection is in progress */
	isConnecting: boolean;

	/** Connection or operation error */
	error?: string;

	/** Account balance information */
	balance?: {
		value: bigint;
		decimals: number;
		formatted: string;
		symbol: string;
	};

	/** ENS name if available */
	ensName?: GetEnsNameReturnType | undefined;

	/** Human-readable network name */
	networkName?: string;
}


export interface StrategyDeployment {
	key: string;
	value: NameAndDescriptionCfg | undefined;
}

/**
 * Strategy configuration state
 */
export interface StrategyState {
	strategyKey: StrategyType;
	/** Selected deployment network */
	selectedDeployment: string;
	/** Strategy details from GUI */
	strategyDetails: NameAndDescriptionCfg | null;
	/** Available deployments */
	deployments: StrategyDeployment[];
	/** Whether all tokens are selected */
	allTokensSelected: boolean;
	/** Current field values */
	fieldValues: Record<string, string>;
	/** Maximum potential returns */
	maxReturns: string;
	/** Whether advanced options are shown */
	showAdvancedOptions: boolean;
}

export interface GuiState {
	gui: DotrainOrderGui | null;
	selectTokens: GuiSelectTokensCfg[];
	fieldDefinitions: GuiFieldDefinitionCfg[];
	fieldDefinitionsWithDefaults: GuiFieldDefinitionCfg[];
	deposits: GuiDepositCfg[];
	tokenInputs: OrderIOCfg[];
	tokenOutputs: OrderIOCfg[];
	allTokenInfos: TokenInfo[];
	networkKey: string;
	isLoading: boolean;
	error: string | null;
}

/**
 * GUI initialization result
 */
export interface GuiInitializationResult {
	/** Initialized GUI instance */
	gui: DotrainOrderGui | null;
	/** Error message if initialization failed */
	error: string | null;
}

/**
 * Explorer link configuration
 */
export interface ExplorerConfig {
	/** Explorer URL */
	url: string;
	/** Chain ID */
	chainId: number;
	/** Explorer name (e.g., 'Etherscan', 'BaseScan') */
	name: string;
}

/**
 * Chart data point for grid visualization
 */
export interface ChartDataPoint {
	/** X-axis value (level) */
	x: number;
	/** Y-axis value (price) */
	y: number;
	/** Additional data for tooltips */
	total: number;
	/** Level of grid */
	level: number;
}
  
/**
 * Re-export types from @rainlanguage/orderbook for convenience
 */
export type {
	DotrainOrderGui,
	GuiDepositCfg,
	GuiFieldDefinitionCfg,
	GuiSelectTokensCfg,
	NameAndDescriptionCfg,
	OrderIOCfg,
	TokenInfo,
	WasmEncodedResult
} from '@rainlanguage/orderbook';

/**
 * Network names mapping
 */
export const NETWORK_NAMES: Record<string, string> = {
	ethereum: 'Ethereum',
	base: 'Base',
	polygon: 'Polygon',
	bsc: 'BSC',
	flare: 'Flare'
} as const;


export const NETWORK_NAMES_BY_CHAIN_ID: Record<number, string> = {
	1: 'Ethereum',
	8453: 'Base',
	137: 'Polygon',
	10: 'Optimism',
	42161: 'Arbitrum',
	43114: 'Avalanche',
	14: 'Flare',
	56: 'BSC'
};

/**
 * Block explorer names mapping
 */
export const EXPLORER_NAMES: Record<number, string> = {
	1: 'Etherscan',
	8453: 'BaseScan',
	137: 'PolygonScan',
	56: 'BscScan',
	14: 'FlareExplorer'
} as const;