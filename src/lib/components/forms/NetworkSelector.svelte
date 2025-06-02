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

<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
	{#each deployments as { key, value: deployment } (key)}
		<button
			on:click={() => handleSelection(key)}
			class="rounded-lg border-2 p-4 text-left transition-colors {selected === key
				? 'border-blue-500 bg-blue-50'
				: 'border-gray-200 hover:border-gray-300'}"
		>
			<h3 class="font-semibold">{deployment?.name || getNetworkName(key)}</h3>
			<p class="mt-1 text-sm text-gray-600">{deployment?.description || ''}</p>
		</button>
	{/each}
</div>
