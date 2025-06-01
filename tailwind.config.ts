import { join } from 'path';
import type { Config } from 'tailwindcss';
import flowbite from 'flowbite/plugin';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

const config: Config = {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}',
		join(require.resolve('flowbite-svelte'), '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter']
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-up': 'slideUp 0.3s ease-out',
				'pulse-subtle': 'pulseSubtle 2s infinite'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				pulseSubtle: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				}
			}
		}
	},
	plugins: [forms, typography, flowbite]
};

export default config;
