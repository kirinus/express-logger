import { Handler } from 'express';
import { Logger } from 'winston';
import { WinstonLogger } from './winston.logger';
export declare const formatLogstash: import("logform").FormatWrap;
export declare function createWinstonLogger(label: string): WinstonLogger;
export declare function createExpressWinstonHandler(logger: Logger): Handler;
