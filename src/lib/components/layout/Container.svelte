<script lang="ts">
    export let maxWidth = '4xl';
    export let padding = '4';
  </script>
  
  <div class="max-w-{maxWidth} mx-auto px-{padding}">
    <slot />
  </div>