<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { createForm } from 'felte';
	import { validator } from '@felte/validator-zod';

	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import ErrorBoundary from '$lib/components/ui/ErrorBoundary.svelte';
	import ConnectButton from '$lib/components/ui/ConnectButton.svelte';
	import NetworkSelector from '$lib/components/forms/NetworkSelector.svelte';
	import DepositInput from '$lib/components/forms/DepositInput.svelte';
	import RainlangModal from '$lib/components/ui/RainlangModal.svelte';
	import DebugPanel from '$lib/components/debug/DebugPanel.svelte';
	import TokenIOInput from '$lib/components/forms/TokenIOInput.svelte';
	import DynamicFieldInput from '$lib/components/forms/DynamicFieldInput.svelte';

	import TokenConfigurationSection from '$lib/components/sections/TokenConfigurationSection.svelte';
	import StrategyParametersSection from '$lib/components/sections/StrategyParametersSection.svelte';
	import VisualizationSection from '$lib/components/sections/VisualizationSection.svelte';
	import DeploymentSection from '$lib/components/sections/DeploymentSection.svelte';

	import { walletStore } from '$lib/stores/wallet';
	import { strategyStore, gridLevels } from '$lib/stores/strategy';
	import { guiStore } from '$lib/stores/gui';
	import { deploymentStore } from '$lib/stores/deployment';
	import { validationStore, canSubmit, hasRequiredValues } from '$lib/stores/validation';

	import { strategyRegistry } from '$lib/strategies';
	import { DynamicSchemaBuilder } from '$lib/validations/DynamicSchemaBuilder';

	import {
		handleGuiInitialization,
		loadStrategyDetails,
		loadDeploymentDetails,
		prepareDeploymentTransaction
	} from '$lib/services/gui';
	import { sendApprovalTransaction, sendDeploymentTransaction } from '$lib/services/blockchain';

	import { GRID_STRATEGY_PATH } from '$lib/config/constants';
	import { createExplorerUrl, debounce } from '$lib/utils/helpers';
	import type { Hex } from 'viem';
	import { debugLog, shouldShowDebug } from '$lib/config/debug';
	import { ZodSchema } from 'zod';

	let isInitializing = true;
	let initializationError: string | null = null;
	let showRainlangModal = false;
	let rainlangCode = '';
	let gridStrategyContent = '';

	$: currentStrategy = strategyRegistry.get($strategyStore.strategyKey);
	$: validationSchema = currentStrategy
		? DynamicSchemaBuilder.buildSchemaForStrategy(currentStrategy)
		: null;

	$: wallet = $walletStore;
	$: strategy = $strategyStore;
	$: gui = $guiStore;
	$: levels = $gridLevels;
	$: formCanSubmit = $canSubmit;
	$: hasValues = $hasRequiredValues;

	const { reset, setFields, validate } = createForm({
		extend: validator({
			schema: (validationSchema || currentStrategy?.getValidationSchema()) as ZodSchema
		}),
		onSubmit: handleFormSubmit,
		validate: debounce(handleFormValidation, 300),
		onError: handleFormErrors,
		initialValues: {
			parameters: {
				'baseline-io-ratio': '',
				'io-ratio-growth': '',
				'tranche-size': '',
				'seconds-per-tranche': '0'
			},
			deposits: {},
			vaultIds: {
				input: {},
				output: {}
			}
		}
	});

	function handleFormValidation(values: any) {
		if (!currentStrategy || !values.parameters) {
			validationStore.setValidation(false, {});
			return {};
		}

		try {
			const schema = DynamicSchemaBuilder.buildSchemaForStrategy(currentStrategy);
			debugLog.log('Using dynamic schema from DynamicSchemaBuilder');

			const result = schema?.safeParse(values);

			if (result?.success) {
				validationStore.setValidation(true, {});
				if (values.parameters) {
					strategyStore.setFieldValues(values.parameters);
				}
			} else {
				const formattedErrors: Record<string, string[]> = {};
				result?.error.issues.forEach((issue) => {
					const path = issue.path.join('.');
					if (!formattedErrors[path]) {
						formattedErrors[path] = [];
					}
					formattedErrors[path].push(issue.message);
				});

				debugLog.log('Validation errors:', formattedErrors);
				validationStore.setValidation(false, formattedErrors);
			}
		} catch (error: unknown) {
			debugLog.error('Validation error:', error);
			validationStore.setValidation(false, {
				general: ['Validation failed. Please check your inputs.']
			});
		}

		return {};
	}

	function handleFormErrors(errors: any) {
		if (errors && typeof errors === 'object') {
			validationStore.setFieldErrors(errors);
		}
	}

	onMount(async () => {
		if (browser) {
			await initializeApp();
		}
	});

	async function initializeApp() {
		try {
			isInitializing = true;
			initializationError = null;

			gridStrategyContent = await loadGridStrategyFile();
			const strategyDetails = await loadStrategyDetails(gridStrategyContent);
			strategyStore.setStrategyDetails(strategyDetails);

			const deployments = await loadDeploymentDetails(gridStrategyContent);
			strategyStore.setDeployments(deployments);

			await initializeGui(strategy.selectedDeployment);
		} catch (error: unknown) {
			debugLog.error('App initialization failed:', error);
			initializationError =
				error instanceof Error ? error.message : 'Failed to initialize application';
		} finally {
			isInitializing = false;
		}
	}

	async function loadGridStrategyFile(): Promise<string> {
		const response = await fetch(GRID_STRATEGY_PATH);
		if (!response.ok) {
			throw new Error('Failed to load strategy configuration');
		}
		return await response.text();
	}

	async function resetGuiState() {
		try {
			guiStore.setError(null);
			guiStore.setLoading(true);

			await initializeGui(strategy.selectedDeployment);
		} catch (error: unknown) {
			debugLog.error('Failed to reset GUI state:', error);
		} finally {
			guiStore.setLoading(false);
		}
	}

	function resetFormAndStrategy() {
		reset();

		validationStore.reset();

		strategyStore.setFieldValues({});
		strategyStore.setAllTokensSelected(false);
	}

	/**
	 * Initialize GUI for selected deployment
	 */
	async function initializeGui(deploymentKey: string) {
		try {
			guiStore.setLoading(true);
			guiStore.setError(null);

			const { gui, error } = await handleGuiInitialization(
				gridStrategyContent,
				deploymentKey,
				null,
				(state: string) => {
					debugLog.log('GUI state update:', state);
				}
			);

			if (error || !gui) {
				throw new Error(error || 'Failed to initialize GUI');
			}

			guiStore.setGui(gui);

			await loadGuiConfiguration(gui);
		} catch (error: unknown) {
			debugLog.error('GUI initialization failed:', error);
			guiStore.setError(error instanceof Error ? error.message : 'GUI initialization failed');
		} finally {
			guiStore.setLoading(false);
		}
	}

	/**
	 * Load GUI configuration and token settings
	 */
	async function loadGuiConfiguration(gui: any) {
		const selectTokensResult = gui.getSelectTokens();
		if (selectTokensResult.error) {
			throw new Error(selectTokensResult.error.msg);
		}
		guiStore.setSelectTokens(selectTokensResult.value);

		const networkKeyResult = gui.getNetworkKey();
		if (networkKeyResult.error) {
			throw new Error(networkKeyResult.error.msg);
		}
		guiStore.setNetworkKey(networkKeyResult.value);

		await checkAllTokensSelected(gui);
	}

	/**
	 * Load full GUI configuration when all tokens are selected
	 */
	async function loadFullGuiConfiguration(gui: any) {
		const getAllTokenInfosResult = await gui.getAllTokenInfos();
		if (getAllTokenInfosResult.error) {
			throw new Error(getAllTokenInfosResult.error.msg);
		}
		guiStore.setAllTokenInfos(getAllTokenInfosResult.value);

		const fieldsResult = gui.getAllFieldDefinitions(false);
		if (fieldsResult.error) {
			throw new Error(fieldsResult.error.msg);
		}

		const fieldsWithDefaultsResult = gui.getAllFieldDefinitions(true);
		if (fieldsWithDefaultsResult.error) {
			throw new Error(fieldsWithDefaultsResult.error.msg);
		}

		guiStore.setFieldDefinitions(fieldsResult.value, fieldsWithDefaultsResult.value);

		const currentDeploymentResult = gui.getCurrentDeployment();
		if (currentDeploymentResult.error) {
			throw new Error(currentDeploymentResult.error.msg);
		}

		const currentDeployment = currentDeploymentResult.value;
		guiStore.setDeposits(currentDeployment.deposits || []);
		guiStore.setTokenIO(
			currentDeployment.deployment.order.inputs || [],
			currentDeployment.deployment.order.outputs || []
		);

		const hasDepositsResult = gui.hasAnyDeposit();
		const hasVaultIdsResult = gui.hasAnyVaultId();

		if (!hasDepositsResult.error && !hasVaultIdsResult.error) {
			if (hasDepositsResult.value || hasVaultIdsResult.value) {
				if (!strategy.showAdvancedOptions) {
					strategyStore.toggleAdvancedOptions();
					debugLog.log('Auto-enabled advanced options due to deposits or vault IDs');
				}
			}
		}

		debugLog.log('Full GUI configuration loaded');
	}

	/**
	 * Check if all required tokens are selected
	 */
	async function checkAllTokensSelected(gui: any) {
		try {
			const areAllTokensSelectedResult = gui.areAllTokensSelected();
			if (areAllTokensSelectedResult.error) {
				throw new Error(areAllTokensSelectedResult.error.msg);
			}

			const allSelected = areAllTokensSelectedResult.value;
			strategyStore.setAllTokensSelected(allSelected);

			debugLog.log('All tokens selected:', allSelected);

			if (allSelected) {
				await loadFullGuiConfiguration(gui);
			}
		} catch (error: unknown) {
			debugLog.error('Error checking tokens selected:', error);
			guiStore.setError(error instanceof Error ? error.message : 'Token validation failed');
		}
	}

	function handleNetworkChange(event: CustomEvent<string>) {
		const newDeployment = event.detail;
		strategyStore.setSelectedDeployment(newDeployment);
		initializeGui(newDeployment);
	}

	/**
	 * Handle token selection change
	 */
	async function handleTokenChange(event: CustomEvent<{ key: string; address: string }>) {
		const { key, address } = event.detail;

		debugLog.group('=== TOKEN CHANGE EVENT ===');
		debugLog.log('Key:', key);
		debugLog.log('Address:', address);
		debugLog.log('GUI available:', !!gui.gui);

		if (!gui.gui) {
			debugLog.error('GUI not available for token change');
			guiStore.setError('GUI not initialized');
			return;
		}

		try {
			deploymentStore.clearSuccess();

			guiStore.setError(null);
			strategyStore.setFieldValue(key, address);

			await checkAllTokensSelected(gui.gui);

			debugLog.log('Token change completed successfully');
		} catch (error: unknown) {
			debugLog.error('Token selection failed:', error);

			let errorMessage = 'Token selection failed';
			if (error instanceof Error) {
				if (error.message.includes('timeout')) {
					errorMessage = 'Operation timed out. Please try again.';
				} else if (error.message.includes('recursive')) {
					errorMessage = 'Token validation in progress. Please wait and try again.';
				} else {
					errorMessage = error.message;
				}
			}

			guiStore.setError(errorMessage);
		}

		debugLog.groupEnd();
	}

	function handleFieldChange(event: CustomEvent<{ binding: string; value: string }>) {
		const { binding, value } = event.detail;

		debugLog.group('=== FIELD CHANGE ===');
		debugLog.log('Field:', binding, 'Value:', value);

		if (!gui.gui) return;

		try {
			gui.gui.saveFieldValue(binding, value);

			setFields(`parameters.${binding}` as any, value);

			strategyStore.setFieldValue(binding, value);
			strategyStore.calculateMaxReturns();

			validationStore.clearFieldErrors(`parameters.${binding}`);

			if (currentStrategy) {
				const fieldErrors = DynamicSchemaBuilder.validateField(currentStrategy, binding, value);
				if (fieldErrors.length > 0) {
					fieldErrors.forEach((error) => {
						validationStore.addFieldError(`parameters.${binding}`, error);
					});
				}
				debugLog.log('Dynamic field validation result:', fieldErrors);
			}

			setTimeout(() => validate(), 100);

			debugLog.log('Field change completed successfully');
		} catch (error: unknown) {
			debugLog.error('Field update failed:', error);
			validationStore.addFieldError(`parameters.${binding}`, 'Failed to update field');
		}

		debugLog.groupEnd();
	}

	/**
	 * Handle deposit amount change
	 */
	function handleDepositChange(event: CustomEvent<{ tokenKey: string; amount: string }>) {
		const { tokenKey, amount } = event.detail;

		debugLog.group('=== DEPOSIT CHANGE ===');
		debugLog.log('Token Key:', tokenKey);
		debugLog.log('Amount:', amount);

		if (!gui.gui) {
			debugLog.error('GUI not available for deposit change');
			return;
		}

		try {
			gui.gui.saveDeposit(tokenKey, amount);

			const fieldPath = `deposits.${tokenKey}`;
			setFields(fieldPath as any, amount);

			strategyStore.setFieldValue(fieldPath, amount);

			validationStore.clearFieldErrors(fieldPath);

			debugLog.log('Deposit saved successfully');
			debugLog.log('Form field path:', fieldPath);

			setTimeout(() => validate(), 100);

			debugLog.log('Deposit change completed successfully');
		} catch (error: unknown) {
			debugLog.error('Deposit update failed:', error);

			const fieldPath = `deposits.${tokenKey}`;
			validationStore.addFieldError(fieldPath, 'Failed to update deposit amount');
		}

		debugLog.groupEnd();
	}

	/**
	 * Handle Token I/O vault ID changes
	 */
	function handleTokenIOChange(
		event: CustomEvent<{ index: number; label: string; value: string }>
	) {
		const { index, label, value } = event.detail;

		debugLog.group('=== TOKEN I/O CHANGE ===');
		debugLog.log('Index:', index);
		debugLog.log('Label:', label);
		debugLog.log('Value:', value);

		if (!gui.gui) {
			debugLog.error('GUI not available for Token I/O change');
			return;
		}

		try {
			const isInput = label === 'Input';
			const vaultType = isInput ? 'input' : 'output';
			const fieldPath = `vaultIds.${vaultType}.${index}`;

			setFields(fieldPath as any, value);

			validationStore.clearFieldErrors(fieldPath);

			strategyStore.setFieldValue(fieldPath, value);

			debugLog.log(`${label} vault ${index} set to: ${value}`);
			debugLog.log('Form field path:', fieldPath);

			setTimeout(() => validate(), 100);

			debugLog.log('Token I/O change completed successfully');
		} catch (error: unknown) {
			debugLog.error('Token I/O update failed:', error);

			const isInput = label === 'Input';
			const vaultType = isInput ? 'input' : 'output';
			const fieldPath = `vaultIds.${vaultType}.${index}`;

			validationStore.addFieldError(fieldPath, 'Failed to update vault ID');
		}

		debugLog.groupEnd();
	}

	/**
	 * Handle showing Rainlang modal
	 */
	function handleShowRainlang(event: CustomEvent<string>) {
		rainlangCode = event.detail;
		showRainlangModal = true;
	}

	/**
	 * Handle form submission (deployment)
	 */
	async function handleFormSubmit() {
		if (!wallet.isConnected || !wallet.address || !gui.gui) {
			guiStore.setError('Please connect your wallet first');
			return;
		}

		try {
			deploymentStore.startDeployment();

			const transactionArgs = await prepareDeploymentTransaction(gui.gui, wallet.address);
			const { approvals, deploymentCalldata, orderbookAddress, chainId } = transactionArgs;

			if (wallet.chainId !== chainId) {
				deploymentStore.setError(`Please switch to the correct network (Chain ID: ${chainId})`);
				return;
			}

			if (approvals.length > 0) {
				deploymentStore.setStep('approving');

				for (const approval of approvals) {
					await sendApprovalTransaction(approval.token, approval.calldata as Hex);
				}
			}

			deploymentStore.setStep('deploying');
			const transactionHash = await sendDeploymentTransaction(
				orderbookAddress,
				deploymentCalldata as Hex
			);

			const explorerUrl = createExplorerUrl(gui.networkKey, orderbookAddress);

			deploymentStore.setSuccess(transactionHash, explorerUrl);

			resetFormAndStrategy();
		} catch (error: unknown) {
			debugLog.error('Deployment failed:', error);
			deploymentStore.setError(error instanceof Error ? error.message : 'Deployment failed');
		}
	}
