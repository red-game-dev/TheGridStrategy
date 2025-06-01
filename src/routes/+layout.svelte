<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Container from '$lib/components/layout/Container.svelte';
    import Header from '$lib/components/layout/Header.svelte';
	
	onMount(() => {
	  if (browser) {
		// Initialize wallet connection on app load
		initializeWalletConnection();
	  }
	});
	
	/**
	 * Initialize wallet connection and set up listeners
	 */
	async function initializeWalletConnection() {
	  try {
		// Dynamic import to avoid SSR issues
		const { walletStore } = await import('$lib/stores/wallet');
		
		// Initialize wallet state
		await walletStore.initialize();
		
	  } catch (error) {
		console.error('Failed to initialize wallet connection:', error);
	  }
	}
  </script>
  
  <svelte:head>
	<title>Grid Strategy - Automated Grid Trading</title>
	<meta name="description" content="Deploy automated grid trading strategies across multiple blockchains" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
  </svelte:head>
  
  <div class="min-h-screen bg-gray-50">
	<Header />
	<Container>
	  <slot />
	</Container>
  </div>