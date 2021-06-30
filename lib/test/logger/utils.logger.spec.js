"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const httpContext = require("express-http-context");
const expressWinston = require("express-winston");
const fs = require("fs");
const winston = require("winston");
const common_tags_1 = require("common-tags");
const config = require("../../src/config");
const src_1 = require("../../src");
jest.mock('winston', () => ({
    createLogger: jest.fn(),
    config: {
        npm: {
            levels: { error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6 },
        },
    },
    format: jest.fn(() => jest.fn(() => 'transformExpressMeta')),
    transports: {
        Console: jest.fn().mockImplementation(() => ({ name: 'Console' })),
        Stream: jest.fn().mockImplementation(() => ({ name: 'Stream' })),
    },
}));
jest.mock('express-winston', () => ({
    logger: jest.fn(),
}));
jest.mock('../../src/config', () => ({
    env: {
        LOG_LEVEL: 'debug',
        ENVIRONMENT: 'unit',
    },
    isKubernetesEnv: true,
}));
describe('utils logger', () => {
    const requestId = '75e10ee1-6c92-4c58-b639-8a5875da1820';
    httpContext.get = jest.fn(() => requestId);
    const infoStub = {
        level: 'info',
        label: 'app',
        environment: 'fakeEnvironment',
        message: 'message',
        requestId: 'requestId',
        express: { req: {} },
        user: 'userUuid',
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('create winston logger', () => {
        const label = 'unittest';
        const stubFormat = (infoStub) => ({
            combine: jest.fn((...args) => args),
            colorize: jest.fn(() => 'colorize'),
            label: jest.fn((label) => label),
            logstash: jest.fn(() => 'logstash'),
            printf: jest.fn((templateFunction) => templateFunction(infoStub)),
            timestamp: jest.fn(() => 'timestamp'),
        });
        test('development', () => {
            config.env.ENVIRONMENT = 'development';
            config.isKubernetesEnv = false;
            config.env.VERSION = 'commit-sha';
            winston.format = stubFormat(infoStub);
            src_1.createWinstonLogger(label);
            const expectedPrintfFormat = common_tags_1.oneLineTrim `
        [${config.env.ENVIRONMENT}] info: [app] message {\"express\":{\"req\":{}},\"requestId\":\"${requestId}\",\"user\":\"userUuid\",\"version\":\"${config.env.VERSION}\"}
      `;
            expect(winston.createLogger).toBeCalledWith({
                level: config.env.LOG_LEVEL,
                levels: winston.config.npm.levels,
                format: ['transformExpressMeta', 'transformExpressMeta', { label: 'unittest' }],
                transports: [
                    { name: 'Stream' },
                    { name: 'Console', format: ['colorize', expectedPrintfFormat] },
                ],
            });
            expect(winston.format.combine).toHaveBeenCalledTimes(2);
            expect(winston.format.label).toBeCalledWith({ label });
            expect(winston.format.colorize).toBeCalled();
            expect(winston.format.printf).toBeCalledWith(expect.any(Function));
            expect(winston.format.timestamp).not.toBeCalled();
            expect(winston.format.logstash).not.toBeCalled();
        });
        test('development with message object', () => {
            config.env.ENVIRONMENT = 'development';
            config.isKubernetesEnv = false;
            config.env.VERSION = 'commit-sha';
            winston.format = stubFormat(Object.assign(Object.assign({}, infoStub), { message: { description: 'unit-test' } }));
            src_1.createWinstonLogger(label);
            const expectedPrintfFormat = common_tags_1.oneLineTrim `
        [${config.env.ENVIRONMENT}] info: [app] {\"description\":\"unit-test\"} {\"express\":{\"req\":{}},\"requestId\":\"${requestId}\",\"user\":\"userUuid\",\"version\":\"${config.env.VERSION}\"}
      `;
            expect(winston.createLogger).toBeCalledWith({
                level: config.env.LOG_LEVEL,
                levels: winston.config.npm.levels,
                format: ['transformExpressMeta', 'transformExpressMeta', { label: 'unittest' }],
                transports: [
                    { name: 'Stream' },
                    { name: 'Console', format: ['colorize', expectedPrintfFormat] },
                ],
            });
            expect(winston.format.combine).toHaveBeenCalledTimes(2);
            expect(winston.format.label).toBeCalledWith({ label });
            expect(winston.format.colorize).toBeCalled();
            expect(winston.format.printf).toBeCalledWith(expect.any(Function));
            expect(winston.format.timestamp).not.toBeCalled();
            expect(winston.format.logstash).not.toBeCalled();
        });
        test('production', () => {
            config.env.ENVIRONMENT = 'production';
            config.isKubernetesEnv = true;
            winston.format = stubFormat(infoStub);
            src_1.createWinstonLogger(label);
            expect(winston.createLogger).toBeCalledWith({
                level: config.env.LOG_LEVEL,
                levels: winston.config.npm.levels,
                format: ['transformExpressMeta', 'transformExpressMeta', { label: 'unittest' }],
                transports: [
                    { name: 'Stream' },
                    { name: 'Console', format: ['timestamp', { options: {} }] },
                ],
            });
            expect(winston.format.combine).toHaveBeenCalledTimes(2);
            expect(winston.format.label).toBeCalledWith({ label });
            expect(winston.format.colorize).not.toBeCalled();
            expect(winston.format.timestamp).toBeCalled();
        });
        describe('formatLogstash', () => {
            test('with string', () => {
                const expectedPrintfFormat = {
                    level: 'info',
                    [Symbol('message')]: '{"@fields":{"level":"info"},"@message":"string-test","@timestamp":"2021-05-18T19:32:31.495Z"}',
                };
                expect(src_1.formatLogstash().transform({
                    level: 'info',
                    message: 'string-test',
                    timestamp: '2021-05-18T19:32:31.495Z',
                })).toMatchObject(expectedPrintfFormat);
            });
            test('with object', () => {
                const expectedPrintfFormat = {
                    level: 'info',
                    [Symbol('message')]: '{"@fields":{"level":"info"},"@message":"{\\"description\\":\\"unit-test\\"}"}',
                };
                expect(src_1.formatLogstash().transform({
                    level: 'info',
                    message: { description: 'unit-test' },
                })).toMatchObject(expectedPrintfFormat);
            });
            test('without a message', () => {
                const expectedPrintfFormat = {
                    level: 'info',
                    [Symbol('message')]: '{"@fields":{"level":"info"}}',
                };
                expect(src_1.formatLogstash().transform({ level: 'info', message: undefined })).toMatchObject(expectedPrintfFormat);
            });
        });
        describe('stream transport', () => {
            let originalPlatform;
            beforeEach(() => {
                originalPlatform = process.platform;
            });
            afterEach(() => {
                Object.defineProperty(process, 'platform', { value: originalPlatform });
            });
            test('to NULL in windows', () => {
                jest.spyOn(fs, 'createWriteStream').mockImplementationOnce(jest.fn());
                Object.defineProperty(process, 'platform', { value: 'win32' });
                src_1.createWinstonLogger(label);
                expect(fs.createWriteStream).toBeCalledWith('\\\\.\\NUL');
            });
            test('to /dev/null in other platforms', () => {
                ['darwin', 'freebsd', 'linux', 'sunos'].forEach((platform) => {
                    jest.spyOn(fs, 'createWriteStream').mockImplementationOnce(jest.fn());
                    Object.defineProperty(process, 'platform', { value: platform });
                    src_1.createWinstonLogger(label);
                    expect(fs.createWriteStream).toBeCalledWith('/dev/null');
                });
            });
        });
    });
    test('create express winston handler', () => {
        const loggerStub = {};
        src_1.createExpressWinstonHandler(loggerStub, {
            winstonInstance: loggerStub,
            bodyBlacklist: ['sensitive'],
        });
        const calledParam = expressWinston.logger.mock.calls[0][0];
        const { ignoreRoute, requestFilter, responseFilter } = calledParam;
        expect(calledParam).toMatchObject({
            bodyBlacklist: ['sensitive'],
            colorize: config.env.ENVIRONMENT === 'development',
            expressFormat: false,
            ignoreRoute: expect.any(Function),
            requestFilter: expect.anything(),
            responseFilter: expect.anything(),
            meta: true,
            metaField: 'express',
            msg: '{{req.method}} {{req.url}}',
            winstonInstance: loggerStub,
        });
        expect(ignoreRoute()).toBe(false);
        const req = {
            headers: {
                authorization: 'Bearer MYSECRETJWTTOKEN',
                'if-none-match': 'W/"2da-0kj/eLumj9c7RIVAqQqLv+KH0h4"',
                cookie: 'AccessToken=Secret; RefreshToken=Secret; OtherCookie=NoSecret',
            },
            fake: { param: 'isFake' },
        };
        expect(requestFilter(req, 'headers')).toEqual({
            authorization: 'Bearer [REDACTED]',
            'if-none-match': 'EXCLUDED',
            cookie: 'AccessToken=REDACTED; RefreshToken=REDACTED; OtherCookie=NoSecret',
        });
        expect(requestFilter(req, 'fake')).toEqual(req.fake);
        expect(requestFilter({ headers: { test: '1' } }, 'headers')).toEqual({ test: '1' });
        expect(responseFilter({ body: { param: 'isFake' } }, 'body')).toEqual({
            param: 'isFake',
        });
        expect(responseFilter({ headers: { sensitive: 'should not be redacted' } }, 'headers')).toEqual({
            sensitive: 'should not be redacted',
        });
        expect(responseFilter({ body: { sensitive: 'should be redacted' } }, 'body')).toEqual({
            sensitive: 'REDACTED',
        });
    });
});
//# sourceMappingURL=utils.logger.spec.js.map