import { z } from 'zod';
import type { StrategyConfig } from '$lib/strategies/base/types';
import type { FieldMetadata } from '$lib/types';

/**
 * Dynamic schema builder that creates validation schemas based on strategy configuration
 */
export class DynamicSchemaBuilder {
	/**
	 * Build a validation schema for a given strategy
	 */
	static buildSchemaForStrategy(strategy: StrategyConfig) {
		const fieldMetadata = strategy.getAllFieldMetadata();
		const parameterSchemas: Record<string, z.ZodSchema> = {};

		fieldMetadata.forEach((field) => {
			parameterSchemas[field.binding] = this.buildFieldSchema(field);
		});

		return z.object({
			parameters: z.object(parameterSchemas),
		});
	}

	/**
	 * Build a schema for a single field based on its metadata
	 * Fixed: Properly typed field parameter
	 */
 private static buildFieldSchema(
     field: FieldMetadata
 ): z.ZodString | z.ZodEffects<z.ZodString, string, string> | z.ZodOptional<z.ZodString> {
     let schema:
				| z.ZodString
				| z.ZodEffects<z.ZodString, string, string>
				| z.ZodOptional<z.ZodString> = z.string();
                
 
     if (field.validation?.required) {
         schema = schema.min(1, `${field.binding} is required`);
     }
 
     if (field.inputType === 'number') {
         schema.refine((val) => {
             if (!field.validation?.required && (!val || val.trim() === '')) {
                 return true;
             }
 
             const num = parseFloat(val);
             return !isNaN(num);
         }, `Must be a valid number`);
 
         if (field.min !== undefined) {
             schema.refine((val) => {
                 if (!val || val.trim() === '') return !field.validation?.required;
                 return parseFloat(val) >= parseFloat(field.min!);
             }, `Must be at least ${field.min}`);
         }
 
         if (field.max !== undefined) {
             schema.refine((val) => {
                 if (!val || val.trim() === '') return !field.validation?.required;
                 return parseFloat(val) <= parseFloat(field.max!);
             }, `Must be at most ${field.max}`);
         }
     }
 
     if (field.validation?.customMessage) {
         schema.refine((val) => {
             if (!field.validation?.required && (!val || val.trim() === '')) {
                 return true;
             }
             return true;
         }, field.validation.customMessage);
     }
 
     if (!field.validation?.required) {
         return schema.optional();
     }
 
     return schema.transform((val) => val || '');
 }

	/**
	 * Get field validation errors for a specific strategy and field
	 */
	static validateField(strategy: StrategyConfig, binding: string, value: string): string[] {
		const fieldMetadata = strategy.getFieldMetadata(binding);
		if (!fieldMetadata) return [];

		const fieldSchema = this.buildFieldSchema(fieldMetadata);
		const result = fieldSchema.safeParse(value);

		if (result.success) {
			return [];
		}

		return result.error.issues.map((issue) => issue.message);
	}
}