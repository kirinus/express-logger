# express-logger

Implementation of an `express.js` logger using `winston` and `express-winston`.

## Installation

```bash
yarn add @kirinus/express-logger
```

## Usage

```typescript
import {
  createExpressWinstonHandler,
  createWinstonLogger,
  httpContextMiddleware,
  requestIdHandler,
} from '@kirinus/express-logger';
```

### Basic Example

Add the following to your `index.ts` / `main.ts`: