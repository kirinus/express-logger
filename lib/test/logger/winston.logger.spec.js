"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const src_1 = require("../../src");
describe('Winston Logger', () => {
    const logger = winston_1.createLogger({ transports: new winston_1.transports.Console({ level: 'trace' }) });
    const winstonLogger = new src_1.WinstonLogger(logger);
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('should proxy log correctly', () => {
        jest.spyOn(logger, 'log');
        winstonLogger.log('log message');
        expect(logger.log).toBeCalledWith('info', 'log message', { context: undefined });
    });
    test('should proxy error correctly', () => {
        jest.spyOn(logger, 'error');
        winstonLogger.error('error message');
        expect(logger.error).toBeCalledWith('error message', { context: undefined, trace: undefined });
    });
    test('should proxy warn correctly', () => {
        jest.spyOn(logger, 'warn');
        winstonLogger.warn('warn message');
        expect(logger.warn).toBeCalledWith('warn message', { context: undefined });
    });
    test('should proxy debug correctly', () => {
        jest.spyOn(logger, 'debug');
        winstonLogger.debug('debug message');
        expect(logger.debug).toBeCalledWith('debug message', { context: undefined });
    });
    test('should proxy verbose correctly', () => {
        jest.spyOn(logger, 'verbose');
        winstonLogger.verbose('verbose message');
        expect(logger.verbose).toBeCalledWith('verbose message', { context: undefined });
    });
});
//# sourceMappingURL=winston.logger.spec.js.map