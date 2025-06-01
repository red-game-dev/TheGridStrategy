<script lang="ts">
    /**
     * Reusable Icon component for loading SVG icons from static/icons/
     * 
     * @param name - The name of the icon file (without .svg extension)
     * @param size - Predefined size or custom size
     * @param class - Additional CSS classes
     * @param animate - Whether to apply animation (for spinner, etc.)
     */
    export let name: string;
    export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom' = 'md';
    export let className: string = '';
    export let animate: boolean = false;
    
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5', 
      lg: 'w-6 h-6',
      xl: 'w-12 h-12',
      custom: ''
    };
    
    const animationClasses: Record<string, string> = {
      spinner: 'animate-spin',
      refresh: 'animate-spin', 
    };
    
    $: iconClasses = [
      sizeClasses[size],
      animate && animationClasses[name] ? animationClasses[name] : '',
      className
    ].filter(Boolean).join(' ');
    
    $: iconPath = `/icons/${name}.svg`;
  </script>
  
  <img 
    src={iconPath}
    alt="{name} icon"
    class={iconClasses}
    {...$$restProps}
  />
  
  <style>
    img {
      display: inline-block;
      vertical-align: middle;
    }
  </style>