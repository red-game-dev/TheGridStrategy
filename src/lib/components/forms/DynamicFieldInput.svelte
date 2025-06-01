<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { GuiFieldDefinitionCfg, DotrainOrderGui } from '$lib/types';
	import { strategyRegistry } from '$lib/strategies';
	import { DynamicSchemaBuilder } from '$lib/validations/DynamicSchemaBuilder';
	import ValidationErrors from '$lib/components/ui/ValidationErrors.svelte';
	import { validationStore } from '$lib/stores/validation';
	import { strategyStore } from '$lib/stores/strategy';
	import { debugLog, shouldShowDebug } from '$lib/config/debug';
	import Icon from '$lib/components/ui/Icon.svelte';
	import DebugPanel from '$lib/components/debug/DebugPanel.svelte';

	export let fieldDefinition: GuiFieldDefinitionCfg;
	export let gui: DotrainOrderGui | null;

	const dispatch = createEventDispatcher<{
		change: { binding: string; value: string };
	}>();

	let inputValue = '';
	let isLoading = false;

	$: strategy = strategyRegistry.get($strategyStore.strategyKey);
	$: fieldMetadata = strategy?.getFieldMetadata(fieldDefinition.binding);

	$: validation = $validationStore;
	$: fieldPath = `parameters.${fieldDefinition.binding}`;
	$: hasError = validation.errors[fieldPath]?.length > 0;
	$: isRequired = fieldMetadata?.validation?.required ?? !fieldDefinition.showCustomField;

	$: inputType = fieldMetadata?.inputType || getInputTypeFallback(fieldDefinition.binding);
	$: step = fieldMetadata?.step || getStepFallback(fieldDefinition.binding);
	$: placeholder = fieldMetadata?.placeholder || fieldDefinition.name;
	$: helpText = fieldMetadata?.helpText || '';
	$: min = fieldMetadata?.min || '0';
	$: max = fieldMetadata?.max;

	$: if (gui && fieldDefinition) {
		initializeFieldValue();
	}

	async function initializeFieldValue() {
		if (!gui) return;

		try {
			const result = gui.getFieldValue(fieldDefinition.binding);
			if (result.value !== null && result.value !== undefined) {
				inputValue = result.value.toString();
			} else if (fieldDefinition.default) {
				inputValue = fieldDefinition.default.toString();
			}
		} catch (error) {
			debugLog.warn('Failed to get field value:', error);
		}
	}

	async function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;

		inputValue = value;

		validationStore.clearFieldErrors(fieldPath);

		if (strategy && value.trim()) {
			try {
				const fieldErrors = DynamicSchemaBuilder.validateField(
					strategy,
					fieldDefinition.binding,
					value
				);
				if (fieldErrors.length > 0) {
					fieldErrors.forEach((error) => {
						validationStore.addFieldError(fieldPath, error);
					});
				}
				debugLog.log(`Dynamic validation for ${fieldDefinition.binding}:`, fieldErrors);
			} catch (error) {
				debugLog.warn('Dynamic field validation failed:', error);
			}
		}

		dispatch('change', {
			binding: fieldDefinition.binding,
			value: value
		});
	}

	function handlePresetSelect(event: Event) {
		const target = event.target as HTMLSelectElement;
		const value = target.value;

		if (value) {
			inputValue = value;
			dispatch('change', {
				binding: fieldDefinition.binding,
				value: value
			});
		}
	}

	function getInputTypeFallback(binding: string): string {
		if (
			binding.includes('ratio') ||
			binding.includes('growth') ||
			binding.includes('size') ||
			binding.includes('seconds')
		) {
			return 'number';
		}
		return 'text';
	}

	function getStepFallback(binding: string): string {
		if (binding.includes('ratio') || binding.includes('growth')) {
			return '0.01';
		}
		if (binding.includes('size')) {
			return '0.001';
		}
		return 'any';
	}
</script>

<div class="dynamic-field-input" data-testid="dynamic-field-input">
	<label
		for={`field-${fieldDefinition.binding}`}
		class="mb-2 block text-sm font-medium text-gray-700"
		data-testid="field-label"
	>
		{fieldDefinition.name}
		{#if isRequired}
			<span class="text-red-500" data-testid="field-required">*</span>
		{/if}

		{#if fieldDefinition.description}
			<span class="mt-1 block text-xs font-normal text-gray-500" data-testid="field-description">
				{fieldDefinition.description}
			</span>
		{/if}
	</label>

	<div class="space-y-2" data-testid="field-wrapper">
		<div class="relative" data-testid="field-input-wrapper">
			{#if inputType === 'select' && fieldMetadata}
				<select
					bind:value={inputValue}
					on:change={handleInput}
					class="w-full rounded-lg border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                 {hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                 {isLoading ? 'cursor-not-allowed opacity-50' : ''}"
					disabled={isLoading}
					required={isRequired}
					id={`field-${fieldDefinition.binding}`}
					data-testid={`field-${fieldDefinition.binding}`}
				>
					<option value="">Select {fieldDefinition.name}</option>
				</select>
			{:else}
				<input
					type={inputType}
					{step}
					{min}
					{max}
					bind:value={inputValue}
					on:input={handleInput}
					{placeholder}
					class="w-full rounded-lg border px-3 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                 {hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                 {isLoading ? 'cursor-not-allowed opacity-50' : ''}"
					class:border-red-300={hasError}
					class:bg-red-50={hasError}
					disabled={isLoading}
					required={isRequired}
					data-testid={`field-${fieldDefinition.binding}`}
				/>
			{/if}

			{#if isLoading}
				<div class="absolute inset-y-0 right-0 flex items-center pr-3" data-testid="field-loading">
					<Icon name="spinner" size="sm" classNames="text-gray-400" animate={true} />
				</div>
			{/if}
		</div>

		{#if fieldDefinition.presets && fieldDefinition.presets.length > 0}
			<div class="flex items-center gap-2 text-sm" data-testid="field-presets">
				<span class="text-gray-600">Quick select:</span>
				<select
					on:change={handlePresetSelect}
					class="rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
					data-testid={`preset-${fieldDefinition.binding}`}
				>
					<option value="">Choose preset...</option>
					{#each fieldDefinition.presets as preset (preset.value)}
						<option value={preset.value}>{preset.name}</option>
					{/each}
				</select>
			</div>
		{/if}

		{#if helpText}
			<p class="text-xs text-gray-500" data-testid="field-help">
				💡 {helpText}
			</p>
		{/if}

		{#if fieldMetadata}
			{#if shouldShowDebug('debugPanels')}
				<DebugPanel title="Field Metadata (Debug)" collapsible={true} defaultCollapsed={false}>
					<div slot="content">
						<details class="text-xs text-gray-400" data-testid="field-debug">
							<pre class="mt-1 text-xs">{JSON.stringify(fieldMetadata, null, 2)}</pre>
						</details>
					</div>
				</DebugPanel>
			{/if}
		{/if}
	</div>

	<ValidationErrors fieldName={fieldPath} />
</div>

<style>
	.dynamic-field-input {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	input:invalid {
		box-shadow: none;
	}
</style>
