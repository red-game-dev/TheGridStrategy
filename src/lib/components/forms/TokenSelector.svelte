<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { GuiSelectTokensCfg, TokenInfo, DotrainOrderGui } from '$lib/types';
	import { debounce, isValidAddress } from '$lib/utils/helpers.js';
	import { debugLog } from '$lib/config/debug';

	export let token: GuiSelectTokensCfg;
	export let gui: DotrainOrderGui | null;

	const dispatch = createEventDispatcher<{
		change: { key: string; address: string };
	}>();

	let inputValue = '';
	let tokenInfo: TokenInfo | null = null;
	let error = '';
	let isChecking = false;
	let checkingTimeout: ReturnType<typeof setTimeout>;

	const debouncedValidate = debounce(validateToken, 1000);

	onMount(async () => {
		if (gui) {
			try {
				const result = await gui.getTokenInfo(token.key);
				if (!result.error && result.value?.address) {
					tokenInfo = result.value;
					inputValue = result.value.address;
				}
			} catch (err) {
				debugLog.log('Initial token info not available for', token.key, err);
			}
		}
	});

	async function validateToken(address: string) {
		debugLog.log(`[${token.key}] Starting validation for:`, address);

		if (!address || !gui) {
			resetState();
			return;
		}

		if (!isValidAddress(address)) {
			setError('Invalid address format');
			return;
		}

		setChecking(true);

		try {
			debugLog.log(`[${token.key}] Dispatching change event`);

			debugLog.log('Calling gui.saveSelectToken...');

			await gui.removeSelectToken(token.key);
			await gui.saveSelectToken(token.key, address);

			debugLog.log(`[${token.key}] Getting token info`);
			const result = await gui.getTokenInfo(token.key);

			await dispatch('change', { key: token.key, address });

			if (result.error) {
				debugLog.log(`[${token.key}] Token validation failed:`, result.error);
				setError(result.error.msg || 'Token not found');
			} else if (result.value) {
				debugLog.log(`[${token.key}] Token validation successful:`, result.value);
				setSuccess(result.value);
			} else {
				setError('No token information available');
			}
		} catch (err) {
			console.error(`[${token.key}] Validation error:`, err);
			setError('Validation failed');
		} finally {
			setChecking(false);
		}
	}

	function setChecking(checking: boolean) {
		isChecking = checking;

		if (checking) {
			clearTimeout(checkingTimeout);
			checkingTimeout = setTimeout(() => {
				debugLog.log(`[${token.key}] Checking timeout - forcing stop`);
				isChecking = false;
				if (!tokenInfo && !error) {
					error = 'Validation timeout';
				}
			}, 10000);
		} else {
			clearTimeout(checkingTimeout);
		}
	}

	function setError(message: string) {
		error = message;
		tokenInfo = null;
		isChecking = false;
		clearTimeout(checkingTimeout);
	}

	function setSuccess(info: TokenInfo) {
		tokenInfo = info;
		error = '';
		isChecking = false;
		clearTimeout(checkingTimeout);
	}

	function resetState() {
		tokenInfo = null;
		error = '';
		isChecking = false;
		clearTimeout(checkingTimeout);
	}

	function onInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = target.value.trim();

		debugLog.log(`[${token.key}] Input changed to:`, newValue);

		inputValue = newValue;

		resetState();

		if (newValue && newValue.length >= 10) {
			debouncedValidate(newValue);
		}
	}

	function forceValidate() {
		if (inputValue) {
			resetState();
			validateToken(inputValue);
		}
	}

	function cleanup() {
		clearTimeout(checkingTimeout);
	}

	$: if (!gui && isChecking) {
		resetState();
		error = 'GUI not available';
	}
</script>

<svelte:window on:beforeunload={cleanup} />

<div class="space-y-2">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
		{#if token.name || token.description}
			<div>
				{#if token.name}
					<h3 class="text-lg font-semibold text-gray-900">{token.name}</h3>
				{/if}
				{#if token.description}
					<p class="text-sm text-gray-600">{token.description}</p>
				{/if}
			</div>
		{/if}

		<div class="flex items-center gap-2">
			{#if isChecking}
				<div class="flex items-center gap-2 text-sm text-blue-600">
					<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<span>Checking...</span>
					<button on:click={() => setChecking(false)} class="ml-2 text-xs text-gray-500 underline">
						Cancel
					</button>
				</div>
			{:else if tokenInfo}
				<div class="flex items-center gap-2 text-sm text-green-600">
					<span>✓</span>
					<span>{tokenInfo.name || tokenInfo.symbol || 'Valid Token'}</span>
				</div>
			{:else if error}
				<div class="flex items-center gap-2 text-sm text-red-600">
					<span>✗</span>
					<span>{error}</span>
					<button on:click={() => resetState()} class="ml-2 text-xs text-gray-500 underline">
						Clear
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div class="flex gap-2">
		<input
			type="text"
			placeholder="Token contract address (0x...)"
			bind:value={inputValue}
			on:input={onInputChange}
			class="flex-1 rounded-lg border border-gray-300 px-3 py-2 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
			class:border-red-300={error}
			class:border-green-300={tokenInfo}
			class:border-blue-300={isChecking}
		/>

		<button
			type="button"
			on:click={forceValidate}
			disabled={!inputValue || isChecking}
			class="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
		>
			Check
		</button>
	</div>

	<!-- Debug info -->
	<div class="text-xs text-gray-500">
		Debug: {inputValue.slice(0, 10)}... | Checking: {isChecking} | Error: {error || 'none'} | Token:
		{tokenInfo?.symbol || 'none'}
	</div>
</div>
