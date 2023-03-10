"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var SharedAdapterTasks = __importStar(require("./SharedAdapterTasks"));
var default_1 = /** @class */ (function () {
    function default_1() {
    }
    default_1.prototype.getAllEnums = function (db, config) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, ungroupedEnums, groupedEnums, tableEnums;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n    SELECT \n      pg_namespace.nspname AS schema, \n      pg_enum.enumsortorder AS order, \n      pg_type.typname AS name, \n      pg_enum.enumlabel AS value \n    FROM pg_type\n    JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid\n    JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace\n    ".concat(config.schemas.length > 0 ? " WHERE pg_namespace.nspname = ANY(:schemas)" : '', "\n    ");
                        return [4 /*yield*/, db.raw(sql, { schemas: config.schemas })];
                    case 1:
                        ungroupedEnums = (_a.sent()).rows;
                        groupedEnums = (0, lodash_1.uniqBy)(ungroupedEnums, function (e) { return "".concat(e.name, ".").concat(e.schema); })
                            .map(function (row) { return ({
                            name: row.name,
                            schema: row.schema,
                            values: Object.fromEntries(ungroupedEnums
                                .filter(function (e) { return e.schema == row.schema && e.name == row.name; })
                                .sort(function (a, b) { return a.order - b.order; })
                                .map(function (e) { return [e.value, e.value]; }))
                        }); });
                        return [4 /*yield*/, SharedAdapterTasks.getTableEnums(db, config)];
                    case 2:
                        tableEnums = _a.sent();
                        return [2 /*return*/, groupedEnums.concat(tableEnums)];
                }
            });
        });
    };
    default_1.prototype.getAllTables = function (db, schemas) {
        return __awaiter(this, void 0, void 0, function () {
            var sql, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n      WITH schemas AS (\n        SELECT nspname AS name, oid AS oid\n        FROM pg_namespace\n        WHERE nspname <> 'information_schema' AND nspname NOT LIKE 'pg_%'\n        ".concat(schemas.length > 0 ? " AND nspname = ANY(:schemas)" : '', "\n        )\n        SELECT schemas.name AS schema,\n            pg_class.relname AS name,\n            COALESCE(pg_catalog.OBJ_DESCRIPTION( pg_class.oid , 'pg_class' ), '') AS comment\n        FROM pg_class\n            JOIN schemas ON schemas.oid = pg_class.relnamespace\n        WHERE pg_class.relkind IN ('r', 'p', 'v', 'm')\n    ");
                        return [4 /*yield*/, db.raw(sql, { schemas: schemas })];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.rows];
                }
            });
        });
    };
    default_1.prototype.getAllColumns = function (db, config, table, schema) {
        return __awaiter(this, void 0, void 0, function () {
            var sql;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n      SELECT\n        typns.nspname typeschema,\n        pg_type.typname,\n        pg_attribute.attname AS name,\n        pg_namespace.nspname AS schema,\n        pg_catalog.format_type(pg_attribute.atttypid, null) as type,\n        pg_attribute.attnotnull AS notNullable,\n        pg_attribute.atthasdef OR pg_attribute.attidentity <> '' AS hasDefault,\n        pg_class.relname AS table,\n        pg_type.typcategory AS typcategory,\n        pg_get_expr(pg_attrdef.adbin, pg_attrdef.adrelid) defaultvalue,\n        COALESCE(pg_catalog.col_description(pg_class.oid, pg_attribute.attnum), '') as comment,\n        CASE WHEN EXISTS (\n          SELECT null \n          FROM pg_index\n          WHERE pg_index.indrelid = pg_attribute.attrelid\n          AND  pg_attribute.attnum = any(pg_index.indkey)\n          AND pg_index.indisprimary\n        ) THEN 1 ELSE 0 END isPrimaryKey\n      FROM pg_attribute\n      JOIN pg_class ON pg_class.oid = pg_attribute.attrelid\n      LEFT JOIN pg_attrdef ON pg_attrdef.adrelid = pg_class.oid\n          AND pg_attribute.attnum = pg_attrdef.adnum\n      JOIN pg_type ON pg_type.oid = pg_attribute.atttypid\n      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace\n      JOIN pg_namespace AS typns ON typns.oid = pg_type.typnamespace\n      where pg_attribute.attnum > 0\n      AND pg_class.relname = :table\n      AND pg_namespace.nspname = :schema\n    ";
                        return [4 /*yield*/, db.raw(sql, { table: table, schema: schema })];
                    case 1: return [2 /*return*/, (_a.sent())
                            .rows
                            .map(function (c) {
                            var _a, _b;
                            return ({
                                name: c.name,
                                type: c.typname,
                                nullable: !c.notnullable,
                                optional: c.hasdefault || !c.notnullable,
                                isEnum: c.typcategory == 'E',
                                isPrimaryKey: c.isprimarykey == 1,
                                enumSchema: c.typeschema,
                                comment: c.comment,
                                defaultValue: (_b = (_a = c.defaultvalue) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : null,
                            });
                        })];
                }
            });
        });
    };
    return default_1;
}());
exports.default = default_1;
