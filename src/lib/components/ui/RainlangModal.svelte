<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let code: string;

	const dispatch = createEventDispatcher<{ close: void }>();

	function handleClose() {
		dispatch('close');
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
</script>

<div
	class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
	on:click={handleBackdropClick}
	on:keydown={(e) => e.key === 'Escape' && handleClose()}
	role="dialog"
	tabindex="0"
	aria-modal="true"
	aria-labelledby="rainlang-title"
>
	<div class="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white">
		<div class="border-b border-gray-200 p-6">
			<div class="flex items-center justify-between">
				<h3 id="rainlang-title" class="text-lg font-semibold">Generated Rainlang</h3>
				<button
					on:click={handleClose}
					class="text-xl text-gray-500 hover:text-gray-700"
					aria-label="Close modal"
				>
					✕
				</button>
			</div>
		</div>
		<div class="overflow-auto p-6">
			<pre
				class="overflow-auto rounded-lg bg-gray-100 p-4 font-mono text-sm whitespace-pre-wrap">{code}</pre>
		</div>
	</div>
</div>
