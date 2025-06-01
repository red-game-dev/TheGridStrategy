import { writable } from 'svelte/store';
import type { DeploymentState } from '$lib/types';

/**
 * Deployment state store
 */
function createDeploymentStore() {
	const { subscribe, set, update } = writable<DeploymentState>({
		isDeploying: false,
		currentStep: 'idle'
	});

	return {
		subscribe,

		/**
		 * Start deployment process
		 */
		startDeployment: () =>
			update((state) => ({
				...state,
				isDeploying: true,
				currentStep: 'approving',
				error: undefined
			})),

		/**
		 * Set deployment step
		 */
		setStep: (step: DeploymentState['currentStep']) =>
			update((state) => ({ ...state, currentStep: step })),

		/**
		 * Set deployment success
		 */
		setSuccess: (transactionHash: string, explorerUrl: string) =>
			update((state) => ({
				...state,
				isDeploying: false,
				currentStep: 'success',
				transactionHash,
				explorerUrl,
				error: undefined
			})),

		/**
		 * Set deployment error
		 */
		setError: (error: string) =>
			update((state) => ({
				...state,
				isDeploying: false,
				currentStep: 'error',
				error
			})),

		/**
		 * Clear deployment success (when user starts new configuration)
		 */
		clearSuccess: () =>
			update((state) => ({
				...state,
				currentStep: 'idle',
				transactionHash: undefined,
				explorerUrl: undefined,
				error: undefined
			})),

		/**
		 * Reset deployment state completely
		 */
		reset: () =>
			set({
				isDeploying: false,
				currentStep: 'idle'
			})
	};
}

export const deploymentStore = createDeploymentStore();
