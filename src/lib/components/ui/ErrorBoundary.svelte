<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let error: string;
    export let title: string = 'Error';
    
    const dispatch = createEventDispatcher<{ retry: void }>();
    
    function handleRetry() {
      dispatch('retry');
    }
  </script>
  
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
      <h3 class="text-red-800 font-semibold mb-2">{title}</h3>
      <p class="text-red-600 mb-4">{error}</p>
      <button 
        on:click={handleRetry}
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>