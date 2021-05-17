# express-logger

Implementation of an `express.js` logger using `winston` and `express-winston`.

## Installation

```bash
yarn add @kirinus-digital/express-logger
```

## Usage

```typescript
import {
  createExpressWinstonHandler,
  createWinstonLogger,
  httpContextMiddleware,
  requestIdHandler,
} from '@kirinus-digital/express-logger';
```

### Basic Example

`index.ts`:

```typescript
import * as express from 'express';

import { init as loggerInit, logger } from './logger';

const app = express() as express.Application;
loggerInit(app);

const port = 3000;
app.listen(port, () => {
  logger.debug(`App: Listening on port ${port}!`);
});
```

`logger/index.ts`:

```typescript
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
  this.logger = createWinstonLogger('app');
  // Use express-winston for logging request information
  const expressWinstonHandler = createExpressWinstonHandler(this.logger);
  app.use(expressWinstonHandler);
  // Use express-http-context for context injection (request id)
  app.use(httpContextMiddleware);
  app.use(requestIdHandler);
}
```

`/middleware/logger.middleware.ts`:

```typescript
import { NextFunction, Request, Response } from 'express';

import { logger } from '../logger';

export function loggerMiddleware(req: Request, _: Response, next: NextFunction): void {
  logger.debug(`${req.method} ${req.path}`);
  next();
}
```
