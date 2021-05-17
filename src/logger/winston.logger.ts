import { Logger } from 'winston';

export class WinstonLogger {
  constructor(public readonly logger: Logger) {}

  public log(message: string, context?: string): Logger {
    return this.logger.info(message, { context });
  }

  public error(message: string, trace?: string, context?: string): Logger {
    return this.logger.error(message, { trace, context });
  }

  public warn(message: string, context?: string): Logger {
    return this.logger.warn(message, { context });
  }

  public debug(message: string, context?: string): Logger {
    return this.logger.debug(message, { context });
  }

  public verbose(message: string, context?: string): Logger {
    return this.logger.verbose(message, { context });
  }
}
