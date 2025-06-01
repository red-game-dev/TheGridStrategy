<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { NameAndDescriptionCfg } from '$lib/types';
    import { getNetworkName } from '$lib/utils/helpers';
    
    export let deployments: Array<{ key: string; value: NameAndDescriptionCfg | undefined }>;
    export let selected: string;
    
    const dispatch = createEventDispatcher<{ change: string }>();
    
    function handleSelection(deploymentKey: string) {
      if (deploymentKey !== selected) {
        dispatch('change', deploymentKey);
      }
    }
  </script>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    {#each deployments as { key, value: deployment }}
      <button
        on:click={() => handleSelection(key)}
        class="p-4 rounded-lg border-2 transition-colors text-left {
          selected === key
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }"
      >
        <h3 class="font-semibold">{deployment?.name || getNetworkName(key)}</h3>
        <p class="text-sm text-gray-600 mt-1">{deployment?.description || ''}</p>
      </button>
    {/each}
  </div>