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
  
  <section class="rounded-lg shadow-md p-6">
    <!-- Success message (persistent) -->
    {#if deployment.currentStep === 'success' && deployment.explorerUrl}
      <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center gap-2 mb-2">
          <Icon name="check-circle" classNames="text-green-600" />
          <p class="text-green-800 font-semibold">Strategy deployed successfully!</p>
        </div>
        <p class="text-green-700 text-sm mb-3">
          Your grid strategy has been deployed to the blockchain. You can now configure and deploy another strategy.
        </p>
        <div class="flex gap-3">
          <a
            href={deployment.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Icon name="external-link" size="sm" />
            View on Explorer
          </a>
          {#if deployment.transactionHash}
            <button
              on:click={() => navigator.clipboard.writeText(deployment.transactionHash || '')}
              class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
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
        class="px-8 py-3 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white rounded-lg font-semibold 
               hover:from-purple-700 hover:to-red-700 transition-all 
               disabled:opacity-50 disabled:cursor-not-allowed 
               flex items-center gap-2"
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
      <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 class="text-sm font-semibold text-blue-800 mb-2">Before you can deploy:</h4>
        <ul class="text-sm text-blue-700 space-y-1">
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
      <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-start gap-2">
          <Icon name="error" classNames="text-red-500 flex-shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-red-800 mb-1">Deployment Failed</h4>
            <p class="text-red-700 text-sm break-words overflow-wrap-anywhere whitespace-pre-wrap leading-relaxed">
              {deployment.error}
            </p>
          </div>
        </div>
      </div>
    {/if}
  </section>