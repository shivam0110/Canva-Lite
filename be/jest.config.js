module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "routes/**/*.js",
    "models/**/*.js",
    "!**/node_modules/**",
  ],
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
};
