module.exports = {
  transform: {
    "^.+\\.tsx?$": "es-jest"
  },
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  watchPathIgnorePatterns: ['dist\\/'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageProvider: 'v8',
};
