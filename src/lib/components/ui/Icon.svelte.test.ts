import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Icon from './Icon.svelte'

describe('Icon Component', () => {
	it('renders with basic props', () => {
		render(Icon, { name: 'test', size: 'md' });

		const icon = screen.getByRole('img');
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveAttribute('src', '/icons/test.svg');
		expect(icon).toHaveAttribute('alt', 'test icon');
	});

	it('applies custom className', () => {
		render(Icon, {
			name: 'test',
			size: 'md',
			className: 'text-red-500 custom-class'
		});

		const icon = screen.getByRole('img');
		expect(icon).toHaveClass('text-red-500', 'custom-class');
	});

	it('applies animation for spinner icon when animate is true', () => {
		render(Icon, {
			name: 'spinner',
			size: 'md',
			animate: true
		});

		const icon = screen.getByRole('img');
		expect(icon).toHaveClass('animate-spin');
	});

	it('applies animation for refresh icon when animate is true', () => {
		render(Icon, {
			name: 'refresh',
			size: 'md',
			animate: true
		});

		const icon = screen.getByRole('img');
		expect(icon).toHaveClass('animate-spin');
	});

	it('does not apply animation when animate is false', () => {
		render(Icon, {
			name: 'spinner',
			size: 'md',
			animate: false
		});

		const icon = screen.getByRole('img');
		expect(icon).not.toHaveClass('animate-spin');
	});

	it('handles custom size with empty class', () => {
		render(Icon, {
			name: 'test',
			size: 'custom',
			className: 'w-20 h-20'
		});

		const icon = screen.getByRole('img');
		expect(icon).toHaveClass('w-20', 'h-20');
		expect(icon).not.toHaveClass('w-5', 'h-5'); // Should not have default md classes
	});

	it('constructs correct icon path', () => {
		render(Icon, { name: 'arrow-left' });

		const icon = screen.getByRole('img');
		expect(icon).toHaveAttribute('src', '/icons/arrow-left.svg');
	});

	it('passes through additional props', () => {
		render(Icon, {
			name: 'test',
			'data-testid': 'custom-icon',
			title: 'Custom Title'
		});

		const icon = screen.getByRole('img');
		expect(icon).toHaveAttribute('data-testid', 'custom-icon');
		expect(icon).toHaveAttribute('title', 'Custom Title');
	});

	it('handles missing animation class gracefully', () => {
		render(Icon, {
			name: 'unknown-icon',
			animate: true
		});

		const icon = screen.getByRole('img');
		expect(icon).not.toHaveClass('animate-spin');
	});
});
