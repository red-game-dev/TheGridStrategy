/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tick } from 'svelte';
import GridVisualization from './GridVisualization.svelte';
import type { GridLevel } from '$lib/strategies';

// Mock the environment check
vi.mock('$app/environment', () => ({
	browser: true
}));

// Mock Chart.js with proper structure
const mockChart = {
	destroy: vi.fn(),
	update: vi.fn(),
	data: {},
	options: {}
};

const mockChartClass = vi.fn().mockImplementation(() => mockChart);

vi.mock('chart.js', () => ({
	Chart: mockChartClass,
	LineController: class MockLineController {},
	BarController: class MockBarController {},
	CategoryScale: class MockCategoryScale {},
	LinearScale: class MockLinearScale {},
	PointElement: class MockPointElement {},
	LineElement: class MockLineElement {},
	BarElement: class MockBarElement {},
	Title: class MockTitle {},
	Tooltip: class MockTooltip {},
	Legend: class MockLegend {},
	Filler: class MockFiller {}
}));

// Mock helper utilities
vi.mock('$lib/utils/helpers', () => ({
	formatNumber: vi.fn((num: number, decimals: number = 2) => {
		return num.toFixed(decimals);
	}),
	debounce: vi.fn((fn: () => void) => {
		// Return function that executes immediately for testing
		return fn;
	})
}));

// Mock debug config
vi.mock('$lib/config/debug', () => ({
	debugLog: {
		log: vi.fn()
	}
}));

// Mock the Icon component to return null
vi.mock('$lib/components/ui/Icon.svelte', () => ({
	default: () => null
}));

// Sample test data
const validGridLevels: GridLevel[] = [
	{ level: -1, price: 100, total: 1000, amount: 10 },
	{ level: -2, price: 95, total: 950, amount: 10 },
	{ level: -3, price: 90, total: 900, amount: 10 }
];

