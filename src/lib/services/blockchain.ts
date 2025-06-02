import { sendTransaction } from '@wagmi/core';
import { config } from '$lib/config/wagmi';
import type { Hex } from 'viem';

/**
 * Send a blockchain transaction
 * @param data - Transaction calldata
 * @param to - Recipient address
 * @returns Promise resolving to transaction hash
 */
export async function sendBlockchainTransaction(data: Hex, to: `0x${string}`): Promise<string> {
	try {
		const hash = await sendTransaction(config, {
			data,
			to
		});
		return hash;
	} catch (error) {
		console.error('Transaction failed:', error);
		throw new Error(error instanceof Error ? error.message : 'Transaction failed');
	}
}

/**
 * Send approval transaction for token spending
 * @param tokenAddress - Token contract address
 * @param approvalCalldata - Approval transaction calldata
 * @returns Promise resolving to transaction hash
 */
export async function sendApprovalTransaction(
	tokenAddress: string,
	approvalCalldata: Hex
): Promise<string> {
	try {
		return await sendBlockchainTransaction(approvalCalldata, tokenAddress as `0x${string}`);
	} catch (error) {
		console.error('Approval transaction failed:', error);
		throw new Error(
			error instanceof Error ? `Approval failed: ${error.message}` : 'Token approval failed'
		);
	}
}

/**
 * Send deployment transaction
 * @param orderbookAddress - Orderbook contract address
 * @param deploymentCalldata - Deployment transaction calldata
 * @returns Promise resolving to transaction hash
 */
export async function sendDeploymentTransaction(
	orderbookAddress: string,
	deploymentCalldata: Hex
): Promise<string> {
	try {
		return await sendBlockchainTransaction(deploymentCalldata, orderbookAddress as `0x${string}`);
	} catch (error) {
		console.error('Deployment transaction failed:', error);
		throw new Error(
			error instanceof Error ? `Deployment failed: ${error.message}` : 'Strategy deployment failed'
		);
	}
}
