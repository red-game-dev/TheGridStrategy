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
	<section class="rounded-lg bg-white p-6 shadow-md" data-testid="token-configuration">
		<h2 class="mb-4 text-xl font-semibold text-gray-800">Token Configuration</h2>
		<div class="space-y-4">
			{#each selectTokens as token}
				<TokenSelector {token} {gui} on:change={handleTokenChange} />
			{/each}
		</div>
	</section>
{/if}
