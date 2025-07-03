/**
 * @description
 * Jest configuration file for the project. This configures the testing framework
 * to work with Next.js, TypeScript, and path aliases.
 *
 * Key configurations:
 * - testEnvironment: 'jsdom' to simulate a browser environment for tests.
 * - setupFilesAfterEnv: Points to a setup file for global test initializations.
 * - moduleNameMapper: Allows Jest to resolve '@/' path aliases correctly.
 * - transform: Uses 'ts-jest' to handle TypeScript and TSX files.
 */
module.exports = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1"
    },
    testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
    transform: {
      "^.+\\.(ts|tsx)$": "ts-jest"
    }
  }