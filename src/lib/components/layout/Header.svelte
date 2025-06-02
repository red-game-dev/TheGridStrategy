<script lang="ts">
	import { strategyStore } from '$lib/stores/strategy';

	$: strategy = $strategyStore;
</script>

<header class="w-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 py-8 text-white">
	<div class="mx-auto max-w-4xl px-4">
		<h1 class="mb-2 text-4xl font-bold">
			{strategy.strategyDetails?.name || 'Grid Strategy'}
		</h1>
		<p class="text-xl opacity-90">
			{strategy.strategyDetails?.short_description || 'Automated grid trading strategy'}
		</p>
	</div>
</header>
