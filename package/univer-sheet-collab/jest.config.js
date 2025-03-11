module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
    moduleNameMapper: {
        '^@src/(.*)$': '<rootDir>/src/$1'
    },
};

