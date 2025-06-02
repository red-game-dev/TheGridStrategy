import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin';

const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/writing-tests/test-addon
export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],

	// Vite configuration for better dev exp
	define: {
		global: 'globalThis'
	},

	// Optimization for bc libraries
	optimizeDeps: {
		include: [
			'@rainlanguage/orderbook',
			'@reown/appkit',
			'@reown/appkit-adapter-wagmi',
			'viem',
			'wagmi',
			'chart.js',
			'chartjs-adapter-date-fns',
			'date-fns',
			'zod',
			'clsx',
			'tailwind-merge'
		]
	},

	// Build configuration optimized for bc app
	build: {
		target: 'esnext',
		sourcemap: true,
		rollupOptions: {
			external: (id) => {
				// Handle node-specific modules
				if (id.includes('node:')) return true;
				return false;
			},
		}
	},

	// dev server configuration
	server: {
		fs: {
			allow: ['..']
		},
		port: 5173,
		host: true
	},

	test: {
		// Global test configuration
		globals: true,
		logHeapUsage: true,

		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'json-summary', 'lcov'],
			reportsDirectory: './coverage',
			exclude: [
				'node_modules/',
				'src/test/',
				'src/lib/test/',
				'**/*.d.ts',
				'**/*.config.*',
				'build/',
				'.svelte-kit/',
				'src/stories/**',
				'**/*.stories.*',
				'coverage/',
				'test-results/',
				'playwright-report/'
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80
				}
			}
		},

		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: [
						'src/**/*.svelte.{test,spec}.{js,ts}',
						'src/lib/components/**/*.{test,spec}.{js,ts}',
						'src/lib/utils/**/*.{test,spec}.{js,ts}',
						'src/lib/stores/**/*.{test,spec}.{js,ts}',
						'src/lib/services/**/*.{test,spec}.{js,ts}'
					],
					exclude: ['src/lib/server/**', '**/*.integration.test.{js,ts}'],
					setupFiles: ['./vitest-setup-client.ts'],
					testTimeout: 10000
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}', '**/*.integration.test.{js,ts}']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'integration',
					environment: 'jsdom',
					include: ['**/*.integration.test.{js,ts}'],
					setupFiles: ['./vitest-setup-client.ts'],
					testTimeout: 30000
				}
			},
			{
				extends: true,
				plugins: [
					// The plugin will run tests for the stories defined in your Storybook config
					// See options at: https://storybook.js.org/docs/writing-tests/test-addon#storybooktest
					storybookTest({
						configDir: path.join(dirname, '.storybook')
					})
				],
				test: {
					name: 'storybook',
					browser: {
						enabled: true,
						headless: true,
						provider: 'playwright',
						instances: [
							{
								browser: 'chromium'
							}
						]
					},
					setupFiles: ['.storybook/vitest.setup.ts']
				}
			}
		]
	}
});
