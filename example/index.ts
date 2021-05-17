import * as express from 'express';

import { init as loggerInit, logger } from './logger';

const app = express() as express.Application;
loggerInit(app);

const port = 3000;
app.listen(port, () => {
  logger.debug(`App: Listening on port ${port}!`);
});
