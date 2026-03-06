/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'node',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          types: ['jest', 'node']
        }
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|bcryptjs|better-sqlite3)/)',
  ],
  collectCoverageFrom: [
    'backend/**/*.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  testTimeout: 30000,
  verbose: true,
  rootDir: '.',
  roots: ['<rootDir>/backend'],
  extensionsToTreatAsEsm: ['.ts'],
};