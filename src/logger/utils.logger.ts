import jsonStringify from 'safe-stable-stringify';
import * as expressWinston from 'express-winston';
import * as fs from 'fs';
import * as Transport from 'winston-transport';
import { Handler } from 'express';
import { Request } from 'express';
import { TransformableInfo, format as logformFormat } from 'logform';
import { Logger, config, createLogger, format, transports } from 'winston';

import { env, isKubernetesEnv } from '../config';
import { getRequestIdContext } from '../middleware/http-context.middleware';
import { WinstonLogger } from './winston.logger';

/**
 * Log level of the Winston log instances.
 * Logs with levels lower than this level will not be logged.
 */
const level = env.LOG_LEVEL;

/**
 * Array of strings containing the levels to log to stderr instead of stdout
 *
 * For more info, go to
 * [console transports](https://github.com/winstonjs/winston/blob/master/docs/transports.md)
 * and see
 * [conversation about debug redirected to stderr](https://github.com/winstonjs/winston/issues/927)
 */
const stderrLevels = ['error'];

/**
 * The custom formatter that manages winston meta.
 * - Retrieve uuid and role information from express-winston meta.
 * - Add global information like deployed version, environment...
 */
/* istanbul ignore next */
// tslint:disable-next-line: ter-arrow-parens
const injectMeta = format((info) => {
  info.requestId = getRequestIdContext();
  // Add extra metadata from the config
  info.environment = env.ENVIRONMENT;
  info.version = env.VERSION;
  return info;
});

/* istanbul ignore next */
function serializeError(error: Error) {
  const { stack, message, name } = error;
  const serializedStack = !!stack ? stack.split('/n') : null;
  return {
    ...error,
    message,
    name,
    stack: serializedStack,
  };
}

/* istanbul ignore next */
// tslint:disable-next-line: ter-arrow-parens
const errorsFormat = format((info) => {
  if (info.level === 'error' && info.error) {
    info.error = serializeError(info.error);
  }
  return info;
});

function formatMessage(message: string): string {
  let formattedMessage = message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((message as any) instanceof Object) {
    formattedMessage = jsonStringify(message);
  }
  return formattedMessage;
}

/**
 * Retrieve a custom log formatted entry. Useful for print only!
 *
 * @param info The information about the log entry.
 * @returns The pretty formatted log information.
 */
function formatLog(info: TransformableInfo) {
  // Collect all fields independently, ignore meta and stringify the rest
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { environment, level, label, timestamp, message, meta, splat, ...rest } = info;
  return `[${environment}] ${level}: [${label}] ${formatMessage(message)} ${jsonStringify(rest)}`;
}

/**
 * Returns a new instance of the LogStash Format that turns a log
 * `info` object into pure JSON with the appropriate logstash options.
 */
export const formatLogstash = logformFormat((info) => {
  const logstash: { '@fields'?: unknown; '@message'?: string; '@timestamp'?: unknown } = {};
  const { message, timestamp, ...rest } = info;
  if (message) {
    logstash['@message'] = formatMessage(message);
  }
  if (timestamp) {
    logstash['@timestamp'] = timestamp;
  }
  logstash['@fields'] = rest;
  info.message = jsonStringify(logstash);
  return info;
});

/**
 * Create a labelled `winston` logger instance.
 *
 * @param label The label of the logger instance.
 * @returns The Logger instance with transports attached by environment.
 */
export function createWinstonLogger(label: string): WinstonLogger {
  const logTransporters: Transport[] = [
    // Stream to nothing by default, if there are no other transports (ideal for testing)
    new transports.Stream({
      stream: fs.createWriteStream(process.platform === 'win32' ? '\\\\.\\NUL' : '/dev/null'),
      silent: true,
    }),
  ];

  const consoleTransport = new transports.Console({ stderrLevels });
  /* istanbul ignore else */
  if (env.ENVIRONMENT === 'development') {
    // Development formats
    consoleTransport.format = format.combine(
      format.colorize(),
      format.printf((info) => formatLog(info)),
    );
    logTransporters.push(consoleTransport);
  } else if (isKubernetesEnv) {
    // Production formats (logstash in Kubernetes)
    consoleTransport.format = format.combine(format.timestamp(), formatLogstash());
    logTransporters.push(consoleTransport);
  }

  return new WinstonLogger(
    createLogger({
      level,
      levels: config.npm.levels,
      // Global formats
      format: format.combine(injectMeta(), errorsFormat(), format.label({ label })),
      transports: logTransporters,
    }),
  );
}

/**
 * Redact secret data that might come from a header, like the JWT in the Authorization header.
 *
 * @param req The logged request by express-winston.
 * @param propName The property of the logged request that will be adapted.
 * @returns The express request property, sanitized if it is 'headers'.
 */
function sanitizeHeaders(req: Request, propName: string) {
  if (propName === 'headers') {
    // The 'if-none-match' header can break logstash JSON format
    if ('if-none-match' in req.headers) req.headers['if-none-match'] = 'EXCLUDED';
    // The 'authorization' header has the plaintext jwt token, we should never log it
    if (req.headers.authorization) req.headers.authorization = 'Bearer [REDACTED]';
    // The 'cookie' header could contain jwt tokens
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  return (req as any)[propName];
}

/**
 * Retrieve the express winston logger handler middleware.
 *
 * @param logger The winston logger handler to be injected to express-winston.
 * @returns The express winston logger handler that serves as middleware.
 */
export function createExpressWinstonHandler(logger: Logger): Handler {
  return expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    metaField: 'express',
    msg: '{{req.method}} {{req.url}}',
    expressFormat: false,
    colorize: env.ENVIRONMENT === 'development',
    requestFilter: sanitizeHeaders,
    headerBlacklist: ['cookie', 'portal-authentication-token', 'token'],
    ignoreRoute: () => false,
  });
}
