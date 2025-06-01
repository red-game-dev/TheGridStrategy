/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';


// Mock the DotrainOrderGui module before importing anything
vi.mock('@rainlanguage/orderbook', () => {
	// Create mock instance methods
	const mockGuiInstance = {
		deserializeState: vi.fn(),
		chooseDeployment: vi.fn(),
		getComposedRainlang: vi.fn(),
		getDeploymentTransactionArgs: vi.fn()
	};

	// Create the mock constructor
	const MockDotrainOrderGui = vi.fn().mockImplementation(() => mockGuiInstance);

	// Add static methods to the constructor
	(MockDotrainOrderGui as any).getStrategyDetails = vi.fn();
	(MockDotrainOrderGui as any).getDeploymentDetails = vi.fn();

	// Store references for test access
	MockDotrainOrderGui.prototype.mockInstance = mockGuiInstance;

	return {
		DotrainOrderGui: MockDotrainOrderGui
	};
});

import {
	handleGuiInitialization,
	loadStrategyDetails,
	loadDeploymentDetails,
	getComposedRainlang,
	prepareDeploymentTransaction
} from './gui';
import { DotrainOrderGui } from '@rainlanguage/orderbook';
import type { DotrainOrderGui as DotrainOrderGuiType, NameAndDescriptionCfg } from '@rainlanguage/orderbook';

// Type assertion to access our mock
const MockDotrainOrderGui = vi.mocked(DotrainOrderGui, true);

