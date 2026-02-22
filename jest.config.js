module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/backend', '<rootDir>/frontend'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/backend/utils/$1',
    '^@middleware/(.*)$': '<rootDir>/backend/middleware/$1',
    '^@routes/(.*)$': '<rootDir>/backend/routes/$1',
    '^@types/(.*)$': '<rootDir>/backend/types/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true,
      tsconfig: {
        module: 'commonjs',
        target: 'ES2020',
        lib: ['ES2020'],
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        strict: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noImplicitReturns: false,
      }
    }]
  },
  collectCoverageFrom: [
    'backend/**/*.ts',
    '!backend/**/*.test.ts',
    '!backend/**/*.spec.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  setupFilesAfterEnv: ['<rootDir>/backend/__tests__/setup.ts'],
  verbose: true,
  testTimeout: 10000,
  maxWorkers: '50%'
};
