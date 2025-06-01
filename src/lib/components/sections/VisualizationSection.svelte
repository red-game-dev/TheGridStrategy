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
	<section class="rounded-lg bg-white p-6 shadow-md">
		<GridVisualization {gridLevels} />
	</section>
{/if}

<!-- Potential Returns -->
<section class="rounded-lg bg-white p-6 shadow-md">
	<h2 class="mb-4 text-xl font-semibold text-gray-800">Potential Returns</h2>
	<PotentialReturns {maxReturns} isConnected={isWalletConnected} />
</section>
