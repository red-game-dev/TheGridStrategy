<script lang="ts">
    import { strategyStore } from '$lib/stores/strategy';
    
    $: strategy = $strategyStore;
  </script>
  
  <header class="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white py-8 w-full">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-4xl font-bold mb-2">
        {strategy.strategyDetails?.name || 'Grid Strategy'}
      </h1>
      <p class="text-xl opacity-90">
        {strategy.strategyDetails?.short_description || 'Automated grid trading strategy'}
      </p>
    </div>
  </header>