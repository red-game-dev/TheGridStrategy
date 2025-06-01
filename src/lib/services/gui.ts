import { DotrainOrderGui } from '@rainlanguage/orderbook';
import type {
	DotrainOrderGui as DotrainOrderGuiType,
	WasmEncodedResult,
} from '$lib/types';

/**
 * Initialize GUI with enhanced error handling and token pre-population
 * @param dotrain - Strategy configuration string
 * @param deploymentKey - Selected deployment network
 * @param stateFromUrl - Optional serialized state from URL
 * @param pushGuiStateToUrlHistory - Function to update URL with state
 * @returns Promise resolving to GUI instance and error status
 */
export async function handleGuiInitialization(
	dotrain: string,
	deploymentKey: string,
	stateFromUrl: string | null,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	pushGuiStateToUrlHistory: (...args: any[]) => void
): Promise<{ gui: DotrainOrderGuiType | null; error: string | null }> {
	try {
		console.log('Initializing GUI with deployment:', deploymentKey);

		const gui = new DotrainOrderGui();
		let result: WasmEncodedResult<void>;

		if (stateFromUrl) {
			try {
				result = await gui.deserializeState(dotrain, stateFromUrl, pushGuiStateToUrlHistory);
				if (result.error) {
					throw new Error(result.error.msg);
				}
			} catch {
				result = await gui.chooseDeployment(dotrain, deploymentKey, pushGuiStateToUrlHistory);
				if (result.error) {
					throw new Error(result.error.msg);
				}
			}
		} else {
			result = await gui.chooseDeployment(dotrain, deploymentKey, pushGuiStateToUrlHistory);
			if (result.error) {
				throw new Error(result.error.msg);
			}
		}

		return { gui, error: null };
	} catch (error) {
		console.error('GUI initialization failed:', error);
		return {
			gui: null,
			error: error instanceof Error ? error.message : 'Could not initialize deployment form.'
		};
	}
}

/**
 * Load strategy details from dotrain configuration
 * @param dotrain - Strategy configuration string
 * @returns Promise resolving to strategy details
 */
export async function loadStrategyDetails(dotrain: string) {
	try {
		const strategyResult = await DotrainOrderGui.getStrategyDetails(dotrain);
		if (strategyResult.error) {
			throw new Error(strategyResult.error.msg);
		}
		return strategyResult.value;
	} catch (error) {
		console.error('Failed to load strategy details:', error);
		throw error;
	}
}

/**
 * Load deployment options from dotrain configuration
 * @param dotrain - Strategy configuration string
 * @returns Promise resolving to deployment options
 */
export async function loadDeploymentDetails(dotrain: string) {
	try {
		const deploymentsResult = await DotrainOrderGui.getDeploymentDetails(dotrain);
		if (deploymentsResult.error) {
			throw new Error(deploymentsResult.error.msg);
		}

		const deploymentEntries = Array.from(deploymentsResult.value.entries());
		return deploymentEntries.map(([key, value]) => ({ key, value }));
	} catch (error) {
		console.error('Failed to load deployment details:', error);
		throw error;
	}
}

/**
 * Get composed Rainlang code from GUI
 * @param gui - DotrainOrderGui instance
 * @returns Promise resolving to Rainlang code
 */
export async function getComposedRainlang(gui: DotrainOrderGuiType): Promise<string> {
	try {
		const result = await gui.getComposedRainlang();
		if (result.error) {
			throw new Error(result.error.msg);
		}
		return result.value;
	} catch (error) {
		console.error('Failed to get composed Rainlang:', error);
		throw error;
	}
}

/**
 * Prepare deployment transaction arguments
 * @param gui - DotrainOrderGui instance
 * @param address - Wallet address
 * @returns Promise resolving to transaction arguments
 */
export async function prepareDeploymentTransaction(gui: DotrainOrderGuiType, address: string) {
	try {
		const result = await gui.getDeploymentTransactionArgs(address);
		if (result.error) {
			throw new Error(result.error.msg);
		}
		return result.value;
	} catch (error) {
		console.error('Failed to prepare deployment transaction:', error);
		throw error;
	}
}
