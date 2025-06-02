<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { walletStore } from '$lib/stores/wallet.js';
	import { formatAddress, formatBalance } from '$lib/utils/helpers.js';
	import { debugLog } from '$lib/config/debug';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { modal } from '$lib/config/appKit.js';

	$: wallet = $walletStore;

	let mounted = false;
	let watchUnsubscribe: (() => void) | null = null;
	let isDisconnecting = false;

	onMount(() => {
		mounted = true;

		if (browser) {
			walletStore.initialize().then(() => setupWagmiWatcher());
		}

		return () => {
			if (watchUnsubscribe) {
				watchUnsubscribe();
			}
		};
	});

	async function setupWagmiWatcher() {
		try {
			const { watchAccount } = await import('@wagmi/core');
			const { config } = await import('$lib/config/wagmi.js');

			watchUnsubscribe = watchAccount(config, {
				onChange: (account) => {
					if (isDisconnecting) {
						debugLog.log('Ignoring account change during disconnection');
						return;
					}

					debugLog.log('Account changed:', account);

					if (account.isConnected && account.address) {
						walletStore.setConnected(account.address, account.chainId || 1);
					} else {
						walletStore.setDisconnected();
					}
				}
			});
		} catch (error) {
			console.error('Failed to setup wagmi watcher:', error);
		}
	}

	async function handleConnect() {
		try {
			walletStore.setConnecting(true);

			if (modal) {
				await modal.open();
			}
		} catch (error) {
			console.error('Connection failed:', error);
			walletStore.setError(error instanceof Error ? error.message : 'Connection failed');
		} finally {
			walletStore.setConnecting(false);
		}
	}

	async function handleDisconnect() {
		try {
			isDisconnecting = true;

			walletStore.setDisconnected();

			const { disconnect } = await import('@wagmi/core');
			const { config } = await import('$lib/config/wagmi.js');

			await disconnect(config);

			await new Promise((resolve) => setTimeout(resolve, 200));
		} catch (error) {
			console.error('Disconnection failed:', error);
			walletStore.setDisconnected();
		} finally {
			setTimeout(() => {
				isDisconnecting = false;
			}, 500);
		}
	}

	async function handleOpenModal() {
		try {
			if (modal) {
				await modal.open();
			}
		} catch (error) {
			console.error('Failed to open wallet modal:', error);
		}
	}

	async function handleRefresh() {
		try {
			await walletStore.refresh();
		} catch (error) {
			console.error('Failed to refresh wallet data:', error);
		}
	}
</script>

{#if mounted && browser}
	<div class="w-full rounded-lg border bg-white p-4 shadow-sm">
		{#if wallet.isConnected && wallet.address}
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div class="min-w-0 flex-1">
					<div class="mb-2 flex items-center gap-2">
						<div class="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
						<span class="text-sm font-medium text-green-600">Connected</span>
					</div>

					<div class="space-y-1">
						<div class="font-mono text-sm break-all text-gray-800">
							{wallet.ensName || formatAddress(wallet.address)}
						</div>

						<div class="flex flex-wrap items-center gap-2 text-xs text-gray-600">
							{#if wallet.networkName}
								<span class="rounded-md bg-blue-100 px-2 py-1 text-blue-700">
									{wallet.networkName}
								</span>
							{/if}

							{#if wallet.balance}
								<span class="font-medium">
									{formatBalance(wallet.balance)}
									{wallet.balance.symbol}
								</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="flex flex-shrink-0 items-center gap-2">
					<button
						on:click={handleRefresh}
						class="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
						title="Refresh"
						aria-label="Refresh account data"
					>
						<Icon name="refresh" size="sm" />
					</button>

					<button
						on:click={handleOpenModal}
						class="rounded-md px-3 py-1 text-sm text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800"
					>
						Manage
					</button>

					<button
						on:click={handleDisconnect}
						class="rounded-md px-3 py-1 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
					>
						Disconnect
					</button>
				</div>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-4 sm:flex-row">
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded-full bg-gray-400"></div>
					<span class="text-sm font-medium text-gray-600">Not Connected</span>
				</div>

				<button
					on:click={handleConnect}
					disabled={wallet.isConnecting}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
				>
					{#if wallet.isConnecting}
						<Icon name="refresh" size="sm" animate={true} />
						Connecting...
					{:else}
						<Icon name="link" size="sm" />
						Connect Wallet
					{/if}
				</button>
			</div>
		{/if}

		{#if wallet.error}
			<div class="mt-3 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
				<Icon name="alert-circle" size="sm" classNames="mt-0.5 flex-shrink-0" />
				<span class="flex-1 break-words">{wallet.error}</span>
				<button
					on:click={() => walletStore.clearError()}
					class="flex-shrink-0 text-red-800 hover:text-red-900"
					aria-label="Clear error"
				>
					<Icon name="x" size="sm" />
				</button>
			</div>
		{/if}
	</div>
{:else}
	<div class="rounded-lg border bg-white p-4 shadow-sm">
		<div class="flex animate-pulse flex-col items-center gap-4 sm:flex-row">
			<div class="h-3 w-3 rounded-full bg-gray-200"></div>
			<div class="h-4 w-24 rounded bg-gray-200"></div>
			<div class="h-8 w-full rounded bg-gray-200 sm:w-32"></div>
		</div>
	</div>
{/if}
