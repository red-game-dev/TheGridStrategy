<!-- lib/components/debug/DebugPanel.svelte -->
<script lang="ts">
	import { shouldShowDebug } from '$lib/config/debug';

	export let title: string = 'Debug Info';
	export let data: any = {};
	export let feature: 'logging' | 'debugPanels' | 'verboseErrors' | 'stateLogging' | undefined =
		'debugPanels';
	export let collapsible: boolean = true;
	export let defaultCollapsed: boolean = false;

	let isCollapsed = defaultCollapsed;

	$: showDebug = shouldShowDebug(feature);

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(JSON.stringify(data, null, 2));
	}
</script>

{#if showDebug}
	<div class="debug-panel rounded-lg border border-blue-200 bg-blue-50 p-4 font-mono text-sm">
		<div class="mb-2 flex items-center justify-between">
			<h3 class="flex items-center gap-2 font-semibold text-blue-800">
				🐛 {title}
				<span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">DEV</span>
			</h3>
			<div class="flex gap-2">
				<button
					on:click={copyToClipboard}
					class="rounded bg-blue-200 px-2 py-1 text-xs text-blue-800 hover:bg-blue-300"
					title="Copy debug data"
				>
					📋
				</button>
				{#if collapsible}
					<button
						on:click={toggleCollapse}
						class="rounded bg-blue-200 px-2 py-1 text-xs text-blue-800 hover:bg-blue-300"
					>
						{isCollapsed ? '👁️' : '🙈'}
					</button>
				{/if}
			</div>
		</div>

		{#if !isCollapsed}
			<div class="space-y-2">
				<slot name="content">
					<pre class="max-h-64 overflow-auto rounded border border-blue-300 bg-white p-3 text-xs">
  {JSON.stringify(data, null, 2)}
            </pre>
				</slot>

				<slot name="controls"></slot>
			</div>
		{/if}
	</div>
{/if}

<style>
	.debug-panel {
		position: relative;
	}

	.debug-panel::before {
		content: '';
		position: absolute;
		top: -1px;
		left: -1px;
		right: -1px;
		bottom: -1px;
		background: linear-gradient(45deg, #3b82f6, #1d4ed8);
		border-radius: inherit;
		z-index: -1;
		opacity: 0.1;
	}
</style>
