process.env.TZ = 'UTC';

module.exports = {
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: process.env.GITHUB_ACTIONS ? ['lcovonly', 'text'] : ['html', 'lcov', 'text'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  moduleFileExtensions: ['json', 'ts', 'js'],
  testEnvironment: require.resolve(`jest-environment-node`),
  testMatch: ['**/test/**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': require.resolve('ts-jest'),
  },
  transformIgnorePatterns: ['/.pnp.cjs$'],
  verbose: true,
};
