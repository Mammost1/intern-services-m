"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAdapterName = exports.convertCase = void 0;
var change_case_1 = require("change-case");
/**
 * Converts the casing of a string.
 *
 * @export
 * @param {string} name The name to convert.
 * @param {string} caseType The case type to convert into.
 * @returns The converted name.
 */
function convertCase(name, caseType) {
    switch (caseType) {
        case 'pascal':
            return (0, change_case_1.pascalCase)(name, { transform: change_case_1.pascalCaseTransformMerge });
        case 'camel':
            return (0, change_case_1.camelCase)(name, { transform: change_case_1.camelCaseTransformMerge });
        case 'lower':
            return name.toLowerCase();
        case 'upper':
            return name.toUpperCase();
        default:
            return name;
    }
}
exports.convertCase = convertCase;
/**
 * Resolves a common adapter name from an alias.
 *
 * @param dialect The ambiguous adapter name.
 * @returns The resolved dialect name.
 */
function resolveAdapterName(dialect) {
    var _a;
    var aliases = {
        'postgresql': 'postgres',
        'pg': 'postgres',
        'sqlite3': 'sqlite',
        'mysql2': 'mysql'
    };
    return (_a = aliases[dialect]) !== null && _a !== void 0 ? _a : dialect;
}
exports.resolveAdapterName = resolveAdapterName;
