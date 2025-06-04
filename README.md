# Daily Habits App

React Native mobile app for tracking daily habits and personal goals.

## Prerequisites

- Node.js
- Expo CLI (`npm install -g @expo/cli`)
- Mobile device or emulator
- NixOS users: Use `flake.nix` for declarative configuration

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android  # Android device/emulator
npm run ios      # iOS device/simulator
npm run web      # Web browser
```

## Features

- **Habit Tracking**: Create and monitor daily habits
- **Offline Support**: Works without internet connection
- **Dark/Light Theme**: Automatic theme switching
- **Data Sync**: Syncs with backend server when online
- **Notifications**: Reminders for habit completion
- **Progress Analytics**: Visual progress tracking

## Testing

```bash
npm run test           # Run all tests
npm run test:app       # App tests only
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

## Code Quality

```bash
npm run lint      # Check code style
npm run lint:fix  # Fix linting issues
npm run format    # Format code
``` 