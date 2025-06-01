<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { GuiFieldDefinitionCfg, DotrainOrderGui } from '$lib/types';
	import DynamicFieldInput from '$lib/components/forms/DynamicFieldInput.svelte';
	import ValidationErrors from '$lib/components/ui/ValidationErrors.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { validationStore } from '$lib/stores/validation';
	import { strategyStore } from '$lib/stores/strategy';

	export let fieldDefinitions: GuiFieldDefinitionCfg[];
	export let gui: DotrainOrderGui | null;

	const dispatch = createEventDispatcher<{
		fieldChange: { binding: string; value: string };
	}>();

	$: strategy = $strategyStore;
	$: validation = $validationStore;
	$: validationStatus = getValidationStatus();

	function getValidationStatus() {
		const hasRequiredValues = checkHasRequiredValues();

		if (!hasRequiredValues) {
			return {
				isValid: false,
				message: 'Please fill in all required fields',
				type: 'warning'
			};
		}

		if (Object.keys(validation.errors).length > 0) {
			return {
				isValid: false,
				message: `Please fix validation errors (${Object.keys(validation.errors).length} errors)`,
				type: 'error'
			};
		}

		if (validation.isValid && hasRequiredValues) {
			return {
				isValid: true,
				message: 'All parameters are valid',
				type: 'success'
			};
		}

		return {
			isValid: false,
			message: 'Please complete the form',
			type: 'warning'
		};
	}

	function checkHasRequiredValues(): boolean {
		const requiredFields = ['baseline-io-ratio', 'io-ratio-growth', 'tranche-size'];
		return requiredFields.every((field) => {
			const value = strategy.fieldValues[field];
			return value && value.trim() !== '' && value !== '0' && value !== 'NaN';
		});
	}

	function handleFieldChange(event: CustomEvent<{ binding: string; value: string }>) {
		dispatch('fieldChange', event.detail);
	}
</script>

<section class="rounded-lg bg-white p-6 shadow-md">
	<h2 class="mb-4 text-xl font-semibold text-gray-800">Strategy Parameters</h2>

	<!-- Form validation status indicator -->
	<div
		class="mb-4 rounded-lg p-3
      {validationStatus.type === 'success'
			? 'border border-green-200 bg-green-50'
			: validationStatus.type === 'error'
				? 'border border-red-200 bg-red-50'
				: 'border border-yellow-200 bg-yellow-50'}"
	>
		<div class="flex items-center gap-2 text-sm">
			{#if validationStatus.type === 'success'}
				<Icon name="check-circle" size="sm" classNames="text-green-600" />
				<span class="font-medium text-green-700">{validationStatus.message}</span>
			{:else if validationStatus.type === 'error'}
				<Icon name="error" size="sm" classNames="text-red-600" />
				<span class="font-medium text-red-700">{validationStatus.message}</span>
			{:else}
				<Icon name="warning" size="sm" classNames="text-yellow-600" />
				<span class="font-medium text-yellow-700">{validationStatus.message}</span>
			{/if}
		</div>
	</div>

	<!-- Global form validation errors -->
	<ValidationErrors showGlobalErrors={true} />

	<!-- Parameter fields -->
	<div class="space-y-6">
		{#each fieldDefinitions as field}
			<DynamicFieldInput fieldDefinition={field} {gui} on:change={handleFieldChange} />
		{/each}
	</div>
</section>
