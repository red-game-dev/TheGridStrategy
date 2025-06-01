<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { GuiDepositCfg, TokenInfo, DotrainOrderGui } from '$lib/types';
  import { validationStore } from '$lib/stores/validation';
  import { debugLog, shouldShowDebug } from '$lib/config/debug';
	import { strategyRegistry } from '$lib/strategies';
	import { strategyStore } from '$lib/stores/strategy';
	import DebugPanel from '$lib/components/debug/DebugPanel.svelte';
  
  export let deposit: GuiDepositCfg;
  export let index: number;
  export let gui: DotrainOrderGui | null;
  export let allTokenInfos: TokenInfo[];
  
  const dispatch = createEventDispatcher<{
    change: { tokenKey: string; amount: string };
  }>();
  
  let inputValue = '';
  let tokenInfo: TokenInfo | null = null;
  let hasError = false;
  let errorMessages: string[] = [];
  let localError = '';
  
  // Get current strategy for validation
  $: currentStrategy = strategyRegistry.get($strategyStore.strategyKey);

  // Reactive validation
  $: validation = $validationStore;
  $: {
    if (deposit.token?.key) {
      const fieldPath = `deposits.${deposit.token.key}`;
      const validationErrors = validation.errors[fieldPath] || [];
      hasError = validationErrors.length > 0 || localError !== '';
      errorMessages = localError ? [localError, ...validationErrors] : validationErrors;
    }
  }
  
  // Find token info
  $: if (deposit.token?.key && allTokenInfos) {
    const info = allTokenInfos.find((token: TokenInfo) => 
      token.address === deposit.token?.key
    );
    tokenInfo = info || null;
    debugLog.log(`Token info for deposit ${index}:`, tokenInfo);
  }
  
  onMount(() => {
    if (gui && deposit.token?.key) {
      loadDepositAmount();
    }
  });
  
  // Load existing deposit amount from GUI
  function loadDepositAmount() {
    if (!gui || !deposit.token?.key) return;
    
    try {
      const deposits = gui.getDeposits();
      if (!deposits.error) {
        const currentDeposit = deposits.value.find((d: any) => d.token === deposit.token?.key);
        if (currentDeposit && currentDeposit.amount) {
          inputValue = currentDeposit.amount;
          debugLog.log(`Loaded deposit amount for ${deposit.token.key}:`, currentDeposit.amount);
        }
      }
    } catch (error) {
      debugLog.error(`Error loading deposit amount for ${deposit.token?.key}:`, error);
    }
  }
  
  function validateInput(value: string): string {
    if (!value || value.trim() === '') {
      return ''; // Empty is valid
    }
    
    // Check if it's a valid number format
    if (!/^\d*\.?\d*$/.test(value)) {
      return 'Must be a valid number (digits and decimal point only)';
    }
    
    const num = parseFloat(value);
    
    if (isNaN(num)) {
      return 'Must be a valid number';
    }
    
    if (num < 0) {
      return 'Amount must be positive';
    }
    
    if (num === 0) {
      return 'Amount must be greater than 0';
    }
    
    // Check for reasonable maximum (optional - adjust as needed)
    if (num > 1000000000) {
      return 'Amount seems unreasonably large';
    }
    
    return ''; // Valid
  }
  
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    inputValue = value;
    
    if (!deposit.token?.key) return;
    
    // Clear previous local error
    localError = '';
    
    // Validate input
    const validationError = validateInput(value);
    if (validationError) {
      localError = validationError;
      return; // Don't dispatch if invalid
    }
    
    // Dispatch change event for valid inputs (including empty)
    dispatch('change', {
      tokenKey: deposit.token.key,
      amount: value.trim()
    });
  }
  
  function handleBlur() {
    // Additional validation on blur
    if (inputValue && !localError) {
      const validationError = validateInput(inputValue);
      if (validationError) {
        localError = validationError;
      }
    }
  }
  
  function clearInput() {
    if (!deposit.token?.key) return;
    
    inputValue = '';
    localError = '';
    dispatch('change', {
      tokenKey: deposit.token.key,
      amount: ''
    });
  }
  
  function formatTokenAmount(amount: string): string {
    if (!amount || !tokenInfo?.decimals) return amount;
    
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    
    // Format to appropriate decimal places based on token
    const decimals = Math.min(tokenInfo.decimals, 6); // Max 6 decimal places for display
    return num.toFixed(decimals).replace(/\.?0+$/, ''); // Remove trailing zeros
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-semibold text-gray-900">
      Deposit amount
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
    The amount of {tokenInfo?.symbol || 'tokens'} that you want to deposit into the strategy.
  </p>
  
  {#if tokenInfo}
    <div class="text-xs text-gray-500 bg-gray-50 p-2 rounded">
      <strong>Token:</strong> {tokenInfo.name || tokenInfo.symbol}<br>
      <strong>Decimals:</strong> {tokenInfo.decimals}<br>
      <strong>Address:</strong> <code class="text-xs">{tokenInfo.address}</code>
    </div>
  {/if}
  
  <div class="relative">
    <input
      type="number"
      inputmode="decimal"
      placeholder="Enter deposit amount (e.g., 100.5)"
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
  
  <!-- Formatted amount display -->
  {#if inputValue && !hasError && tokenInfo}
    <p class="text-xs text-gray-600">
      💡 Formatted: {formatTokenAmount(inputValue)} {tokenInfo.symbol}
    </p>
  {/if}
  
  <!-- Validation hints -->
  <div class="text-xs text-gray-500">
    <p>💡 Enter a positive number. This amount will be deposited when the strategy is deployed.</p>
    <p>📝 Examples: 100, 50.5, 1000.25</p>
    {#if currentStrategy}
      <p>🔧 Using {currentStrategy.name} strategy validation</p>
    {/if}
  </div>
  
  <!-- Debug info for development -->
  {#if currentStrategy}
    {#if shouldShowDebug('debugPanels')}
      <DebugPanel title="Strategy Info (Debug)" collapsible={true} defaultCollapsed={false}>
        <div slot="content">
          <details class="text-xs text-gray-400">
            <div class="mt-1 text-xs">
              <p><strong>Strategy:</strong> {currentStrategy.name} v{currentStrategy.version}</p>
              <p><strong>Description:</strong> {currentStrategy.description}</p>
              <p><strong>Deposit Token:</strong> {deposit.token?.key || 'None'}</p>
            </div>
          </details>
        </div>
      </DebugPanel>
    {/if}
  {/if}
</div>