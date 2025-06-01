import { z } from 'zod';
import type { StrategyConfig, StrategyCalculations } from '../base/types';
import type { FieldMetadata } from '$lib/types';

/**
 * Grid strategy field metadata
 */
const GRID_FIELD_METADATA: Record<string, FieldMetadata> = {
	'baseline-io-ratio': {
		binding: 'baseline-io-ratio',
		inputType: 'number',
		placeholder: 'e.g., 0.0005 (price per token)',
		helpText: 'Starting price for your grid. This should be near the current market price.',
		step: '0.0001',
		min: '0',
		validation: {
			required: true,
			customMessage: 'Must be a positive number representing the starting price'
		}
	},
	'io-ratio-growth': {
		binding: 'io-ratio-growth',
		inputType: 'number',
		placeholder: 'e.g., 0.05 (5% growth per level)',
		helpText:
			'Growth rate determines spacing between grid levels. 0.05 = 5% price increase per level.',
		step: '0.01',
		min: '0',
		max: '10',
		validation: {
			required: true,
			customMessage: 'Must be between 0 and 10 (e.g., 0.2 for 20% growth)'
		}
	},
	'tranche-size': {
		binding: 'tranche-size',
		inputType: 'number',
		placeholder: 'e.g., 1000 (tokens per level)',
		helpText: 'Amount of tokens to sell at each grid level.',
		step: '0.001',
		min: '0',
		validation: {
			required: true,
			customMessage: 'Must be a positive number (e.g., 100)'
		}
	},
	'seconds-per-tranche': {
		binding: 'seconds-per-tranche',
		inputType: 'number',
		placeholder: 'e.g., 3600 (1 hour)',
		helpText: 'Time to wait before refilling each grid level. Set to 0 to disable auto-refill.',
		step: '1',
		min: '0',
		max: '31536000',
		validation: {
			required: false,
			customMessage: 'Must be between 0 and 31,536,000 seconds (1 year)'
		}
	}
};

/**
 * Grid strategy validation schemas
 */
const baselineIoRatioSchema = z
	.string()
	.min(1, 'Baseline ratio is required')
	.refine((val) => {
		if (!val || val.trim() === '') return false;
		const num = parseFloat(val);
		return !isNaN(num) && num > 0 && num <= 10000;
	}, 'Must be a positive number (e.g., 0.5)')
	.transform((val) => val);

const ioRatioGrowthSchema = z
	.string()
	.min(1, 'Growth rate is required')
	.refine((val) => {
		if (!val || val.trim() === '') return false;
		const num = parseFloat(val);
		return !isNaN(num) && num >= 0 && num <= 10;
	}, 'Must be between 0 and 10 (e.g., 0.2 for 20% growth)')
	.transform((val) => val);

const trancheSizeSchema = z
	.string()
	.min(1, 'Tranche size is required')
	.refine((val) => {
		if (!val || val.trim() === '') return false;
		const num = parseFloat(val);
		return !isNaN(num) && num > 0 && num <= 1000000000;
	}, 'Must be a positive number (e.g., 100)')
	.transform((val) => val);

const secondsPerTrancheSchema = z
	.string()
	.refine((val) => {
		if (!val || val.trim() === '') return true;
		const num = parseFloat(val);
		return !isNaN(num) && num >= 0 && num <= 31536000;
	}, 'Must be between 0 and 31,536,000 seconds (1 year)')
	.transform((val) => val || '0');

/**
 * Grid strategy calculations
 */
class GridCalculations implements StrategyCalculations {
	calculateMaxReturns(fieldValues: Record<string, string>): number {
		try {
			const baselineRatio = parseFloat(fieldValues['baseline-io-ratio'] || '0');
			const growth = parseFloat(fieldValues['io-ratio-growth'] || '0');
			const trancheSize = parseFloat(fieldValues['tranche-size'] || '0');

			if (!baselineRatio || !growth || !trancheSize) {
				return 0;
			}

			const levels = 10;
			let totalReturns = 0;

			for (let i = 0; i < levels; i++) {
				const levelPrice = baselineRatio * Math.pow(1 + growth, i);
				totalReturns += levelPrice * trancheSize;
			}

			return totalReturns;
		} catch (error) {
			console.error('Error calculating max returns:', error);
			return 0;
		}
	}

	calculateGridLevels(fieldValues: Record<string, string>) {
		try {
			const baselineRatio = parseFloat(fieldValues['baseline-io-ratio'] || '0');
			const growth = parseFloat(fieldValues['io-ratio-growth'] || '0');
			const trancheSize = parseFloat(fieldValues['tranche-size'] || '0');

			if (!baselineRatio || !growth || !trancheSize) {
				return [];
			}

			const levels = [];
			for (let i = 0; i < 5; i++) {
				const price = baselineRatio * Math.pow(1 + growth, i);
				levels.push({
					level: i + 1,
					price: price,
					amount: trancheSize,
                    total: price * trancheSize
				});
			}

			return levels;
		} catch (error) {
			console.error('Error calculating grid levels:', error);
			return [];
		}
	}
}

/**
 * Grid Strategy Configuration
 */
export class GridStrategyConfig implements StrategyConfig {
	readonly name = 'Grid';
	readonly description = 'A strategy that places automated orders at fixed price intervals';
	readonly version = '1.0.0';

	private calculations = new GridCalculations();

	getValidationSchema() {
		return z.object({
			parameters: z.object({
				'baseline-io-ratio': baselineIoRatioSchema,
				'io-ratio-growth': ioRatioGrowthSchema,
				'tranche-size': trancheSizeSchema,
				'seconds-per-tranche': secondsPerTrancheSchema.optional()
			}),
			deposits: z
				.record(
					z.string(),
					z
						.string()
						.optional()
						.refine((val) => {
							if (!val || val.trim() === '') return true;
							const num = parseFloat(val);
							return !isNaN(num) && num >= 0;
						}, 'Deposit amount must be a positive number')
				)
				.optional(),
			vaultIds: z
				.object({
					input: z
						.record(
							z.string(),
							z
								.string()
								.optional()
								.refine((val) => {
									if (!val || val.trim() === '') return true;
									const num = parseInt(val);
									return !isNaN(num) && num >= 0;
								}, 'Vault ID must be a positive number')
						)
						.optional(),
					output: z
						.record(
							z.string(),
							z
								.string()
								.optional()
								.refine((val) => {
									if (!val || val.trim() === '') return true;
									const num = parseInt(val);
									return !isNaN(num) && num >= 0;
								}, 'Vault ID must be a positive number')
						)
						.optional()
				})
				.optional()
		});
	}

	getFieldMetadata(binding: string): FieldMetadata | null {
		return GRID_FIELD_METADATA[binding] || null;
	}

	getAllFieldMetadata(): FieldMetadata[] {
		return Object.values(GRID_FIELD_METADATA);
	}

	getCalculations(): StrategyCalculations {
		return this.calculations;
	}

	getRequiredFields(): string[] {
		return ['baseline-io-ratio', 'io-ratio-growth', 'tranche-size'];
	}
}
