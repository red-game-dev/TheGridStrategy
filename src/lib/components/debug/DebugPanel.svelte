<!-- lib/components/debug/DebugPanel.svelte -->
<script lang="ts">
    import { shouldShowDebug } from '$lib/config/debug';
    
    export let title: string = 'Debug Info';
    export let data: any = {};
    export let feature: 'logging' | 'debugPanels' | 'verboseErrors' | 'stateLogging' | undefined = 'debugPanels';
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
    <div class="debug-panel bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm font-mono">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-semibold text-blue-800 flex items-center gap-2">
          🐛 {title}
          <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">DEV</span>
        </h3>
        <div class="flex gap-2">
          <button
            on:click={copyToClipboard}
            class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs hover:bg-blue-300"
            title="Copy debug data"
          >
            📋
          </button>
          {#if collapsible}
            <button
              on:click={toggleCollapse}
              class="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs hover:bg-blue-300"
            >
              {isCollapsed ? '👁️' : '🙈'}
            </button>
          {/if}
        </div>
      </div>
      
      {#if !isCollapsed}
        <div class="space-y-2">
          <slot name="content">
            <pre class="bg-white border border-blue-300 rounded p-3 text-xs overflow-auto max-h-64">
  {JSON.stringify(data, null, 2)}
            </pre>
          </slot>
          
          <slot name="controls">
          </slot>
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