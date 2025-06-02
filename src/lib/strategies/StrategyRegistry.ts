import type { StrategyConfig, StrategyType } from './base/types';
import { GridStrategyConfig } from './grid/GridStrategyConfig';

/**
 * Strategy registry for managing different strategy configurations
 */
class StrategyRegistry {
	private strategies = new Map<StrategyType, StrategyConfig>();

	constructor() {
		this.register('grid', new GridStrategyConfig());
	}

	register(key: StrategyType, strategy: StrategyConfig): void {
		this.strategies.set(key, strategy);
	}

	get(key: StrategyType): StrategyConfig | null {
		return this.strategies.get(key) || null;
	}

	getAll(): Map<StrategyType, StrategyConfig> {
		return new Map(this.strategies);
	}

	list(): Array<{ key: StrategyType; name: string; description: string }> {
		return Array.from(this.strategies.entries()).map(([key, strategy]) => ({
			key,
			name: strategy.name,
			description: strategy.description
		}));
	}
}

export const strategyRegistry = new StrategyRegistry();
