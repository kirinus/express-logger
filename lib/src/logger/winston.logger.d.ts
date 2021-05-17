import { Logger } from 'winston';
export declare class WinstonLogger {
    readonly logger: Logger;
    constructor(logger: Logger);
    log(message: string, context?: string): Logger;
    error(message: string, trace?: string, context?: string): Logger;
    warn(message: string, context?: string): Logger;
    debug(message: string, context?: string): Logger;
    verbose(message: string, context?: string): Logger;
}