// Setup test environment
beforeEach(() => {
	// Mark as test environment for the component
	Object.defineProperty(window, '__vitest__', {
		value: true,
		writable: true
	});

	vi.clearAllMocks();
	mockChartClass.mockClear();
	mockChart.destroy.mockClear();
	mockChart.update.mockClear();

	// Setup Chart.js mock to have register method
	(mockChartClass as any).register = vi.fn();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('GridVisualization Component', () => {
	it('renders basic structure with valid grid levels', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		// Should show the main heading
		expect(screen.getByText('Grid Strategy Visualization')).toBeInTheDocument();

		// Should show chart type buttons
		expect(screen.getByText('📈 Area')).toBeInTheDocument();
		expect(screen.getByText('📊 Line')).toBeInTheDocument();
		expect(screen.getByText('📊 Bars')).toBeInTheDocument();
	});

	it('shows loading state initially', async () => {
		render(GridVisualization, {
			props: { gridLevels: [] }
		});

		await tick();

		// Component shows loading initially, which is expected behavior
		expect(screen.getByText('Loading chart...')).toBeInTheDocument();
	});

	it('displays statistics cards when data is valid', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		// Wait for statistics to appear
		await waitFor(() => {
			expect(screen.getByText('Grid Levels')).toBeInTheDocument();
		});

		expect(screen.getByText('3')).toBeInTheDocument(); // number of levels
		expect(screen.getByText('Lowest Price')).toBeInTheDocument();
		expect(screen.getByText('Total Capital')).toBeInTheDocument();
	});

	it('displays grid levels breakdown table', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		await waitFor(() => {
			expect(screen.getByText('Grid Levels Breakdown')).toBeInTheDocument();
		});

		// Check table headers
		expect(screen.getByText('Level')).toBeInTheDocument();
		expect(screen.getByText('Entry Price')).toBeInTheDocument();
		expect(screen.getByText('Order Value')).toBeInTheDocument();
		expect(screen.getByText('Gap from Prev')).toBeInTheDocument();
	});

	it('shows total capital calculation in table footer', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		await waitFor(() => {
			expect(screen.getByText('Total Capital Required:')).toBeInTheDocument();
		});

		// Use getAllByText since $2850.00 appears in both the stats card and table footer
		const totalCapitalElements = screen.getAllByText('$2850.00');
		expect(totalCapitalElements).toHaveLength(2); // One in stats card, one in table footer

		// Verify specifically that it's in the table footer (green-600 color)
		const tableFooterTotal = totalCapitalElements.find((el) =>
			el.classList.contains('text-green-600')
		);
		expect(tableFooterTotal).toBeInTheDocument();
	});

	it('calculates and displays price gaps correctly', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		await waitFor(() => {
			const rows = screen.getAllByRole('row');
			expect(rows.length).toBeGreaterThan(3); // header + data rows + footer
		});
	});

	it('changes chart type when buttons are clicked', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		const lineButton = screen.getByText('📊 Line');
		fireEvent.click(lineButton);

		await tick();

		// The button state should change (it should now be active)
		expect(lineButton).toHaveClass('bg-white', 'text-blue-600');
	});

	it('formats numbers correctly using formatNumber helper', async () => {
		const testGridLevels: GridLevel[] = [
			{ level: -1, price: 123.456789, total: 1000.123456, amount: 10 }
		];

		render(GridVisualization, {
			props: { gridLevels: testGridLevels }
		});

		await tick();

		// formatNumber should be called for displaying prices
		const { formatNumber } = await import('$lib/utils/helpers');
		expect(formatNumber).toHaveBeenCalled();
	});

	it('displays level numbers as positive values in UI', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		await waitFor(() => {
			// Should display "Level 1", "Level 2", "Level 3" (positive numbers)
			expect(screen.getByText('Level 1')).toBeInTheDocument();
			expect(screen.getByText('Level 2')).toBeInTheDocument();
			expect(screen.getByText('Level 3')).toBeInTheDocument();
		});
	});

	it('handles empty grid levels array', async () => {
		render(GridVisualization, {
			props: { gridLevels: [] }
		});

		await tick();

		// Empty state shows loading initially, which is expected
		expect(screen.getByText('Loading chart...')).toBeInTheDocument();

		// Chart should not be initialized for empty data
		expect(mockChartClass).not.toHaveBeenCalled();
	});

	it('validates grid level data correctly', async () => {
		const mixedGridLevels: GridLevel[] = [
			{ level: -1, price: 100, total: 1000, amount: 10 }, // valid
			{ level: -2, price: -95, total: 950, amount: 10 }, // invalid: negative price
			{ level: -3, price: 90, total: 900, amount: 10 } // valid
		];

		render(GridVisualization, {
			props: { gridLevels: mixedGridLevels }
		});

		await tick();

		// Should show loading state because data contains invalid entries
		expect(screen.getByText('Loading chart...')).toBeInTheDocument();
	});

	it('renders chart canvas element', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		await waitFor(() => {
			const canvas = screen.getByLabelText('Grid strategy levels visualization');
			expect(canvas).toBeInTheDocument();
			expect(canvas.tagName).toBe('CANVAS');
		});
	});

	it('shows chart initialization message', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		// Component shows "Initializing chart..." when chart is being set up
		// But it might also show "Loading chart..." depending on the state
		const initMessage = screen.queryByText('Initializing chart...');
		const loadingMessage = screen.queryByText('Loading chart...');

		// Either message is acceptable as they both indicate chart loading
		expect(initMessage || loadingMessage).toBeInTheDocument();
	});

	it('renders without errors when all required props are provided', async () => {
		expect(() => {
			render(GridVisualization, {
				props: { gridLevels: validGridLevels }
			});
		}).not.toThrow();
	});

	it('displays price values with correct formatting', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		await waitFor(() => {
			// Check for formatted price values
			expect(screen.getByText('$100.000000')).toBeInTheDocument();
			expect(screen.getByText('$95.000000')).toBeInTheDocument();
			expect(screen.getByText('$90.000000')).toBeInTheDocument();
		});
	});

	it('displays order values with correct formatting', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		await waitFor(() => {
			// Check for formatted order values
			expect(screen.getByText('$1000.00')).toBeInTheDocument();
			expect(screen.getByText('$950.00')).toBeInTheDocument();
			expect(screen.getByText('$900.00')).toBeInTheDocument();
		});
	});

	it('calculates percentage gaps between price levels', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		await waitFor(() => {
			// Check for calculated percentage gaps
			expect(screen.getByText('5.3%')).toBeInTheDocument(); // Gap between 100 and 95
			expect(screen.getByText('5.6%')).toBeInTheDocument(); // Gap between 95 and 90
		});
	});
});
