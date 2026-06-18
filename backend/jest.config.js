{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "rootDir": "./",
  "testMatch": ["**/tests/**/*.test.ts"],
  "transform": {
    "^.+\\.ts$": ["ts-jest", { "useESM": true }]
  },
  "globals": {
    "ts-jest": {
      "useESM": true
    }
  },
  "extensionsToTreatAsEsm": [".ts"],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/server.ts"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
