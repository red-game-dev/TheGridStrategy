/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom/vitest';
import { afterAll, beforeAll, vi } from 'vitest';

// Mock localStorage for testing
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	length: 0,
	key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Mock sessionStorage for testing
const sessionStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	length: 0,
	key: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
	value: sessionStorageMock
});

// Mock ResizeObserver for Chart.js
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// required for svelte5 + jsdom as jsdom does not support matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	enumerable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock browser environment
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock fetch for strategy loading
global.fetch = vi.fn();

// Mock chart.js to avoid canvas issues in tests
vi.mock('chart.js', () => ({
	Chart: vi.fn().mockImplementation(() => ({
		destroy: vi.fn(),
		update: vi.fn(),
		data: {}
	})),
	LineController: vi.fn(),
	BarController: vi.fn(),
	CategoryScale: vi.fn(),
	LinearScale: vi.fn(),
	PointElement: vi.fn(),
	LineElement: vi.fn(),
	BarElement: vi.fn(),
	Title: vi.fn(),
	Tooltip: vi.fn(),
	Legend: vi.fn(),
	Filler: vi.fn()
}));

// Mock debug config
vi.mock('$lib/config/debug', () => ({
	debugLog: {
		log: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		group: vi.fn(),
		groupEnd: vi.fn()
	},
	shouldShowDebug: vi.fn(() => false)
}));

// Fix the browser environment mock
vi.mock('$app/environment', () => ({
	browser: true,
	dev: false,
	building: false,
	version: '1.0.0'
}));

// Mock window.fs for file reading in tests
Object.defineProperty(window, 'fs', {
	value: {
		readFile: vi.fn().mockResolvedValue('mock file content')
	}
});

// Console suppression for cleaner test output
const originalError = console.error;
beforeAll(() => {
	console.error = (...args: any[]) => {
		if (
			typeof args[0] === 'string' &&
			(args[0].includes('Warning: ReactDOM.render is deprecated') ||
				args[0].includes('Warning: componentWillMount has been renamed'))
		) {
			return;
		}
		originalError.call(console, ...args);
	};
});

afterAll(() => {
	console.error = originalError;
});

// Mock URL.createObjectURL for file handling
global.URL.createObjectURL = vi.fn();
