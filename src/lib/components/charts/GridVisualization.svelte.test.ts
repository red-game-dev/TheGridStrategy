/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tick } from 'svelte';
import GridVisualization from './GridVisualization.svelte';
import type { GridLevel } from '$lib/strategies';

vi.mock('$app/environment', () => ({
	browser: true
}));

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

vi.mock('$lib/utils/helpers', () => ({
	formatNumber: vi.fn((num: number, decimals: number = 2) => {
		return num.toFixed(decimals);
	}),
	debounce: vi.fn((fn: () => void) => {
		return fn;
	})
}));

vi.mock('$lib/config/debug', () => ({
	debugLog: {
		log: vi.fn()
	}
}));

vi.mock('$lib/components/ui/Icon.svelte', () => ({
	default: () => null
}));

const validGridLevels: GridLevel[] = [
	{ level: -1, price: 100, total: 1000, amount: 10 },
	{ level: -2, price: 95, total: 950, amount: 10 },
	{ level: -3, price: 90, total: 900, amount: 10 }
];

beforeEach(() => {
	Object.defineProperty(window, '__vitest__', {
		value: true,
		writable: true
	});

	vi.clearAllMocks();
	mockChartClass.mockClear();
	mockChart.destroy.mockClear();
	mockChart.update.mockClear();

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

		expect(screen.getByText('Grid Strategy Visualization')).toBeInTheDocument();

		expect(screen.getByText('📈 Area')).toBeInTheDocument();
		expect(screen.getByText('📊 Line')).toBeInTheDocument();
		expect(screen.getByText('📊 Bars')).toBeInTheDocument();
	});

	it('shows loading state initially', async () => {
		render(GridVisualization, {
			props: { gridLevels: [] }
		});

		await tick();

		expect(screen.getByText('Loading chart...')).toBeInTheDocument();
	});

	it('displays statistics cards when data is valid', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		await waitFor(() => {
			expect(screen.getByText('Grid Levels')).toBeInTheDocument();
		});

		expect(screen.getByText('3')).toBeInTheDocument();
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

		const totalCapitalElements = screen.getAllByText('$2850.00');
		expect(totalCapitalElements).toHaveLength(2); 

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
			expect(rows.length).toBeGreaterThan(3); 
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

		const { formatNumber } = await import('$lib/utils/helpers');
		expect(formatNumber).toHaveBeenCalled();
	});

	it('displays level numbers as positive values in UI', async () => {
		render(GridVisualization, {
			props: { gridLevels: validGridLevels }
		});

		await tick();

		await waitFor(() => {
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

		expect(screen.getByText('Loading chart...')).toBeInTheDocument();

		expect(mockChartClass).not.toHaveBeenCalled();
	});

	it('validates grid level data correctly', async () => {
		const mixedGridLevels: GridLevel[] = [
			{ level: -1, price: 100, total: 1000, amount: 10 },
			{ level: -2, price: -95, total: 950, amount: 10 }, 
			{ level: -3, price: 90, total: 900, amount: 10 }
		];

		render(GridVisualization, {
			props: { gridLevels: mixedGridLevels }
		});

		await tick();

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

		const initMessage = screen.queryByText('Initializing chart...');
		const loadingMessage = screen.queryByText('Loading chart...');

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
			expect(screen.getByText('5.3%')).toBeInTheDocument();
			expect(screen.getByText('5.6%')).toBeInTheDocument();
		});
	});
});
