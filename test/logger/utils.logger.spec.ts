import * as httpContext from 'express-http-context';
import * as expressWinston from 'express-winston';
import * as fs from 'fs';
import * as winston from 'winston';
import { oneLineTrim } from 'common-tags';
import { TransformableInfo } from 'logform';

import * as config from '../../src/config';
import { createExpressWinstonHandler, createWinstonLogger, formatLogstash } from '../../src';

/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/ban-ts-comment */
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
  // @ts-ignore
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
    const stubFormat = (infoStub: TransformableInfo) => ({
      combine: jest.fn((...args) => args),
      colorize: jest.fn(() => 'colorize'),
      label: jest.fn((label) => label),
      logstash: jest.fn(() => 'logstash'),
      printf: jest.fn((templateFunction) => templateFunction(infoStub)),
      timestamp: jest.fn(() => 'timestamp'),
    });

    test('development', () => {
      // @ts-ignore
      config.env.ENVIRONMENT = 'development';
      // @ts-ignore
      config.isKubernetesEnv = false;
      // @ts-ignore
      config.env.VERSION = 'commit-sha';

      // @ts-ignore: need to remock the format as it was call with a function first time
      winston.format = stubFormat(infoStub);

      createWinstonLogger(label);

      // In the mock, we also pass the timestamp though in development it is actually not there
      const expectedPrintfFormat = oneLineTrim`
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
      // @ts-ignore
      config.env.ENVIRONMENT = 'development';
      // @ts-ignore
      config.isKubernetesEnv = false;
      // @ts-ignore
      config.env.VERSION = 'commit-sha';

      // @ts-ignore: need to remock the format as it was call with a function first time
      winston.format = stubFormat({ ...infoStub, message: { description: 'unit-test' } });

      createWinstonLogger(label);

      // In the mock, we also pass the timestamp though in development it is actually not there
      const expectedPrintfFormat = oneLineTrim`
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
      // @ts-ignore
      config.env.ENVIRONMENT = 'production';
      // @ts-ignore
      config.isKubernetesEnv = true;

      // @ts-ignore: need to remock the format as it was call with a function first time
      winston.format = stubFormat(infoStub);

      createWinstonLogger(label);

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
          [Symbol('message')]:
            '{"@fields":{"level":"info"},"@message":"string-test","@timestamp":"2021-05-18T19:32:31.495Z"}',
        };
        expect(
          formatLogstash().transform({
            level: 'info',
            message: 'string-test',
            timestamp: '2021-05-18T19:32:31.495Z',
          }),
        ).toMatchObject(expectedPrintfFormat);
      });

      test('with object', () => {
        const expectedPrintfFormat = {
          level: 'info',
          [Symbol('message')]:
            '{"@fields":{"level":"info"},"@message":"{\\"description\\":\\"unit-test\\"}"}',
        };
        expect(
          formatLogstash().transform({
            level: 'info',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            message: { description: 'unit-test' } as any,
          }),
        ).toMatchObject(expectedPrintfFormat);
      });

      test('without a message', () => {
        const expectedPrintfFormat = {
          level: 'info',
          [Symbol('message')]: '{"@fields":{"level":"info"}}',
        };
        expect(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatLogstash().transform({ level: 'info', message: undefined as any }),
        ).toMatchObject(expectedPrintfFormat);
      });
    });

    describe('stream transport', () => {
      let originalPlatform: NodeJS.Platform;

      beforeEach(() => {
        originalPlatform = process.platform;
      });

      afterEach(() => {
        // process.platform is a read only property, needs to be assigned like this
        Object.defineProperty(process, 'platform', { value: originalPlatform });
      });

      test('to NULL in windows', () => {
        jest.spyOn(fs, 'createWriteStream').mockImplementationOnce(jest.fn());
        Object.defineProperty(process, 'platform', { value: 'win32' });
        createWinstonLogger(label);
        expect(fs.createWriteStream).toBeCalledWith('\\\\.\\NUL');
      });

      test('to /dev/null in other platforms', () => {
        // tslint:disable-next-line: ter-arrow-parens
        (['darwin', 'freebsd', 'linux', 'sunos'] as NodeJS.Platform[]).forEach((platform) => {
          jest.spyOn(fs, 'createWriteStream').mockImplementationOnce(jest.fn());
          Object.defineProperty(process, 'platform', { value: platform });
          createWinstonLogger(label);
          expect(fs.createWriteStream).toBeCalledWith('/dev/null');
        });
      });
    });
  });

  test('create express winston handler', () => {
    const loggerStub = {} as winston.Logger;
    createExpressWinstonHandler(loggerStub, {
      winstonInstance: loggerStub,
      bodyBlacklist: ['sensitive'],
    });

    const calledParam = (expressWinston.logger as jest.Mock).mock.calls[0][0];
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
    // Does not alter whitelisted properties
    expect(responseFilter({ body: { param: 'isFake' } }, 'body')).toEqual({
      param: 'isFake',
    });
    // Does not alter headers
    expect(responseFilter({ headers: { sensitive: 'should not be redacted' } }, 'headers')).toEqual(
      {
        sensitive: 'should not be redacted',
      },
    );
    // Redacts blacklisted properties
    expect(responseFilter({ body: { sensitive: 'should be redacted' } }, 'body')).toEqual({
      sensitive: 'REDACTED',
    });
  });
});
/* eslint-enable @typescript-eslint/naming-convention */
/* eslint-enable @typescript-eslint/no-unsafe-return */
/* eslint-enable @typescript-eslint/ban-ts-comment */
