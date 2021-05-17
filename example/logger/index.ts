import { Application } from 'express';

import {
  WinstonLogger,
  createExpressWinstonHandler,
  createWinstonLogger,
  httpContextMiddleware,
  requestIdHandler,
} from '@kirinus-digital/express-logger';

export let logger: WinstonLogger;

export function init(app: Application): void {
  const winstonLogger = createWinstonLogger('app');
  // Use express-winston for logging request information
  const expressWinstonHandler = createExpressWinstonHandler(winstonLogger.logger);
  app.use(expressWinstonHandler);
  // Use express-http-context for context injection (request id)
  app.use(httpContextMiddleware);
  app.use(requestIdHandler);
}
