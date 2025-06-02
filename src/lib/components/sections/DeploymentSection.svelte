<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import { walletStore } from '$lib/stores/wallet';
	import { strategyStore } from '$lib/stores/strategy';
	import { deploymentStore } from '$lib/stores/deployment';
	import { validationStore } from '$lib/stores/validation';
	import Icon from '$lib/components/ui/Icon.svelte';

	export let canSubmit: boolean;
	export let hasRequiredValues: boolean;

	const dispatch = createEventDispatcher<{
		deploy: void;
	}>();

	$: wallet = $walletStore;
	$: strategy = $strategyStore;
	$: deployment = $deploymentStore;
	$: validation = $validationStore;

	function handleDeploy() {
		dispatch('deploy');
	}
</script>

<section class="rounded-lg p-6 shadow-md">
	<!-- Success message (persistent) -->
	{#if deployment.currentStep === 'success' && deployment.explorerUrl}
		<div class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
			<div class="mb-2 flex items-center gap-2">
				<Icon name="check-circle" classNames="text-green-600" />
				<p class="font-semibold text-green-800">Strategy deployed successfully!</p>
			</div>
			<p class="mb-3 text-sm text-green-700">
				Your grid strategy has been deployed to the blockchain. You can now configure and deploy
				another strategy.
			</p>
			<div class="flex gap-3">
				<a
					href={deployment.explorerUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
				>
					<Icon name="external-link" size="sm" />
					View on Explorer
				</a>
				{#if deployment.transactionHash}
					<button
						on:click={() => navigator.clipboard.writeText(deployment.transactionHash || '')}
						class="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
					>
						<Icon name="copy" size="sm" />
						Copy TX Hash
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Deploy button -->
	<div class="flex flex-wrap gap-4">
		<button
			type="button"
			on:click={handleDeploy}
			disabled={!canSubmit || deployment.isDeploying}
			class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 px-8
               py-3 font-semibold text-white
               transition-all hover:from-purple-700
               hover:to-red-700 disabled:cursor-not-allowed disabled:opacity-50"
			data-testid="deploy-button"
		>
			{#if deployment.isDeploying}
				<LoadingSpinner size="small" />
				{deployment.currentStep === 'approving' ? 'Approving...' : 'Deploying...'}
			{:else}
				Deploy Strategy
			{/if}
		</button>
	</div>

	<!-- Requirements checklist -->
	{#if !canSubmit && !deployment.isDeploying}
		<div class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
			<h4 class="mb-2 text-sm font-semibold text-blue-800">Before you can deploy:</h4>
			<ul class="space-y-1 text-sm text-blue-700">
				{#if !wallet.isConnected}
					<li class="flex items-center gap-2">
						<Icon name="clock" size="sm" />
						Connect your wallet
					</li>
				{/if}
				{#if !strategy.allTokensSelected}
					<li class="flex items-center gap-2">
						<Icon name="clock" size="sm" />
						Select both tokens
					</li>
				{/if}
				{#if !hasRequiredValues}
					<li class="flex items-center gap-2">
						<Icon name="clock" size="sm" />
						Fill in all required strategy parameters
					</li>
				{/if}
				{#if !validation.isValid && hasRequiredValues}
					<li class="flex items-center gap-2">
						<Icon name="clock" size="sm" />
						Fix form validation errors
					</li>
				{/if}
			</ul>
		</div>
	{/if}

	<!-- Error display -->
	{#if deployment.error}
		<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
			<div class="flex items-start gap-2">
				<Icon name="error" classNames="text-red-500 flex-shrink-0 mt-0.5" />
				<div class="min-w-0 flex-1">
					<h4 class="mb-1 text-sm font-semibold text-red-800">Deployment Failed</h4>
					<p
						class="overflow-wrap-anywhere text-sm leading-relaxed break-words whitespace-pre-wrap text-red-700"
					>
						{deployment.error}
					</p>
				</div>
			</div>
		</div>
	{/if}
</section>
