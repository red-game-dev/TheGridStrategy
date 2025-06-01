<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { GuiSelectTokensCfg, DotrainOrderGui } from '$lib/types';
    import TokenSelector from '$lib/components/forms/TokenSelector.svelte';
    
    export let selectTokens: GuiSelectTokensCfg[];
    export let gui: DotrainOrderGui | null;
    
    const dispatch = createEventDispatcher<{
      tokenChange: { key: string; address: string };
    }>();
    
    function handleTokenChange(event: CustomEvent<{ key: string; address: string }>) {
      dispatch('tokenChange', event.detail);
    }
  </script>
  
  {#if selectTokens.length > 0}
    <section class="bg-white rounded-lg shadow-md p-6" data-testid="token-configuration">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Token Configuration</h2>
      <div class="space-y-4">
        {#each selectTokens as token}
          <TokenSelector 
            {token}
            {gui}
            on:change={handleTokenChange}
          />
        {/each}
      </div>
    </section>
  {/if}