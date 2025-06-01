<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { OrderIOCfg, TokenInfo, DotrainOrderGui } from '$lib/types';
  import { debugLog } from '$lib/config/debug';
  import { validationStore } from '$lib/stores/validation';
  import { strategyStore } from '$lib/stores/strategy';
  import { strategyRegistry } from '$lib/strategies';
  
  export let index: number;
  export let label: string;
  export let vault: OrderIOCfg;
  export let gui: DotrainOrderGui | null;
  export let allTokenInfos: TokenInfo[];
  
  const dispatch = createEventDispatcher<{ 
    change: { index: number; label: string; value: string } 
  }>();
  
  let inputValue = '';
  let tokenInfo: TokenInfo | null = null;
  let hasError = false;
  let errorMessages: string[] = [];
  let localError = '';
  
  $: currentStrategy = strategyRegistry.get($strategyStore.strategyKey);
  
  $: validation = $validationStore;
  $: {
    const isInput = label === 'Input';
    const vaultType = isInput ? 'input' : 'output';
    const fieldPath = `vaultIds.${vaultType}.${index}`;
    const validationErrors = validation.errors[fieldPath] || [];
    hasError = validationErrors.length > 0 || localError !== '';
    errorMessages = localError ? [localError, ...validationErrors] : validationErrors;
  }
  
  $: if (vault.token?.key && allTokenInfos) {
    const info = allTokenInfos.find((token: TokenInfo) => 
      token.address === vault.token?.key
    );
    tokenInfo = info || null;
    debugLog.log(`Token info for ${label} ${index}:`, tokenInfo);
  }
  
  onMount(() => {
    if (gui) {
      loadVaultId();
    }
  });
  
  function loadVaultId() {
    if (!gui) return;
    
    try {
      const result = gui.getVaultIds();
      if (!result.error && result.value) {
        const vaultIds = result.value;
        const isInput = label === 'Input';
        
        const vaultIdArray = isInput ? vaultIds.get('input') : vaultIds.get('output');
        const vaultId = vaultIdArray?.[index];
        
        if (vaultId !== undefined && vaultId !== null) {
          inputValue = String(vaultId);
          debugLog.log(`Loaded vault ID for ${label} ${index}:`, vaultId);
        }
      }
    } catch (error) {
      debugLog.error(`Error loading vault ID for ${label} ${index}:`, error);
    }
  }
  
  function validateInput(value: string): string {
    if (!value || value.trim() === '') {
      return ''; 
    }
    
    if (!/^\d+$/.test(value)) {
      return 'Vault ID must be a positive integer';
    }
    
    const num = parseInt(value);
    
    if (isNaN(num)) {
      return 'Must be a valid number';
    }
    
    if (num < 0) {
      return 'Vault ID must be positive';
    }
    
    if (num === 0) {
      return 'Vault ID must be greater than 0';
    }
    
    if (num > 1000000) {
      return 'Vault ID seems unreasonably large';
    }
    
    return '';
  }
  
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value.trim();
    inputValue = value;
    
    localError = '';
    
    const validationError = validateInput(value);
    if (validationError) {
      localError = validationError;
      return;
    }
    
    if (gui) {
      try {
        const isInput = label === 'Input';
        gui.setVaultId(isInput, index, value);
        debugLog.log(`Set vault ID for ${label} ${index}:`, value);
      } catch (error) {
        debugLog.error(`Error setting vault ID for ${label} ${index}:`, error);
        localError = 'Failed to save vault ID';
        return;
      }
    }
    
    if (currentStrategy && value.trim()) {
      try {
        const mockFieldBinding = `vaultIds.${label === 'Input' ? 'input' : 'output'}.${index}`;
        debugLog.log(`Dynamic validation for vault ID ${mockFieldBinding}:`, value);
      } catch (error) {
        debugLog.warn('Dynamic vault ID validation failed:', error);
      }
    }
    
    dispatch('change', { 
      index, 
      label, 
      value: value
    });
  }
  
  function handleBlur() {
    if (inputValue && !localError) {
      const validationError = validateInput(inputValue);
      if (validationError) {
        localError = validationError;
      }
    }
  }
  
  function clearInput() {
    inputValue = '';
    localError = '';
    handleInput({ target: { value: '' } } as any);
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold text-gray-900">
      {label} {index + 1}
      {#if tokenInfo?.symbol}
        <span class="text-sm font-normal text-gray-600">({tokenInfo.symbol})</span>
      {/if}
    </h3>
    
    {#if inputValue}
      <button
        on:click={clearInput}
        class="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Clear
      </button>
    {/if}
  </div>
  
  <p class="text-sm text-gray-600">
    {tokenInfo?.symbol || 'Token'} vault ID for this {label.toLowerCase()}
  </p>
  
  {#if tokenInfo}
    <div class="text-xs text-gray-500 bg-gray-50 p-2 rounded">
      <strong>Token:</strong> {tokenInfo.name || tokenInfo.symbol}<br>
      <strong>Address:</strong> <code class="text-xs">{tokenInfo.address}</code>
    </div>
  {/if}
  
  <div class="relative">
    <input
      type="text"
      inputmode="numeric"
      placeholder="Enter vault ID (optional)"
      bind:value={inputValue}
      on:input={handleInput}
      on:blur={handleBlur}
      class="w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors
             {hasError ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}"
    />
    
    {#if inputValue && !hasError}
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <span class="text-xs text-green-600">✓</span>
      </div>
    {:else if hasError}
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <span class="text-xs text-red-600">✗</span>
      </div>
    {/if}
  </div>
  
  <!-- Error messages -->
  {#if hasError && errorMessages.length > 0}
    <div class="space-y-1">
      {#each errorMessages as error}
        <p class="text-xs text-red-600">{error}</p>
      {/each}
    </div>
  {/if}
  
  <!-- Validation hints -->
  <div class="text-xs text-gray-500">
    <p>💡 Vault IDs are optional. Leave empty to use default vault behavior.</p>
    <p>📝 Must be a positive integer if specified (e.g., 1, 2, 100)</p>
  </div>
</div>