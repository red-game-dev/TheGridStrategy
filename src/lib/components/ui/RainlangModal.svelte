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
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="dialog"
    tabindex="0"
    aria-modal="true"
    aria-labelledby="rainlang-title"
  >
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 id="rainlang-title" class="text-lg font-semibold">Generated Rainlang</h3>
          <button
            on:click={handleClose}
            class="text-gray-500 hover:text-gray-700 text-xl"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
      </div>
      <div class="p-6 overflow-auto">
        <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap font-mono">{code}</pre>
      </div>
    </div>
  </div>