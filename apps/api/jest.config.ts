import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.service.ts', '!**/node_modules/**', '!**/dist/**'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@sse/shared-utils$': '<rootDir>/../../../packages/shared-utils/src',
    '^@sse/shared-types$': '<rootDir>/../../../packages/shared-types/src',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
      },
    },
  },
};

export default config;
