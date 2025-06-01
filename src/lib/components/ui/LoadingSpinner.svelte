<script lang="ts">
	export let size: 'small' | 'medium' | 'large' = 'medium';
	export let message: string = '';

	const sizeClasses = {
		small: 'h-4 w-4',
		medium: 'h-8 w-8',
		large: 'h-12 w-12'
	};
</script>

<div class="flex items-center justify-center">
	<div class="animate-spin rounded-full border-b-2 border-blue-600 {sizeClasses[size]}"></div>
	{#if message}
		<span class="ml-3 text-gray-600">{message}</span>
	{/if}
</div>
