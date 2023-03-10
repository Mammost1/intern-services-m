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
var SharedAdapterTasks = __importStar(require("./SharedAdapterTasks"));
var default_1 = /** @class */ (function () {
    function default_1() {
    }
    default_1.prototype.getAllEnums = function (db, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, SharedAdapterTasks.getTableEnums(db, config)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    default_1.prototype.getAllTables = function (db, schemas) {
        return __awaiter(this, void 0, void 0, function () {
            var sql;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sql = "\n      SELECT\n        TABLE_NAME AS name,\n        TABLE_SCHEMA AS 'schema',\n        COALESCE(NULLIF(TABLE_COMMENT, 'VIEW'), '') AS comment\n      FROM INFORMATION_SCHEMA.TABLES\n      WHERE TABLE_SCHEMA NOT IN('mysql', 'information_schema', 'performance_schema', 'sys')\n      ".concat(schemas.length > 0 ? ' AND TABLE_SCHEMA IN (:schemas)' : '');
                        return [4 /*yield*/, db.raw(sql, { schemas: schemas })];
                    case 1: return [2 /*return*/, (_a.sent())[0]];
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
                        sql = "\n      SELECT\n        column_name as name,\n        is_nullable as isNullable,\n        column_comment as comment,\n        COLUMN_DEFAULT AS defaultValue,\n        CASE WHEN LOCATE('auto_increment', extra) <> 0 OR COLUMN_DEFAULT IS NOT NULL THEN 1 ELSE 0 END isOptional,\n        CASE WHEN EXISTS(\n          SELECT NULL FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu\n          WHERE CONSTRAINT_NAME = 'PRIMARY'\n          AND kcu.TABLE_NAME = :table\n          AND kcu.TABLE_SCHEMA = :schema\n          AND kcu.COLUMN_NAME = c.COLUMN_NAME\n        ) THEN 1 ELSE 0 END isPrimaryKey,\n        data_type AS type\n        FROM information_schema.columns c\n        WHERE TABLE_NAME = :table\n        AND c.TABLE_SCHEMA = :schema\n      ";
                        return [4 /*yield*/, db.raw(sql, { table: table, schema: schema })];
                    case 1: return [2 /*return*/, (_a.sent())[0]
                            .map(function (c) {
                            var _a, _b;
                            return ({
                                name: c.name,
                                type: c.type,
                                nullable: c.isNullable == 'YES',
                                optional: c.isOptional === 1,
                                isEnum: false,
                                isPrimaryKey: c.isPrimaryKey == 1,
                                comment: c.comment,
                                defaultValue: (_b = (_a = c.defaultValue) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : null,
                            });
                        })];
                }
            });
        });
    };
    return default_1;
}());
exports.default = default_1;
