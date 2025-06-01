<script lang="ts">
    import GridVisualization from '$lib/components/charts/GridVisualization.svelte';
    import PotentialReturns from '$lib/components/charts/PotentialReturns.svelte';
	import type { GridLevel } from '$lib/strategies';
    
    export let gridLevels: GridLevel[];
    export let maxReturns: string;
    export let isWalletConnected: boolean;
  </script>
  
  <!-- Grid Visualization -->
  {#if gridLevels.length > 0}
    <section class="bg-white rounded-lg shadow-md p-6">
      <GridVisualization {gridLevels} />
    </section>
  {/if}
  
  <!-- Potential Returns -->
  <section class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Potential Returns</h2>
    <PotentialReturns 
      {maxReturns}
      isConnected={isWalletConnected}
    />
  </section>