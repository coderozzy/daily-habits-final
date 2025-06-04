export default {
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
};

export const SecureStoreOptions = {
  WHEN_UNLOCKED: 'whenUnlocked',
  AFTER_FIRST_UNLOCK: 'afterFirstUnlock',
  ALWAYS: 'always',
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'whenPasscodeSetThisDeviceOnly',
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'whenUnlockedThisDeviceOnly',
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'afterFirstUnlockThisDeviceOnly',
  ALWAYS_THIS_DEVICE_ONLY: 'alwaysThisDeviceOnly',
}; 