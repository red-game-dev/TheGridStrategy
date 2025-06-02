import type { FieldMetadata } from '$lib/types';
import type { ZodSchema } from 'zod';

export type StrategyType = 'grid';

/**
 * Grid level information for visualization
 */
export interface GridLevel {
	amount: number; // trancheSize;
	/** Negative level index (-1, -2, etc.) */
	level: number;
	/** Price at this level (USDC.e per WFLR) */
	price: number;
	/** Total value of the order (price * trancheSize) */
	total: number;
}

export type GridStrategyFields =
	| 'parameters'
	| 'deposits'
	| 'vaultIds'
	| 'parameters.baseline-io-ratio'
	| 'parameters.io-ratio-growth'
	| 'parameters.tranche-size'
	| 'parameters.seconds-per-tranche';

/**
 * Strategy calculation interface
 */
export interface StrategyCalculations {
	calculateMaxReturns(fieldValues: Record<string, string>): number;
	calculateGridLevels?(fieldValues: Record<string, string>): GridLevel[];
}

/**
 * Base strategy configuration interface
 */
export interface StrategyConfig {
	readonly name: string;
	readonly description: string;
	readonly version: string;

	getValidationSchema(): ZodSchema;

	getFieldMetadata(binding: string): FieldMetadata | null;
	getAllFieldMetadata(): FieldMetadata[];

	getCalculations(): StrategyCalculations;

	getCustomComponents?(): Record<string, unknown>;
}
