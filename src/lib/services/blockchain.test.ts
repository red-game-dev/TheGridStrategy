import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	sendBlockchainTransaction,
	sendApprovalTransaction,
	sendDeploymentTransaction
} from './blockchain';
import { sendTransaction } from '@wagmi/core';
import type { Hex } from 'viem';

const mockSendTransaction = vi.mocked(sendTransaction);

vi.mock('@wagmi/core', () => ({
	sendTransaction: vi.fn()
}));

vi.mock('$lib/config/wagmi', () => ({
	config: {
		mockWagmiConfig: true
	}
}));

describe('Blockchain Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('sendBlockchainTransaction', () => {
		it('should send transaction successfully', async () => {
			const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
			mockSendTransaction.mockResolvedValue(mockHash);

			const data = '0xabcdef' as `0x${string}`;
			const to = '0x1234567890123456789012345678901234567890' as `0x${string}`;

			const result = await sendBlockchainTransaction(data, to);

			expect(result).toBe(mockHash);
			expect(mockSendTransaction).toHaveBeenCalledWith({ mockWagmiConfig: true }, { data, to });
		});

		it('should handle transaction failure', async () => {
			const errorMessage = 'Transaction failed: insufficient funds';
			mockSendTransaction.mockRejectedValue(new Error(errorMessage));

			const data = '0xabcdef' as `0x${string}`;
			const to = '0x1234567890123456789012345678901234567890' as `0x${string}`;

			await expect(sendBlockchainTransaction(data, to)).rejects.toThrow(
				'Transaction failed: insufficient funds'
			);
		});

		it('should handle unknown error types', async () => {
			mockSendTransaction.mockRejectedValue('Unknown error');

			const data = '0xabcdef' as `0x${string}`;
			const to = '0x1234567890123456789012345678901234567890' as `0x${string}`;

			await expect(sendBlockchainTransaction(data, to)).rejects.toThrow('Transaction failed');
		});

		it('should handle network errors', async () => {
			mockSendTransaction.mockRejectedValue(new Error('Network error'));

			const data = '0xabcdef' as `0x${string}`;
			const to = '0x1234567890123456789012345678901234567890' as `0x${string}`;

			await expect(sendBlockchainTransaction(data, to)).rejects.toThrow('Network error');
		});
	});

	describe('sendApprovalTransaction', () => {
		it('should send approval transaction successfully', async () => {
			const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
			mockSendTransaction.mockResolvedValue(mockHash);

			const tokenAddress = '0x1234567890123456789012345678901234567890';
			const approvalCalldata =
				'0x095ea7b3000000000000000000000000spender000000000000000000000000000000000000000000000000000000000000000000000000000000000000005af3107a4000' as `0x${string}`;

			const result = await sendApprovalTransaction(tokenAddress, approvalCalldata);

			expect(result).toBe(mockHash);
			expect(mockSendTransaction).toHaveBeenCalledWith(
				{ mockWagmiConfig: true },
				{
					data: approvalCalldata,
					to: tokenAddress
				}
			);
		});

		it('should handle approval transaction failure', async () => {
			const errorMessage = 'ERC20: approve to the zero address';
			mockSendTransaction.mockRejectedValue(new Error(errorMessage));

			const tokenAddress = '0x1234567890123456789012345678901234567890';
			const approvalCalldata = '0xabcdef' as `0x${string}`;

			await expect(sendApprovalTransaction(tokenAddress, approvalCalldata)).rejects.toThrow(
				'Approval failed: ERC20: approve to the zero address'
			);
		});

		it('should handle generic approval errors', async () => {
			mockSendTransaction.mockRejectedValue('Generic error');

			const tokenAddress = '0x1234567890123456789012345678901234567890';
			const approvalCalldata = '0xabcdef' as `0x${string}`;

			await expect(sendApprovalTransaction(tokenAddress, approvalCalldata)).rejects.toThrow(
				'Approval failed: Transaction failed'
			);
		});

		it('should handle user rejection', async () => {
			mockSendTransaction.mockRejectedValue(new Error('User rejected the request'));

			const tokenAddress = '0x1234567890123456789012345678901234567890';
			const approvalCalldata = '0xabcdef' as `0x${string}`;

			await expect(sendApprovalTransaction(tokenAddress, approvalCalldata)).rejects.toThrow(
				'Approval failed: User rejected the request'
			);
		});
	});

	describe('sendDeploymentTransaction', () => {
		it('should send deployment transaction successfully', async () => {
			const mockHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
			mockSendTransaction.mockResolvedValue(mockHash);

			const orderbookAddress = '0x1234567890123456789012345678901234567890';
			const deploymentCalldata = '0xdeadbeef' as `0x${string}`;

			const result = await sendDeploymentTransaction(orderbookAddress, deploymentCalldata);

			expect(result).toBe(mockHash);
			expect(mockSendTransaction).toHaveBeenCalledWith(
				{ mockWagmiConfig: true },
				{
					data: deploymentCalldata,
					to: orderbookAddress
				}
			);
		});

		it('should handle deployment transaction failure', async () => {
			const errorMessage = 'Insufficient gas limit';
			mockSendTransaction.mockRejectedValue(new Error(errorMessage));

			const orderbookAddress = '0x1234567890123456789012345678901234567890';
			const deploymentCalldata = '0xdeadbeef' as `0x${string}`;

			await expect(sendDeploymentTransaction(orderbookAddress, deploymentCalldata)).rejects.toThrow(
				'Deployment failed: Insufficient gas limit'
			);
		});

		it('should handle generic deployment errors', async () => {
			mockSendTransaction.mockRejectedValue('Unknown deployment error');

			const orderbookAddress = '0x1234567890123456789012345678901234567890';
			const deploymentCalldata = '0xdeadbeef' as `0x${string}`;

			await expect(sendDeploymentTransaction(orderbookAddress, deploymentCalldata)).rejects.toThrow(
				'Deployment failed: Transaction failed'
			);
		});

		it('should handle contract revert errors', async () => {
			const revertError = new Error('execution reverted: Strategy already exists');
			mockSendTransaction.mockRejectedValue(revertError);

			const orderbookAddress = '0x1234567890123456789012345678901234567890';
			const deploymentCalldata = '0xdeadbeef' as `0x${string}`;

			await expect(sendDeploymentTransaction(orderbookAddress, deploymentCalldata)).rejects.toThrow(
				'Deployment failed: execution reverted: Strategy already exists'
			);
		});

		it('should handle gas estimation errors', async () => {
			const gasError = new Error('gas required exceeds allowance');
			mockSendTransaction.mockRejectedValue(gasError);

			const orderbookAddress = '0x1234567890123456789012345678901234567890';
			const deploymentCalldata = '0xdeadbeef' as `0x${string}`;

			await expect(sendDeploymentTransaction(orderbookAddress, deploymentCalldata)).rejects.toThrow(
				'Deployment failed: gas required exceeds allowance'
			);
		});
	});

	describe('Error Message Handling', () => {
		it('should preserve original error messages when they exist', async () => {
			const originalError = new Error('Very specific blockchain error');
			mockSendTransaction.mockRejectedValue(originalError);

			const data = '0xabcdef' as `0x${string}`;
			const to = '0x1234567890123456789012345678901234567890' as `0x${string}`;

			await expect(sendBlockchainTransaction(data, to)).rejects.toThrow(
				'Very specific blockchain error'
			);
		});

		it('should provide fallback messages for non-Error objects', async () => {
			mockSendTransaction.mockRejectedValue(null);

			const data = '0xabcdef' as `0x${string}`;
			const to = '0x1234567890123456789012345678901234567890' as `0x${string}`;

			await expect(sendBlockchainTransaction(data, to)).rejects.toThrow('Transaction failed');
		});

		it('should handle empty error messages', async () => {
			mockSendTransaction.mockRejectedValue(new Error(''));

			const data = '0xabcdef' as `0x${string}`;
			const to = '0x1234567890123456789012345678901234567890' as `0x${string}`;

			await expect(sendBlockchainTransaction(data, to)).rejects.toThrow('');
		});
	});

	describe('Input Validation and Edge Cases', () => {
		it('should handle valid hex data formats', async () => {
			const mockHash = '0xabcdef';
			mockSendTransaction.mockResolvedValue(mockHash);

			const validDataFormats = [
				'0x',
				'0x0',
				'0xabcdef123456',
				'0xABCDEF123456',
				'0x1234567890abcdef'
			];

			const to = '0x1234567890123456789012345678901234567890' as `0x${string}`;

			for (const data of validDataFormats) {
				await expect(sendBlockchainTransaction(data as `0x${string}`, to)).resolves.toBe(mockHash);
			}
		});

		it('should handle valid address formats', async () => {
			const mockHash = '0xabcdef';
			mockSendTransaction.mockResolvedValue(mockHash);
			const data = '0xabcdef' as `0x${string}`;

			const validAddresses = [
				'0x0000000000000000000000000000000000000000',
				'0x1234567890123456789012345678901234567890',
				'0xffffffffffffffffffffffffffffffffffffffff',
				'0xAbCdEf1234567890123456789012345678901234'
			];

			for (const address of validAddresses) {
				await expect(sendBlockchainTransaction(data, address as `0x${string}`)).resolves.toBe(
					mockHash
				);
			}
		});

		it('should handle complex approval calldata', async () => {
			const mockHash = '0xabcdef';
			mockSendTransaction.mockResolvedValue(mockHash);

			const complexCalldata =
				'0x095ea7b3000000000000000000000000a1b2c3d4e5f6789012345678901234567890abcd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`;
			const tokenAddress = '0x1234567890123456789012345678901234567890';

			await expect(sendApprovalTransaction(tokenAddress, complexCalldata)).resolves.toBe(mockHash);
		});

		it('should handle complex deployment calldata', async () => {
			const mockHash = '0xabcdef';
			mockSendTransaction.mockResolvedValue(mockHash);

			const complexCalldata =
				'0x12345678000000000000000000000000a1b2c3d4e5f6789012345678901234567890abcd000000000000000000000000b2c3d4e5f6789012345678901234567890abcdef000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040' as `0x${string}`;
			const orderbookAddress = '0x1234567890123456789012345678901234567890';

			await expect(sendDeploymentTransaction(orderbookAddress, complexCalldata)).resolves.toBe(
				mockHash
			);
		});
	});

	describe('Concurrent Transaction Handling', () => {
		it('should handle multiple concurrent transactions', async () => {
			const mockHashes = [
				'0x1111111111111111111111111111111111111111111111111111111111111111',
				'0x2222222222222222222222222222222222222222222222222222222222222222',
				'0x3333333333333333333333333333333333333333333333333333333333333333'
			];

			mockSendTransaction
				.mockResolvedValueOnce(mockHashes[0] as Hex)
				.mockResolvedValueOnce(mockHashes[1] as Hex)
				.mockResolvedValueOnce(mockHashes[2] as Hex);

			const data = '0xabcdef' as `0x${string}`;
			const addresses = [
				'0x1111111111111111111111111111111111111111',
				'0x2222222222222222222222222222222222222222',
				'0x3333333333333333333333333333333333333333'
			] as `0x${string}`[];

			const promises = addresses.map((address) => sendBlockchainTransaction(data, address));

			const results = await Promise.all(promises);

			expect(results).toEqual(mockHashes);
			expect(mockSendTransaction).toHaveBeenCalledTimes(3);
		});

		it('should handle mixed success/failure scenarios', async () => {
			mockSendTransaction
				.mockResolvedValueOnce('0x1111111111111111111111111111111111111111111111111111111111111111')
				.mockRejectedValueOnce(new Error('Transaction 2 failed'))
				.mockResolvedValueOnce(
					'0x3333333333333333333333333333333333333333333333333333333333333333'
				);

			const data = '0xabcdef' as `0x${string}`;
			const addresses = [
				'0x1111111111111111111111111111111111111111',
				'0x2222222222222222222222222222222222222222',
				'0x3333333333333333333333333333333333333333'
			] as `0x${string}`[];

			const promises = addresses.map((address) =>
				sendBlockchainTransaction(data, address).catch((error) => error)
			);

			const results = await Promise.all(promises);

			expect(results[0]).toBe('0x1111111111111111111111111111111111111111111111111111111111111111');
			expect(results[1]).toBeInstanceOf(Error);
			expect(results[2]).toBe('0x3333333333333333333333333333333333333333333333333333333333333333');
		});
	});

	describe('Realistic Transaction Scenarios', () => {
		it('should handle typical ERC20 approval scenario', async () => {
			const mockHash = '0xapproval123';
			mockSendTransaction.mockResolvedValue(mockHash);

			const usdcAddress = '0xA0b86a33E6441E0C0A7e88e8C0C8eBC3B7F2e5c2';
			const approveCalldata =
				'0x095ea7b3000000000000000000000000spenderaddresshere0000000000000000000000000000000000000000000000000000000000000000000000005af3107a4000' as `0x${string}`;

			await expect(sendApprovalTransaction(usdcAddress, approveCalldata)).resolves.toBe(mockHash);
		});

		it('should handle typical strategy deployment scenario', async () => {
			const mockHash = '0xdeployment456';
			mockSendTransaction.mockResolvedValue(mockHash);

			const orderbookAddress = '0xd2938e7c9fe3597f78832ce780feb61945c377d7';
			const deploymentCalldata = '0xgridstrategydata123456789abcdef' as `0x${string}`;

			await expect(sendDeploymentTransaction(orderbookAddress, deploymentCalldata)).resolves.toBe(
				mockHash
			);
		});
	});
});
