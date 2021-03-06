"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpressWinstonHandler = exports.createWinstonLogger = exports.formatLogstash = void 0;
const safe_stable_stringify_1 = require("safe-stable-stringify");
const expressWinston = require("express-winston");
const fs = require("fs");
const logform_1 = require("logform");
const triple_beam_1 = require("triple-beam");
const winston_1 = require("winston");
const config_1 = require("../config");
const http_context_middleware_1 = require("../middleware/http-context.middleware");
const winston_logger_1 = require("./winston.logger");
const level = config_1.env.LOG_LEVEL;
const stderrLevels = ['error'];
const injectMeta = winston_1.format((info) => attachMeta(info));
function attachMeta(info) {
    info.requestId = http_context_middleware_1.getRequestIdContext();
    info.environment = config_1.env.ENVIRONMENT;
    info.version = config_1.env.VERSION;
    return info;
}
function serializeError(error) {
    const { stack, message, name } = error;
    const serializedStack = !!stack ? stack.split('/n') : null;
    return Object.assign(Object.assign({}, error), { message,
        name, stack: serializedStack });
}
const errorsFormat = winston_1.format((info) => {
    if (info.level === 'error' && info.error) {
        info.error = serializeError(info.error);
    }
    return info;
});
function formatMessage(message) {
    let formattedMessage = message;
    if (message instanceof Object) {
        formattedMessage = safe_stable_stringify_1.default(message);
    }
    return formattedMessage;
}
function formatLog(info) {
    attachMeta(info);
    const { environment, level, label, timestamp, message, meta, splat } = info, rest = __rest(info, ["environment", "level", "label", "timestamp", "message", "meta", "splat"]);
    return `[${environment}] ${level}: [${label}] ${formatMessage(message)} ${safe_stable_stringify_1.default(rest)}`;
}
exports.formatLogstash = logform_1.format((info) => {
    const logstash = {};
    attachMeta(info);
    const { message, timestamp } = info, rest = __rest(info, ["message", "timestamp"]);
    info = rest;
    if (message) {
        logstash['@message'] = formatMessage(message);
    }
    if (timestamp) {
        logstash['@timestamp'] = timestamp;
    }
    logstash['@fields'] = rest;
    info[triple_beam_1.MESSAGE] = safe_stable_stringify_1.default(logstash);
    return info;
});
function createWinstonLogger(label) {
    const logTransporters = [
        new winston_1.transports.Stream({
            stream: fs.createWriteStream(process.platform === 'win32' ? '\\\\.\\NUL' : '/dev/null'),
            silent: true,
        }),
    ];
    const consoleTransport = new winston_1.transports.Console({ stderrLevels });
    if (config_1.env.ENVIRONMENT === 'development') {
        consoleTransport.format = winston_1.format.combine(winston_1.format.colorize(), winston_1.format.printf((info) => formatLog(info)));
        logTransporters.push(consoleTransport);
    }
    else if (config_1.isKubernetesEnv) {
        consoleTransport.format = winston_1.format.combine(winston_1.format.timestamp(), exports.formatLogstash());
        logTransporters.push(consoleTransport);
    }
    return new winston_logger_1.WinstonLogger(winston_1.createLogger({
        level,
        levels: winston_1.config.npm.levels,
        format: winston_1.format.combine(injectMeta(), errorsFormat(), winston_1.format.label({ label })),
        transports: logTransporters,
    }));
}
exports.createWinstonLogger = createWinstonLogger;
function sanitizeRequest(req, propName) {
    if (propName === 'headers') {
        if ('if-none-match' in req.headers)
            req.headers['if-none-match'] = 'EXCLUDED';
        if (req.headers.authorization)
            req.headers.authorization = 'Bearer [REDACTED]';
        if (req.headers.cookie) {
            const cookies = req.headers.cookie.split('; ');
            req.headers.cookie = cookies
                .map((cookie) => {
                if (cookie.startsWith('AccessToken=')) {
                    return 'AccessToken=REDACTED';
                }
                if (cookie.startsWith('RefreshToken=')) {
                    return 'RefreshToken=REDACTED';
                }
                return cookie;
            })
                .join('; ');
        }
    }
    return req[propName];
}
function sanitizeResponse(res, propName, options) {
    if (propName === 'body') {
        res['body'] = bodySanitizer(Object.assign({}, res['body']), options.bodyBlacklist);
    }
    return res[propName];
}
function bodySanitizer(body, bodyBlacklist) {
    if (body && bodyBlacklist) {
        for (const key of bodyBlacklist) {
            if (body && body[key]) {
                body[key] = 'REDACTED';
            }
        }
    }
    return body;
}
function createExpressWinstonHandler(options) {
    return expressWinston.logger(Object.assign({ meta: true, metaField: 'express', msg: '{{req.method}} {{req.url}}', expressFormat: false, colorize: config_1.env.ENVIRONMENT === 'development', requestFilter: sanitizeRequest, responseFilter: (res, propName) => sanitizeResponse(res, propName, options), ignoreRoute: () => false }, options));
}
exports.createExpressWinstonHandler = createExpressWinstonHandler;
//# sourceMappingURL=utils.logger.js.map