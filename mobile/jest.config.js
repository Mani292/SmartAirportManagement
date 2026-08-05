module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transform: {
    '^.+\\.(js|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-reanimated|@react-navigation|expo|expo-status-bar|expo-barcode-scanner|expo-camera|expo-notifications|@expo/webpack-config)/)',
  ],
};
