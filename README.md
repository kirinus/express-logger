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

See the `example` directory.
