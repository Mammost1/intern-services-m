/**
 * Converts the casing of a string.
 *
 * @export
 * @param {string} name The name to convert.
 * @param {string} caseType The case type to convert into.
 * @returns The converted name.
 */
export declare function convertCase(name: string, caseType: string): string;
/**
 * Resolves a common adapter name from an alias.
 *
 * @param dialect The ambiguous adapter name.
 * @returns The resolved dialect name.
 */
export declare function resolveAdapterName(dialect: string): any;
