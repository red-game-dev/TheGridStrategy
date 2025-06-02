<script lang="ts">
	export let maxReturns: string;
	export let isConnected: boolean;
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	<div class="rounded-lg bg-green-50 p-4">
		<h3 class="font-semibold text-green-800">Maximum Return</h3>
		<p class="text-2xl font-bold text-green-600">${Number(maxReturns).toFixed(2)}</p>
		<p class="text-sm text-green-700">If all grid levels sell</p>
	</div>
	<div class="rounded-lg bg-blue-50 p-4">
		<h3 class="font-semibold text-blue-800">Strategy Status</h3>
		<p class="text-2xl font-bold text-blue-600">
			{isConnected ? 'Ready' : 'Wallet Required'}
		</p>
		<p class="text-sm text-blue-700">
			{isConnected ? 'Ready to deploy' : 'Connect wallet to deploy'}
		</p>
	</div>
</div>
