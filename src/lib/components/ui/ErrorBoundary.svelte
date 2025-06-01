<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let error: string;
	export let title: string = 'Error';

	const dispatch = createEventDispatcher<{ retry: void }>();

	function handleRetry() {
		dispatch('retry');
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
		<h3 class="mb-2 font-semibold text-red-800">{title}</h3>
		<p class="mb-4 text-red-600">{error}</p>
		<button
			on:click={handleRetry}
			class="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
		>
			Retry
		</button>
	</div>
</div>
