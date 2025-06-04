module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/__tests__/setup.js'
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    "node_modules/(?!(expo|@expo|react-native|@react-native|@react-navigation|@react-native-picker|@react-native-async-storage|@react-native-community|@react-native-segmented-control|@react-native-masked-view|@react-native-firebase|@react-native-vector-icons|expo-linear-gradient|react-native-reanimated|expo-modules-core|expo-device|expo-secure-store|expo-notifications|expo-location|expo-camera|expo-constants|react-native-paper|styled-components|date-fns)/)"
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Only test app files, exclude server directory
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/setup.js',
    '<rootDir>/src/__tests__/setup.js',
    '<rootDir>/server/',
    '<rootDir>/node_modules/'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/__tests__/**',
    '!src/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  moduleNameMapper: {
    '^react-redux$': '<rootDir>/node_modules/react-redux/dist/cjs/index.js',
    '^@expo/vector-icons$': '<rootDir>/src/__mocks__/expo-vector-icons.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__mocks__/@react-native-async-storage/async-storage.js',
    '^expo-device$': '<rootDir>/src/__mocks__/expo-device.js',
    '^expo-secure-store$': '<rootDir>/src/__mocks__/expo-secure-store.js',
    '^expo-notifications$': '<rootDir>/src/__mocks__/expo-notifications.js',
    '^expo-location$': '<rootDir>/src/__mocks__/expo-location.js',
  },
}; 