// src/lib/components/forms/NetworkSelector.test.ts
import { render, screen, fireEvent } from '@testing-library/svelte';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { tick } from 'svelte'; // <--- ADD THIS IMPORT
import NetworkSelector from './NetworkSelector.svelte';
import { cleanupMocks } from '$lib/utils/tests/utilities';
import { getNetworkName } from '$lib/utils/helpers';

// Mock getNetworkName (keep this as is)
vi.mock('$lib/utils/helpers', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/utils/helpers')>();
	return {
		...actual,
		getNetworkName: vi.fn((key: string) => {
			if (key === 'ethereum') return 'Ethereum Mainnet';
			if (key === 'polygon') return 'Polygon Mainnet';
			return key;
		})
	};
});

describe('NetworkSelector', () => {
	const mockedGetNetworkName = vi.mocked(getNetworkName);

	beforeEach(() => {
		cleanupMocks();
		mockedGetNetworkName.mockClear();
	});

	const mockDeployments = [
		{ key: 'ethereum', value: { name: 'Ethereum', description: 'Layer 1 blockchain' } },
		{ key: 'polygon', value: { name: 'Polygon', description: 'Scalable blockchain network' } },
		{ key: 'base', value: undefined }
	];

	it('renders all provided deployments', () => {
		render(NetworkSelector, { deployments: mockDeployments, selected: 'ethereum' });

		const buttons = screen.getAllByRole('button');
		expect(buttons).toHaveLength(mockDeployments.length);

		expect(screen.getByRole('button', { name: /Ethereum/i })).toBeInTheDocument();
		expect(screen.getByText('Layer 1 blockchain')).toBeInTheDocument();

		expect(screen.getByRole('button', { name: /Polygon/i })).toBeInTheDocument();
		expect(screen.getByText('Scalable blockchain network')).toBeInTheDocument();

		const baseButton = screen.getByRole('button', { name: /base/i });
		expect(baseButton).toBeInTheDocument();
		expect(baseButton.querySelector('p')).toHaveTextContent('');
		expect(mockedGetNetworkName).toHaveBeenCalledWith('base');
	});

	it('applies selected class to the currently selected deployment', () => {
		render(NetworkSelector, { deployments: mockDeployments, selected: 'polygon' });

		const ethereumButton = screen.getByRole('button', { name: /Ethereum/i });
		const polygonButton = screen.getByRole('button', { name: /Polygon/i });

		expect(ethereumButton).not.toHaveClass('border-blue-500');
		expect(ethereumButton).toHaveClass('border-gray-200');

		expect(polygonButton).toHaveClass('border-blue-500');
		expect(polygonButton).toHaveClass('bg-blue-50');
		expect(polygonButton).not.toHaveClass('border-gray-200');
	});

	it('does NOT dispatch "change" event if the already selected deployment is clicked', async () => {
		const mockChangeHandler = vi.fn();
		render(NetworkSelector, {
			deployments: mockDeployments,
			selected: 'ethereum',
			change: mockChangeHandler
		});

		const ethereumButton = screen.getByRole('button', { name: /Ethereum/i });
		await fireEvent.click(ethereumButton);

		await tick(); // <--- ADD THIS LINE for consistency

		expect(mockChangeHandler).not.toHaveBeenCalled();
	});

	it('uses getNetworkName fallback for deployment name if value.name is undefined', () => {
		render(NetworkSelector, { deployments: mockDeployments, selected: 'ethereum' });

		const baseButton = screen.getByRole('button', { name: /base/i });
		expect(baseButton.querySelector('h3')).toHaveTextContent('base');
		expect(mockedGetNetworkName).toHaveBeenCalledWith('base');
	});

	it('renders empty string for description if value.description is undefined', () => {
		const deploymentsWithUndefinedDescription = [
			{ key: 'testnet', value: { name: 'Testnet', description: undefined } }
		];
		render(NetworkSelector, {
			deployments: deploymentsWithUndefinedDescription,
			selected: 'testnet'
		});

		const testnetButton = screen.getByRole('button', { name: /Testnet/i });
		expect(testnetButton.querySelector('p')).toHaveTextContent('');
	});
});
