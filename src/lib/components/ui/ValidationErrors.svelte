<script lang="ts">
  import { validationStore } from '$lib/stores/validation';
  import { debugLog } from '$lib/config/debug';
  import Icon from '$lib/components/ui/Icon.svelte';

  export let fieldName: string = '';
  export let showGlobalErrors: boolean = false;
  
  $: validation = $validationStore;
  $: fieldErrors = fieldName ? getFieldErrors(validation.errors[fieldName]) : [];
  $: globalErrors = showGlobalErrors ? Object.entries(validation.errors)
    .filter(([key]) => !fieldName || key !== fieldName)
    .flatMap(([, errors]) => getFieldErrors(errors)) : [];
  
  // Helper function to safely extract error messages
  function getFieldErrors(errors: any): string[] {
    if (!errors) return [];
    
    if (Array.isArray(errors)) {
      return errors
        .map(error => {
          if (typeof error === 'string') return error;
          if (typeof error === 'object' && error.message) return error.message;
          return null;
        })
        .filter(Boolean) as string[];
    }
    
    if (typeof errors === 'string') {
      return [errors];
    }
    
    if (typeof errors === 'object' && errors.message) {
      return [errors.message];
    }
    
    // Fallback for unknown error formats
    debugLog.warn('Unknown error format:', errors);
    return ['Invalid input'];
  }
</script>

{#if fieldName && fieldErrors.length > 0}
  <div class="field-errors mt-1" data-testid="field-errors-{fieldName}">
    {#each fieldErrors as error}
      <p class="text-sm text-red-600 flex items-center gap-1">
        <Icon name="error" size="sm" classNames="flex-shrink-0" />
        {error}
      </p>
    {/each}
  </div>
{/if}

{#if showGlobalErrors && globalErrors.length > 0}
  <div class="global-errors bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="global-errors">
    <h3 class="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</h3>
    <ul class="space-y-1">
      {#each globalErrors as error}
        <li class="text-sm text-red-600 flex items-start gap-2">
          <Icon name="error" size="sm" classNames="flex-shrink-0 mt-0.5" />
          {error}
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .field-errors {
    animation: slideIn 0.2s ease-out;
  }
  
  .global-errors {
    animation: fadeIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>