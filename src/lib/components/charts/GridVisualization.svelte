<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import type { ChartDataPoint } from '$lib/types';
    import { formatNumber } from '$lib/utils/helpers';
    import { debounce } from '$lib/utils/helpers';
    import { debugLog } from '$lib/config/debug';
	  import type { GridLevel } from '$lib/strategies';
    import Icon from '$lib/components/ui/Icon.svelte';
    
    export let gridLevels: GridLevel[];
    
    let chartContainer: HTMLCanvasElement;
    let chart: any = null;
    let mounted = false;
    let chartError = '';
    let isLoading = false;
    let chartType: 'line' | 'bar' | 'area' = 'area';
    
    let previousGridLevels: GridLevel[] = [];
    let updatePending = false;
    
    let Chart: any;
    let LineController: any;
    let BarController: any;
    let CategoryScale: any;
    let LinearScale: any;
    let PointElement: any;
    let LineElement: any;
    let BarElement: any;
    let Title: any;
    let Tooltip: any;
    let Legend: any;
    let Filler: any;
    
    const debouncedUpdateChart = debounce(updateChart, 500);
    const debouncedInitChart = debounce(initializeChart, 300);
    
    function hasDataChanged(newData: GridLevel[], oldData: GridLevel[]): boolean {
      if (newData.length !== oldData.length) return true;
      
      return newData.some((level, index) => {
        const oldLevel = oldData[index];
        return !oldLevel || 
          level.level !== oldLevel.level || 
          Math.abs(level.price - oldLevel.price) > 0.000001 ||
          Math.abs(level.total - oldLevel.total) > 0.000001;
      });
    }
    
    $: hasValidData = gridLevels && gridLevels.length > 0 && 
      gridLevels.every(level => 
        typeof level.price === 'number' && level.price > 0 && 
        typeof level.total === 'number' && level.total > 0 &&
        typeof level.level === 'number'
      );
    
    $: {
      if (hasValidData && hasDataChanged(gridLevels, previousGridLevels)) {
        debugLog.log('Grid data changed, scheduling update');
        previousGridLevels = [...gridLevels];
        
        if (mounted && Chart && chartContainer) {
          if (chart) {
            if (!updatePending) {
              updatePending = true;
              debouncedUpdateChart();
            }
          } else {
            debouncedInitChart();
          }
        }
      }
    }
    
    onMount(async () => {
      mounted = true;
      if (browser) {
        await loadChartJS();
      }
    });
    
    onDestroy(() => {
      destroyChart();
    });
    
    function destroyChart() {
      if (chart) {
        try {
          chart.destroy();
        } catch (error) {
          console.warn('Error destroying chart:', error);
        }
        chart = null;
      }
    }
    
    async function loadChartJS() {
      try {
        isLoading = true;
        chartError = '';
        
        const chartModule = await import('chart.js');
        
        Chart = chartModule.Chart;
        LineController = chartModule.LineController;
        BarController = chartModule.BarController;
        CategoryScale = chartModule.CategoryScale;
        LinearScale = chartModule.LinearScale;
        PointElement = chartModule.PointElement;
        LineElement = chartModule.LineElement;
        BarElement = chartModule.BarElement;
        Title = chartModule.Title;
        Tooltip = chartModule.Tooltip;
        Legend = chartModule.Legend;
        Filler = chartModule.Filler;
        
        Chart.register(
          LineController,
          BarController,
          CategoryScale,
          LinearScale,
          PointElement,
          LineElement,
          BarElement,
          Title,
          Tooltip,
          Legend,
          Filler
        );
        
        debugLog.log('Chart.js registered successfully');
        
      } catch (error) {
        console.error('Failed to load Chart.js:', error);
        chartError = `Failed to load chart library: ${error instanceof Error ? error.message : 'Unknown error'}`;
      } finally {
        isLoading = false;
      }
    }
    
    function initializeChart() {
      if (!chartContainer || !Chart || !hasValidData || chart) {
        return;
      }
      
      try {
        debugLog.log('Initializing chart with data:', gridLevels.length, 'levels');
        
        const ctx = chartContainer.getContext('2d');
        if (!ctx) {
          chartError = 'Failed to get canvas context';
          return;
        }
        
        chart = new Chart(ctx, {
          type: chartType === 'area' ? 'line' : chartType,
          data: getChartData(),
          options: getChartOptions()
        });
        
        chartError = '';
        debugLog.log(`Chart initialized successfully as ${chartType}`);
        
      } catch (error) {
        console.error('Failed to initialize chart:', error);
        chartError = `Failed to initialize chart: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
    
    function updateChart() {
      if (!chart || !hasValidData) {
        updatePending = false;
        return;
      }
      
      try {
        chart.data = getChartData();
        chart.update('none');
        debugLog.log('Chart updated silently');
      } catch (error) {
        console.error('Failed to update chart:', error);
      } finally {
        updatePending = false;
      }
    }
    
    function changeChartType(newType: 'line' | 'bar' | 'area') {
      if (newType === chartType) return;
      
      chartType = newType;
      destroyChart();
      
      if (hasValidData) {
        setTimeout(() => {
          debouncedInitChart();
        }, 100);
      }
    }
    
    function getChartData() {
      const dataPoints: ChartDataPoint[] = gridLevels.map(level => ({
        x: level.level,
        y: level.price,
        total: level.total,
        level: level.level
      }));
      
      const priceData = gridLevels.map(level => level.price);
      const totalData = gridLevels.map(level => level.total);
      const labels = gridLevels.map(level => `Level ${Math.abs(level.level)}`);
      
      if (chartType === 'bar') {
        return {
          labels,
          datasets: [
            {
              label: 'Price (USDC.e)',
              data: priceData,
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 2,
              borderRadius: 4,
              borderSkipped: false,
            },
            {
              label: 'Total Value (USDC.e)',
              data: totalData,
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 2,
              borderRadius: 4,
              borderSkipped: false,
            }
          ]
        };
      }
      
      return {
        datasets: [
          {
            label: 'Price Levels',
            data: dataPoints,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: chartType === 'area' 
              ? 'rgba(59, 130, 246, 0.1)' 
              : 'rgba(59, 130, 246, 0.05)',
            borderWidth: 3,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: 'rgb(255, 255, 255)',
            pointBorderWidth: 2,
            pointRadius: chartType === 'area' ? 5 : 6,
            pointHoverRadius: 8,
            tension: 0.2,
            fill: chartType === 'area',
            pointHoverBackgroundColor: 'rgb(59, 130, 246)',
            pointHoverBorderColor: 'rgb(255, 255, 255)',
            pointHoverBorderWidth: 3,
          }
        ]
      };
    }
    
    function getChartOptions() {
      const isBarChart = chartType === 'bar';
      
      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          title: {
            display: true,
            text: 'Grid Strategy Levels - Price Distribution',
            font: {
              size: 18,
              weight: 'bold',
              family: "'Inter', system-ui, sans-serif"
            },
            color: 'rgb(17, 24, 39)',
            padding: 20
          },
          legend: {
            display: isBarChart,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                family: "'Inter', system-ui, sans-serif"
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: 'rgb(255, 255, 255)',
            bodyColor: 'rgb(255, 255, 255)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            cornerRadius: 8,
            displayColors: true,
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              title: function(context: any) {
                if (isBarChart) {
                  return context[0].label;
                }
                const point = context[0];
                return `Level ${Math.abs(point.parsed.x)}`;
              },
              label: function(context: any) {
                if (isBarChart) {
                  const value = context.parsed.y;
                  const label = context.dataset.label;
                  return `${label}: $${formatNumber(value, 4)}`;
                }
                
                const dataPoint = context.raw as ChartDataPoint;
                
                return [
                  `Entry Price: $${formatNumber(dataPoint.y, 6)}`,
                  `Order Value: $${formatNumber(dataPoint.total, 2)}`,
                  `Grid Level: ${Math.abs(dataPoint.level)}`
                ];
              },
              footer: function(context: any) {
                if (!isBarChart && context.length > 0) {
                  const dataPoint = context[0].raw as ChartDataPoint;
                  
                  if (dataPoint.total > 0 && dataPoint.y > 0) {
                    const trancheSize = dataPoint.total / dataPoint.y;
                    if (isFinite(trancheSize) && trancheSize > 0) {
                      return `Tranche Size: ${formatNumber(trancheSize, 2)} tokens`;
                    }
                  }
                  
                  return '';
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            type: isBarChart ? 'category' : 'linear',
            title: {
              display: true,
              text: 'Grid Levels (Buy Orders)',
              font: {
                weight: 'bold',
                size: 14
              },
              color: 'rgb(55, 65, 81)'
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.2)',
              drawTicks: true
            },
            ticks: {
              color: 'rgb(75, 85, 99)',
              font: {
                size: 12
              },
              callback: function(value: any) {
                if (isBarChart) return value;
                return `${value}`;
              }
            }
          },
          y: {
            title: {
              display: true,
              text: isBarChart ? 'Value (USDC.e)' : 'Entry Price (USDC.e)',
              font: {
                weight: 'bold',
                size: 14
              },
              color: 'rgb(55, 65, 81)'
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.2)'
            },
            ticks: {
              color: 'rgb(75, 85, 99)',
              font: {
                size: 12
              },
              callback: function(value: any) {
                return `$${formatNumber(value, 4)}`;
              }
            }
          }
        },
        elements: {
          point: {
            hoverBorderWidth: 3,
            radius: chartType === 'line' ? 6 : 5
          },
          line: {
            tension: 0.2
          },
          bar: {
            borderRadius: 4
          }
        }
      };
    }
    
    $: if (mounted && chart && !hasValidData) {
      debugLog.log('Destroying chart - no valid data');
      destroyChart();
    }
  </script>
  
  <div class="w-full">
    {#if hasValidData}
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">Grid Strategy Visualization</h3>
        <div class="flex bg-gray-100 rounded-lg p-1">
          <button
            class="px-3 py-1 text-sm rounded-md transition-colors {chartType === 'area' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
            on:click={() => changeChartType('area')}
          >
            📈 Area
          </button>
          <button
            class="px-3 py-1 text-sm rounded-md transition-colors {chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
            on:click={() => changeChartType('line')}
          >
            📊 Line
          </button>
          <button
            class="px-3 py-1 text-sm rounded-md transition-colors {chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}"
            on:click={() => changeChartType('bar')}
          >
            📊 Bars
          </button>
        </div>
      </div>
    {/if}
  
    {#if isLoading}
      <div class="flex items-center justify-center h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p class="text-gray-600 text-sm">Loading chart...</p>
        </div>
      </div>
    
    {:else if chartError}
      <div class="bg-red-50 border border-red-200 rounded-xl p-6">
        <div class="flex items-center gap-2">
          <Icon name="error" classNames="text-red-500" />
          <h3 class="text-red-800 font-semibold">Chart Error</h3>
        </div>
        <p class="text-red-700 text-sm mt-1">{chartError}</p>
        <button 
          on:click={() => loadChartJS()}
          class="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    
    {:else if hasValidData}
      <div class="space-y-6">
        <div class="relative h-96 w-full bg-gradient-to-br from-gray-50 to-white rounded-xl border shadow-sm">
          <canvas
            bind:this={chartContainer}
            class="w-full h-full rounded-xl"
            aria-label="Grid strategy levels visualization"
          ></canvas>
          
          {#if !chart && mounted && Chart}
            <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-xl">
              <div class="text-center">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-1"></div>
                <p class="text-gray-600 text-xs">Initializing chart...</p>
              </div>
            </div>
          {/if}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <Icon name="trending-up" classNames="text-blue-600" />
              </div>
              <div class="ml-3">
                <p class="text-sm text-blue-600 font-medium">Grid Levels</p>
                <p class="text-xl font-bold text-blue-900">{gridLevels.length}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <Icon name="dollar-sign" classNames="text-green-600" />
              </div>
              <div class="ml-3">
                <p class="text-sm text-green-600 font-medium">Lowest Price</p>
                <p class="text-xl font-bold text-green-900">
                  ${formatNumber(Math.min(...gridLevels.map(l => l.price)), 4)}
                </p>
              </div>
            </div>
          </div>
          
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <Icon name="bar-chart" classNames="text-purple-600" />
              </div>
              <div class="ml-3">
                <p class="text-sm text-purple-600 font-medium">Total Capital</p>
                <p class="text-xl font-bold text-purple-900">
                  ${formatNumber((gridLevels || []).reduce((sum, level) => sum + level.total, 0), 2)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="overflow-hidden rounded-xl border border-gray-200">
          <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h4 class="text-sm font-semibold text-gray-900">Grid Levels Breakdown</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Price</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Order Value</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gap from Prev</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each gridLevels as level, index}
                  {@const prevPrice = index > 0 ? gridLevels[index - 1].price : level.price}
                  {@const priceGap = index > 0 ? ((prevPrice - level.price) / level.price * 100) : 0}
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <!-- FIXED: Show positive level numbers -->
                        <span class="text-sm font-mono font-medium text-gray-900">
                          Level {Math.abs(level.level)}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span class="text-sm font-mono text-gray-900">${formatNumber(level.price, 6)}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span class="text-sm font-mono font-medium text-green-600">${formatNumber(level.total, 2)}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <span class="text-sm font-mono text-gray-500">
                        {index > 0 ? `${priceGap.toFixed(1)}%` : '-'}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="2" class="px-6 py-4 text-sm font-semibold text-gray-900">Total Capital Required:</td>
                  <td class="px-6 py-4 text-right text-sm font-bold text-green-600">
                    ${formatNumber((gridLevels || []).reduce((sum, level) => sum + level.total, 0), 2)}
                  </td>
                  <td class="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    
    {:else}
      <div class="flex items-center justify-center h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <div class="text-center">
          <Icon name="chart-large" size="xl" classNames="mx-auto text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">No Strategy Data</h3>
          <p class="mt-1 text-sm text-gray-500">Enter all strategy parameters to see grid levels visualization.</p>
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    canvas {
      max-height: 400px;
    }
  </style>