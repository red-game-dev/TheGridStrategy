<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { walletStore } from '$lib/stores/wallet.js';
  import { formatAddress, formatBalance } from '$lib/utils/helpers.js';
  import { debugLog } from '$lib/config/debug';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { modal } from '$lib/config/appKit.js';
  
  $: wallet = $walletStore;
  
  let mounted = false;
  let watchUnsubscribe: (() => void) | null = null;
  let isDisconnecting = false; // Add flag to prevent race conditions
  
  onMount(() => {
    mounted = true;
    
    if (browser) {
      // Initialize wallet state
      walletStore.initialize().then(() => setupWagmiWatcher());
    }
    
    return () => {
      if (watchUnsubscribe) {
        watchUnsubscribe();
      }
    };
  });
  
  async function setupWagmiWatcher() {
    try {
      const { watchAccount } = await import('@wagmi/core');
      const { config } = await import('$lib/config/wagmi.js');
      
      watchUnsubscribe = watchAccount(config, {
        onChange: (account) => {
          // Ignore changes during disconnection process
          if (isDisconnecting) {
            debugLog.log('Ignoring account change during disconnection');
            return;
          }
          
          debugLog.log('Account changed:', account);
          
          if (account.isConnected && account.address) {
            walletStore.setConnected(account.address, account.chainId || 1);
          } else {
            walletStore.setDisconnected();
          }
        }
      });
    } catch (error) {
      console.error('Failed to setup wagmi watcher:', error);
    }
  }
  
  async function handleConnect() {
    try {
      walletStore.setConnecting(true);
      
      if (modal) {
        await modal.open();
      }
    } catch (error) {
      console.error('Connection failed:', error);
      walletStore.setError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      walletStore.setConnecting(false);
    }
  }
  
  async function handleDisconnect() {
    try {
      isDisconnecting = true; // Set flag to prevent watcher interference
      
      // Immediately update UI to show disconnected state
      walletStore.setDisconnected();
      
      // Then perform actual disconnection
      const { disconnect } = await import('@wagmi/core');
      const { config } = await import('$lib/config/wagmi.js');
      
      await disconnect(config);
      
      // Wait a bit for everything to settle
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error('Disconnection failed:', error);
      // Even if disconnect fails, keep the UI disconnected
      walletStore.setDisconnected();
    } finally {
      // Re-enable watcher after disconnection is complete
      setTimeout(() => {
        isDisconnecting = false;
      }, 500);
    }
  }
  
  async function handleOpenModal() {
    try {
      if (modal) {
        await modal.open();
      }
    } catch (error) {
      console.error('Failed to open wallet modal:', error);
    }
  }
  
  async function handleRefresh() {
    try {
      await walletStore.refresh();
    } catch (error) {
      console.error('Failed to refresh wallet data:', error);
    }
  }
</script>

{#if mounted && browser}
  <div class="p-4 bg-white rounded-lg border shadow-sm w-full">
    {#if wallet.isConnected && wallet.address}
      <!-- Connected State - Simple Responsive -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <!-- Status and Account Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium text-green-600">Connected</span>
          </div>
          
          <div class="space-y-1">
            <div class="text-sm font-mono text-gray-800 break-all">
              {wallet.ensName || formatAddress(wallet.address)}
            </div>
            
            <div class="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              {#if wallet.networkName}
                <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
                  {wallet.networkName}
                </span>
              {/if}
              
              {#if wallet.balance}
                <span class="font-medium">
                  {formatBalance(wallet.balance)} {wallet.balance.symbol}
                </span>
              {/if}
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            on:click={handleRefresh}
            class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Refresh"
            aria-label="Refresh account data"
          >
            <Icon name="refresh" size="sm" />
          </button>
          
          <button
            on:click={handleOpenModal}
            class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            Manage
          </button>
          
          <button
            on:click={handleDisconnect}
            class="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    {:else}
      <!-- Not Connected State -->
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span class="text-sm font-medium text-gray-600">Not Connected</span>
        </div>
        
        <button
          on:click={handleConnect}
          disabled={wallet.isConnecting}
          class="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {#if wallet.isConnecting}
            <Icon name="refresh" size="sm" animate={true} />
            Connecting...
          {:else}
            <Icon name="link" size="sm" />
            Connect Wallet
          {/if}
        </button>
      </div>
    {/if}
    
    <!-- Error State -->
    {#if wallet.error}
      <div class="mt-3 flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
        <Icon name="alert-circle" size="sm" classNames="mt-0.5 flex-shrink-0" />
        <span class="flex-1 break-words">{wallet.error}</span>
        <button
          on:click={() => walletStore.clearError()}
          class="text-red-800 hover:text-red-900 flex-shrink-0"
          aria-label="Clear error"
        >
          <Icon name="x" size="sm" />
        </button>
      </div>
    {/if}
  </div>
{:else}
  <!-- Loading state -->
  <div class="p-4 bg-white rounded-lg border shadow-sm">
    <div class="animate-pulse flex flex-col sm:flex-row items-center gap-4">
      <div class="w-3 h-3 bg-gray-200 rounded-full"></div>
      <div class="h-4 bg-gray-200 rounded w-24"></div>
      <div class="h-8 bg-gray-200 rounded w-full sm:w-32"></div>
    </div>
  </div>
{/if}