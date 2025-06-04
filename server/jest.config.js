module.exports = {
  testEnvironment: 'node',
  collectCoverage: false,
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  globalTeardown: undefined,
  forceExit: true,
  detectOpenHandles: true,
  rootDir: '.',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/../src/',
    '<rootDir>/../__tests__/'
  ]
}; 