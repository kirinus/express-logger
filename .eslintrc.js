module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:eslint-comments/recommended', 'prettier'],
  rules: {
    /**
     * Global style rules
     */
    'max-len': [
      'error',
      {
        code: 100,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        tabWidth: 2,
      },
    ],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-void': ['error', { allowAsStatement: true }],
    'object-curly-spacing': [2, 'always'], // See configuration in https://www.npmjs.com/package/eslint-plugin-ordered-imports#configuration
    'ordered-imports/ordered-imports': [
      'error',
      {
        'declaration-ordering': [
          'type',
          {
            ordering: ['side-effect', 'default', 'namespace', 'destructured'],
            secondaryOrdering: ['source', 'case-insensitive'],
          },
        ],
        'specifier-ordering': 'lowercase-last',
        'group-ordering': [
          { name: 'internal libraries', match: '^@kirinus-?.*/', order: 20 },
          { name: 'parent directories', match: '^\\.\\.?', order: 30 },
          { name: 'third-party', match: '.*', order: 10 },
        ],
      },
    ],
    semi: ['error', 'always'],
  },
  overrides: [
    {
      /**
       * JavaScript rules
       */
      files: ['**/*.js'],
      extends: ['eslint:recommended', 'plugin:node/recommended'],
    },
    {
      /**
       * TypeScript rules
       */
      files: ['**/*.ts'],
      extends: [
        'plugin:import/typescript',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
          modules: true,
        },
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint', 'ordered-imports'],
      rules: {
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'default',
            format: ['camelCase'],
            filter: {
              regex: '^_+$',
              match: false
            }
          },
          {
            selector: 'enumMember',
            format: ['PascalCase'],
          },
          {
            selector: 'parameter',
            format: ['camelCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'typeLike',
            format: ['PascalCase'],
          },
          {
            selector: 'variable',
            format: ['camelCase', 'UPPER_CASE'],
          },
        ],
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_+$' }],
        '@typescript-eslint/restrict-template-expressions': ['error', { allowAny: true }],
      },
    },
    {
      /**
       * Jest rules
       */
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/test/**/*.{j,t}s?(x)',
        '**/*.test.tsx',
        '**/{unit,integration}/setup.ts',
      ],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        'jest/expect-expect': [
          'error',
          {
            assertFunctionNames: ['expect', 'request.*.expect'],
          },
        ],
      },
    },
    {
      /**
       * JavaScript configuration file rules
       */
      files: ['**/*.config.{j,t}s?(x)', '**/.eslintrc.js'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'node/no-extraneous-require': 'off',
        'node/no-unpublished-require': 'off',
        'prefer-const': 'off',
      },
    },
  ],
};
