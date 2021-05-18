"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinstonLogger = exports.formatLogstash = exports.createWinstonLogger = exports.createExpressWinstonHandler = void 0;
var utils_logger_1 = require("./utils.logger");
Object.defineProperty(exports, "createExpressWinstonHandler", { enumerable: true, get: function () { return utils_logger_1.createExpressWinstonHandler; } });
Object.defineProperty(exports, "createWinstonLogger", { enumerable: true, get: function () { return utils_logger_1.createWinstonLogger; } });
Object.defineProperty(exports, "formatLogstash", { enumerable: true, get: function () { return utils_logger_1.formatLogstash; } });
var winston_logger_1 = require("./winston.logger");
Object.defineProperty(exports, "WinstonLogger", { enumerable: true, get: function () { return winston_logger_1.WinstonLogger; } });
//# sourceMappingURL=index.js.map