import { SafeConfig, RuntimeConfigOverride } from './types';
/**
 * Configuration merger that handles priority-based merging
 */
export declare class ConfigMerger {
    /**
     * Merge multiple configurations with priority order:
     * runtime > env > file > defaults
     */
    mergeConfigs(defaults: SafeConfig, fileConfig?: SafeConfig, envConfig?: SafeConfig, runtimeConfig?: SafeConfig): SafeConfig;
    /**
     * Apply runtime overrides to a base configuration
     */
    applyRuntimeOverrides(baseConfig: SafeConfig, overrides: RuntimeConfigOverride): SafeConfig;
    /**
     * Deep merge two configuration objects
     */
    private deepMerge;
    /**
     * Deep clone a configuration object
     */
    private deepClone;
}