describe('GUI Service', () => {
	const mockDotrain = 'mock-dotrain-config';
	const mockDeploymentKey = 'ethereum';
	const mockAddress = '0x1234567890123456789012345678901234567890';
	const mockPushGuiStateToUrlHistory = vi.fn();

	// Get access to the mock instance
	let mockGuiInstance: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Create a fresh mock instance for each test
        mockGuiInstance = {
            deserializeState: vi.fn(),
            chooseDeployment: vi.fn(),
            getComposedRainlang: vi.fn(),
            getDeploymentTransactionArgs: vi.fn(),
            free: vi.fn(),
            getDeposits: vi.fn(),
            saveDeposit: vi.fn(),
            removeDeposit: vi.fn()
        };
        MockDotrainOrderGui.mockImplementation(() => mockGuiInstance as unknown as DotrainOrderGui);
    });

	describe('handleGuiInitialization', () => {
		it('should initialize GUI successfully without URL state', async () => {
			const mockResult = { error: null };
			mockGuiInstance.chooseDeployment.mockResolvedValue(mockResult);

			const result = await handleGuiInitialization(
				mockDotrain,
				mockDeploymentKey,
				null,
				mockPushGuiStateToUrlHistory
			);

			expect(result.gui).toBe(mockGuiInstance);
			expect(result.error).toBeNull();
			expect(mockGuiInstance.chooseDeployment).toHaveBeenCalledWith(
				mockDotrain,
				mockDeploymentKey,
				mockPushGuiStateToUrlHistory
			);
		});

		it('should initialize GUI successfully with URL state', async () => {
			const mockStateFromUrl = 'serialized-state-data';
			const mockResult = { error: null };
			mockGuiInstance.deserializeState.mockResolvedValue(mockResult);

			const result = await handleGuiInitialization(
				mockDotrain,
				mockDeploymentKey,
				mockStateFromUrl,
				mockPushGuiStateToUrlHistory
			);

			expect(result.gui).toBe(mockGuiInstance);
			expect(result.error).toBeNull();
			expect(mockGuiInstance.deserializeState).toHaveBeenCalledWith(
				mockDotrain,
				mockStateFromUrl,
				mockPushGuiStateToUrlHistory
			);
		});

		it('should fallback to chooseDeployment when deserializeState fails', async () => {
			const mockStateFromUrl = 'invalid-serialized-state';
			const deserializeError = { error: { msg: 'Invalid state' } };
			const chooseDeploymentSuccess = { error: null };

			mockGuiInstance.deserializeState.mockResolvedValue(deserializeError);
			mockGuiInstance.chooseDeployment.mockResolvedValue(chooseDeploymentSuccess);

			const result = await handleGuiInitialization(
				mockDotrain,
				mockDeploymentKey,
				mockStateFromUrl,
				mockPushGuiStateToUrlHistory
			);

			expect(result.gui).toBe(mockGuiInstance);
			expect(result.error).toBeNull();
			expect(mockGuiInstance.deserializeState).toHaveBeenCalled();
			expect(mockGuiInstance.chooseDeployment).toHaveBeenCalled();
		});

		it('should handle chooseDeployment error', async () => {
			const mockError = { error: { msg: 'Deployment failed' } };
			mockGuiInstance.chooseDeployment.mockResolvedValue(mockError);

			const result = await handleGuiInitialization(
				mockDotrain,
				mockDeploymentKey,
				null,
				mockPushGuiStateToUrlHistory
			);

			expect(result.gui).toBeNull();
			expect(result.error).toBe('Deployment failed');
		});

		it('should handle deserializeState error when no fallback works', async () => {
			const mockStateFromUrl = 'invalid-state';
			const deserializeError = { error: { msg: 'Invalid state' } };
			const chooseDeploymentError = { error: { msg: 'Deployment also failed' } };

			mockGuiInstance.deserializeState.mockResolvedValue(deserializeError);
			mockGuiInstance.chooseDeployment.mockResolvedValue(chooseDeploymentError);

			const result = await handleGuiInitialization(
				mockDotrain,
				mockDeploymentKey,
				mockStateFromUrl,
				mockPushGuiStateToUrlHistory
			);

			expect(result.gui).toBeNull();
			expect(result.error).toBe('Deployment also failed');
		});

		it('should handle exceptions during initialization', async () => {
			mockGuiInstance.chooseDeployment.mockRejectedValue(new Error('Network error'));

			const result = await handleGuiInitialization(
				mockDotrain,
				mockDeploymentKey,
				null,
				mockPushGuiStateToUrlHistory
			);

			expect(result.gui).toBeNull();
			expect(result.error).toBe('Network error');
		});

		it('should handle non-Error exceptions', async () => {
			mockGuiInstance.chooseDeployment.mockRejectedValue('String error');

			const result = await handleGuiInitialization(
				mockDotrain,
				mockDeploymentKey,
				null,
				mockPushGuiStateToUrlHistory
			);

			expect(result.gui).toBeNull();
			expect(result.error).toBe('Could not initialize deployment form.');
		});
	});

	describe('loadStrategyDetails', () => {
        it('should load strategy details successfully', async () => {
            const mockStrategyDetails = {
                name: 'Grid Strategy',
                description: 'Automated grid trading',
                short_description: 'Grid trading strategy'
            };
            const mockResult = {
                error: undefined,
                value: mockStrategyDetails
            };

            MockDotrainOrderGui.getStrategyDetails.mockResolvedValue(mockResult);

            const result = await loadStrategyDetails(mockDotrain);

            expect(result).toBe(mockStrategyDetails);
            expect(MockDotrainOrderGui.getStrategyDetails).toHaveBeenCalledWith(mockDotrain);
        });

        it('should handle strategy details error', async () => {
            const mockError = { value: undefined, error: { msg: 'Invalid dotrain config', readableMsg: 'Invalid dotrain config' } };
            MockDotrainOrderGui.getStrategyDetails.mockResolvedValue(mockError);
        
            await expect(loadStrategyDetails(mockDotrain)).rejects.toThrow('Invalid dotrain config');
        });

		it('should handle exceptions during strategy loading', async () => {
			MockDotrainOrderGui.getStrategyDetails.mockRejectedValue(new Error('Network failure'));

			await expect(loadStrategyDetails(mockDotrain)).rejects.toThrow('Network failure');
		});
	});

	describe('loadDeploymentDetails', () => {
        it('should load deployment details successfully', async () => {
            const mockDeploymentMap = new Map([
                ['ethereum', { name: 'Ethereum', chainId: 1, description: 'Ethereum Mainnet', short_description: 'ETH' }],
                ['polygon', { name: 'Polygon', chainId: 137, description: 'Polygon Network', short_description: 'MATIC' }]
            ]);
            const mockResult = {
                error: undefined,
                value: mockDeploymentMap
            };

            MockDotrainOrderGui.getDeploymentDetails.mockResolvedValue(mockResult);

            const result = await loadDeploymentDetails(mockDotrain);

            expect(result).toEqual([
                { key: 'ethereum', value: { name: 'Ethereum', chainId: 1, description: 'Ethereum Mainnet', short_description: 'ETH' } },
                { key: 'polygon', value: { name: 'Polygon', chainId: 137, description: 'Polygon Network', short_description: 'MATIC' } }
            ]);
            expect(MockDotrainOrderGui.getDeploymentDetails).toHaveBeenCalledWith(mockDotrain);
      });

        it('should handle deployment details error', async () => {
            const mockError = { error: { msg: 'No deployments found', readableMsg: 'No deployments found' }, value: undefined };
            MockDotrainOrderGui.getDeploymentDetails.mockResolvedValue(mockError);
        
            await expect(loadDeploymentDetails(mockDotrain)).rejects.toThrow('No deployments found');
        });

		it('should handle exceptions during deployment loading', async () => {
			MockDotrainOrderGui.getDeploymentDetails.mockRejectedValue(new Error('Parse error'));

			await expect(loadDeploymentDetails(mockDotrain)).rejects.toThrow('Parse error');
		});

        it('should handle empty deployment map', async () => {
            const mockEmptyMap = new Map<string, NameAndDescriptionCfg>();
            const mockResult = {
                error: undefined,
                value: mockEmptyMap
            };
        
            MockDotrainOrderGui.getDeploymentDetails.mockResolvedValue(mockResult);
        
            const result = await loadDeploymentDetails(mockDotrain);
        
            expect(result).toEqual([]);
        });
	});

	describe('getComposedRainlang', () => {
		it('should get composed Rainlang successfully', async () => {
			const mockRainlang = '#calculate-io using-words-from raindex-subparser...';
			const mockResult = {
				error: null,
				value: mockRainlang
			};

			mockGuiInstance.getComposedRainlang.mockResolvedValue(mockResult);

			const result = await getComposedRainlang(mockGuiInstance as unknown as DotrainOrderGuiType);

			expect(result).toBe(mockRainlang);
			expect(mockGuiInstance.getComposedRainlang).toHaveBeenCalled();
		});

		it('should handle Rainlang composition error', async () => {
			const mockError = { error: { msg: 'Composition failed' } };
			mockGuiInstance.getComposedRainlang.mockResolvedValue(mockError);

			await expect(
				getComposedRainlang(mockGuiInstance as unknown as DotrainOrderGuiType)
			).rejects.toThrow('Composition failed');
		});

		it('should handle exceptions during Rainlang composition', async () => {
			mockGuiInstance.getComposedRainlang.mockRejectedValue(new Error('Syntax error'));

			await expect(
				getComposedRainlang(mockGuiInstance as unknown as DotrainOrderGuiType)
			).rejects.toThrow('Syntax error');
		});
	});

	describe('prepareDeploymentTransaction', () => {
		it('should prepare deployment transaction successfully', async () => {
			const mockTransactionArgs = {
				calldata: '0xdeadbeef',
				orderbookAddress: '0x1234567890123456789012345678901234567890',
				approvals: []
			};
			const mockResult = {
				error: null,
				value: mockTransactionArgs
			};

			mockGuiInstance.getDeploymentTransactionArgs.mockResolvedValue(mockResult);

			const result = await prepareDeploymentTransaction(
				mockGuiInstance as unknown as DotrainOrderGuiType,
				mockAddress
			);

			expect(result).toBe(mockTransactionArgs);
			expect(mockGuiInstance.getDeploymentTransactionArgs).toHaveBeenCalledWith(mockAddress);
		});

		it('should handle transaction preparation error', async () => {
			const mockError = { error: { msg: 'Invalid parameters' } };
			mockGuiInstance.getDeploymentTransactionArgs.mockResolvedValue(mockError);

			await expect(
				prepareDeploymentTransaction(mockGuiInstance as unknown as DotrainOrderGuiType, mockAddress)
			).rejects.toThrow('Invalid parameters');
		});

		it('should handle invalid address format', async () => {
			const invalidAddress = 'not-an-address';

			// The service should still call the GUI method, and let it handle validation
			const mockError = { error: { msg: 'Invalid address format' } };
			mockGuiInstance.getDeploymentTransactionArgs.mockResolvedValue(mockError);

			await expect(
				prepareDeploymentTransaction(
					mockGuiInstance as unknown as DotrainOrderGuiType,
					invalidAddress
				)
			).rejects.toThrow('Invalid address format');
		});
	});

	describe('Error Handling and Edge Cases', () => {
        it('should handle strategy details error', async () => {
            const mockError = { value: undefined, error: { msg: 'Invalid dotrain config', readableMsg: 'Invalid dotrain config' } };
            MockDotrainOrderGui.getStrategyDetails.mockResolvedValue(mockError);
        
            await expect(loadStrategyDetails(mockDotrain)).rejects.toThrow('Invalid dotrain config');
        });

		it('should handle network timeouts gracefully', async () => {
			const timeoutError = new Error('Request timeout');
			MockDotrainOrderGui.getStrategyDetails.mockRejectedValue(timeoutError);

			await expect(loadStrategyDetails(mockDotrain)).rejects.toThrow('Request timeout');
		});

        it('should handle strategy details error', async () => {
            const mockError = { value: undefined, error: { msg: 'Invalid dotrain config', readableMsg: 'Invalid dotrain config' } };
            MockDotrainOrderGui.getStrategyDetails.mockResolvedValue(mockError);
        
            await expect(loadStrategyDetails(mockDotrain)).rejects.toThrow('Invalid dotrain config');
        });

		it('should handle GUI instance creation failure', async () => {
			MockDotrainOrderGui.mockImplementationOnce(() => {
				throw new Error('WASM initialization failed');
			});

			const result = await handleGuiInitialization(
				mockDotrain,
				mockDeploymentKey,
				null,
				mockPushGuiStateToUrlHistory
			);

			expect(result.gui).toBeNull();
			expect(result.error).toBe('WASM initialization failed');
		});
	});

	describe('Integration Scenarios', () => {
		it('should handle complete GUI workflow', async () => {
			// Step 1: Initialize GUI
			const initResult = { error: null };
			mockGuiInstance.chooseDeployment.mockResolvedValue(initResult);

			const guiResult = await handleGuiInitialization(
				mockDotrain,
				mockDeploymentKey,
				null,
				mockPushGuiStateToUrlHistory
			);

			expect(guiResult.error).toBeNull();

			// Step 2: Get composed Rainlang
			const mockRainlang = '#calculate-io...';
			const rainlangResult = { error: null, value: mockRainlang };
			mockGuiInstance.getComposedRainlang.mockResolvedValue(rainlangResult);

			const rainlang = await getComposedRainlang(guiResult.gui!);
			expect(rainlang).toBe(mockRainlang);

			// Step 3: Prepare deployment
			const mockTxArgs = { calldata: '0xdeadbeef' };
			const txResult = { error: null, value: mockTxArgs };
			mockGuiInstance.getDeploymentTransactionArgs.mockResolvedValue(txResult);

			const txArgs = await prepareDeploymentTransaction(guiResult.gui!, mockAddress);
			expect(txArgs).toBe(mockTxArgs);
		});

		it('should handle workflow with URL state restoration', async () => {
			const mockStateFromUrl = 'valid-serialized-state';
			const deserializeResult = { error: null };
			mockGuiInstance.deserializeState.mockResolvedValue(deserializeResult);

			const result = await handleGuiInitialization(
				mockDotrain,
				mockDeploymentKey,
				mockStateFromUrl,
				mockPushGuiStateToUrlHistory
			);

			expect(result.error).toBeNull();
			expect(mockGuiInstance.deserializeState).toHaveBeenCalledWith(
				mockDotrain,
				mockStateFromUrl,
				mockPushGuiStateToUrlHistory
			);
		});

        it('should handle complex deployment scenarios', async () => {
            const complexDeploymentMap = new Map([
                [
                    'ethereum',
                    {
                        name: 'Ethereum Mainnet',
                        chainId: 1,
                        description: 'Ethereum Mainnet network',
                        short_description: 'ETH'
                    }
                ],
                [
                    'base',
                    {
                        name: 'Base',
                        chainId: 8453,
                        description: 'Base network',
                        short_description: 'BASE'
                    }
                ]
            ]);
        
            const mockResult = { error: undefined, value: complexDeploymentMap };
            MockDotrainOrderGui.getDeploymentDetails.mockResolvedValue(mockResult);
        
            const result = await loadDeploymentDetails(mockDotrain);
        
            expect(result).toHaveLength(2);
            expect(result[0].key).toBe('ethereum');
            expect(result[1].key).toBe('base');
        });
	});
});