</script>

{#if isInitializing}
	<div class="flex min-h-[50vh] items-center justify-center">
		<LoadingSpinner size="large" message="Loading Grid Strategy..." />
	</div>
{:else if initializationError}
	<ErrorBoundary error={initializationError} />
{:else}
	<main class="space-y-8 py-8">
		{#if shouldShowDebug('debugPanels')}
			<DebugPanel title="Strategy Debug Info" collapsible={true} defaultCollapsed={true}>
				<div slot="content" class="mt-2 grid grid-cols-2 gap-4">
					<div>
						<p><strong>GUI Status:</strong></p>
						<p>GUI Instance: {gui.gui ? 'Available' : 'Not Available'}</p>
						<p>Select Tokens: {gui.selectTokens.length}</p>
						<p>Field Definitions: {gui.fieldDefinitions.length}</p>
						<p>Network Key: {gui.networkKey || 'None'}</p>
						<p>Token Inputs: {gui.tokenInputs.length}</p>
						<p>Token Outputs: {gui.tokenOutputs.length}</p>
					</div>
					<div>
						<p><strong>Form Status:</strong></p>
						<p>Strategy Field Values: {Object.keys(strategy.fieldValues).length}</p>
						<p>Max Returns: ${strategy.maxReturns}</p>
						<p>Show Advanced: {strategy.showAdvancedOptions}</p>
						<p>Deployment Loading: {gui.isLoading}</p>
					</div>
					<p class="text-sm text-red-700">{gui.error}</p>
				</div>

				<div slot="controls" class="mt-2 flex gap-2">
					<button
						on:click={resetGuiState}
						class="rounded bg-yellow-200 px-3 py-1 text-xs text-yellow-800 hover:bg-yellow-300"
					>
						Reset GUI
					</button>
					<button
						on:click={() => guiStore.setError(null)}
						class="rounded bg-blue-200 px-3 py-1 text-xs text-blue-800 hover:bg-blue-300"
					>
						Clear Errors
					</button>
					<button
						on:click={() =>
							debugLog.log('Current state:', {
								wallet: $walletStore,
								strategy: $strategyStore,
								gui: $guiStore
							})}
						class="rounded bg-green-200 px-3 py-1 text-xs text-green-800 hover:bg-green-300"
					>
						Log State
					</button>
				</div>
			</DebugPanel>
		{/if}

		<section class="rounded-lg bg-white p-6 shadow-md">
			<div class="flex w-full items-center justify-between">
				<ConnectButton />
			</div>
		</section>

		<section class="rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-4 text-xl font-semibold text-gray-800">Select Network</h2>
			<NetworkSelector
				deployments={strategy.deployments}
				selected={strategy.selectedDeployment}
				on:change={handleNetworkChange}
			/>
		</section>

		<TokenConfigurationSection
			selectTokens={gui.selectTokens}
			gui={gui.gui}
			on:tokenChange={handleTokenChange}
		/>

		{#if strategy.allTokensSelected}
			{#if gui.fieldDefinitions.length > 0}
				<StrategyParametersSection
					fieldDefinitions={gui.fieldDefinitions}
					gui={gui.gui}
					on:fieldChange={handleFieldChange}
				/>
			{/if}

			<section class="rounded-lg bg-white p-6 shadow-md">
				<label class="flex items-center space-x-3">
					<input
						type="checkbox"
						checked={strategy.showAdvancedOptions}
						on:change={() => strategyStore.toggleAdvancedOptions()}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span class="font-medium text-gray-700">Show advanced options</span>
				</label>
			</section>

			{#if strategy.showAdvancedOptions}
				{#if gui.fieldDefinitionsWithDefaults.length > 0}
					<section class="rounded-lg bg-white p-6 shadow-md">
						<h2 class="mb-4 text-xl font-semibold text-gray-800">Advanced Parameters</h2>
						<div class="space-y-6">
							{#each gui.fieldDefinitionsWithDefaults as field (field.binding)}
								<DynamicFieldInput
									fieldDefinition={field}
									gui={gui.gui}
									on:change={handleFieldChange}
								/>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Token I/O Configuration -->
				{#if gui.tokenInputs.length > 0 || gui.tokenOutputs.length > 0}
					<section class="rounded-lg bg-white p-6 shadow-md">
						<h2 class="mb-4 text-xl font-semibold text-gray-800">Token I/O Configuration</h2>
						<p class="mb-4 text-sm text-gray-600">
							Configure vault IDs for your token inputs and outputs. This is optional for advanced
							users who want to specify custom vault behavior.
						</p>

						<div class="space-y-6">
							<!-- Output Vaults -->
							{#if gui.tokenOutputs.length > 0}
								<div>
									<h3 class="text-md mb-3 flex items-center gap-2 font-medium text-gray-800">
										<span class="h-2 w-2 rounded-full bg-red-500"></span>
										Output Vaults ({gui.tokenOutputs.length})
									</h3>
									<div class="space-y-4 border-l-2 border-red-100 pl-4">
										{#each gui.tokenOutputs as output, index (output.vaultId || index)}
											<TokenIOInput
												{index}
												label="Output"
												vault={output}
												gui={gui.gui}
												allTokenInfos={gui.allTokenInfos}
												on:change={handleTokenIOChange}
											/>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Input Vaults -->
							{#if gui.tokenInputs.length > 0}
								<div>
									<h3 class="text-md mb-3 flex items-center gap-2 font-medium text-gray-800">
										<span class="h-2 w-2 rounded-full bg-green-500"></span>
										Input Vaults ({gui.tokenInputs.length})
									</h3>
									<div class="space-y-4 border-l-2 border-green-100 pl-4">
										{#each gui.tokenInputs as input, index (input.vaultId || index)}
											<TokenIOInput
												{index}
												label="Input"
												vault={input}
												gui={gui.gui}
												allTokenInfos={gui.allTokenInfos}
												on:change={handleTokenIOChange}
											/>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Help Text -->
							<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
								<h4 class="mb-2 text-sm font-semibold text-blue-800">What are Vault IDs?</h4>
								<p class="mb-2 text-sm text-blue-700">
									Vault IDs allow you to specify custom vault behavior for your token inputs and
									outputs. This is an advanced feature that most users can leave empty.
								</p>
								<ul class="space-y-1 text-xs text-blue-600">
									<li>• <strong>Output Vaults:</strong> Where tokens you're selling are stored</li>
									<li>
										• <strong>Input Vaults:</strong> Where tokens you're buying will be deposited
									</li>
									<li>• <strong>Empty = Default:</strong> Uses automatic vault management</li>
								</ul>
							</div>
						</div>
					</section>
				{/if}

				<!-- Deposits -->
				{#if gui.deposits.length > 0}
					<section class="rounded-lg bg-white p-6 shadow-md">
						<div class="space-y-4">
							{#each gui.deposits as deposit, index (deposit.token || index)}
								<DepositInput
									{deposit}
									{index}
									gui={gui.gui}
									allTokenInfos={gui.allTokenInfos}
									on:change={handleDepositChange}
								/>
							{/each}
						</div>
					</section>
				{/if}
			{/if}

			<!-- Visualization Section -->
			<VisualizationSection
				gridLevels={levels}
				maxReturns={strategy.maxReturns}
				isWalletConnected={wallet.isConnected}
			/>

			<!-- Deployment Section -->
			<DeploymentSection
				canSubmit={formCanSubmit}
				hasRequiredValues={hasValues}
				gui={gui.gui}
				on:deploy={handleFormSubmit}
				on:showRainlang={handleShowRainlang}
			/>
		{/if}
	</main>
{/if}

{#if showRainlangModal}
	<RainlangModal code={rainlangCode} on:close={() => (showRainlangModal = false)} />
{/if}
