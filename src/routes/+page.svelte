<script lang="ts">
  import StrategyDeploymentPage from '$lib/components/pages/StrategyDeploymentPage.svelte';
  
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  onMount(() => {
    if (browser) {
      console.log('Grid Strategy App initialized');
    }
  });
</script>

<svelte:head>
  <title>Grid Strategy - Raindex Trading</title>
  <meta name="description" content="Deploy grid trading strategies on Raindex" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <header class="py-6">
      <h1 class="text-3xl font-bold text-gray-900">Grid Strategy Deployment</h1>
      <p class="mt-2 text-gray-600">Configure and deploy automated grid trading strategies</p>
    </header>
    
    <StrategyDeploymentPage />
  </div>
</div>