import { Platform, Alert } from 'react-native';
import {
  showAlert,
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
} from '../crossPlatformAlert';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  Alert: {
    alert: jest.fn(),
  },
}));

const mockWindowAlert = jest.fn();
const mockWindowConfirm = jest.fn();

Object.defineProperty(window, 'alert', {
  writable: true,
  value: mockWindowAlert,
});

Object.defineProperty(window, 'confirm', {
  writable: true,
  value: mockWindowConfirm,
});

describe('crossPlatformAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowAlert.mockClear();
    mockWindowConfirm.mockClear();
    Alert.alert.mockClear();
  });

  describe('showAlert', () => {
    describe('on mobile platforms', () => {
      beforeEach(() => {
        Platform.OS = 'ios';
      });

      it('should use React Native Alert on mobile', () => {
        const title = 'Test Title';
        const message = 'Test Message';
        const buttons = [{ text: 'OK' }];
        const options = { cancelable: true };

        showAlert(title, message, buttons, options);

        expect(Alert.alert).toHaveBeenCalledWith(title, message, buttons, options);
        expect(mockWindowAlert).not.toHaveBeenCalled();
      });
    });

    describe('on web platform', () => {
      beforeEach(() => {
        Platform.OS = 'web';
      });

      it('should use window.alert for simple message', () => {
        const title = 'Test Title';
        const message = 'Test Message';

        showAlert(title, message);

        expect(mockWindowAlert).toHaveBeenCalledWith(`${title}\n\n${message}`);
        expect(Alert.alert).not.toHaveBeenCalled();
      });

      it('should call button onPress after window.alert', () => {
        const mockOnPress = jest.fn();
        const buttons = [{ text: 'OK', onPress: mockOnPress }];

        showAlert('Title', 'Message', buttons);

        expect(mockWindowAlert).toHaveBeenCalled();
        expect(mockOnPress).toHaveBeenCalled();
      });

      it('should use window.confirm for cancel/confirm dialogs', () => {
        const mockOnConfirm = jest.fn();
        const mockOnCancel = jest.fn();
        const buttons = [
          { text: 'Cancel', style: 'cancel', onPress: mockOnCancel },
          { text: 'OK', onPress: mockOnConfirm }
        ];

        mockWindowConfirm.mockReturnValue(true);
        showAlert('Title', 'Message', buttons);

        expect(mockWindowConfirm).toHaveBeenCalledWith('Title\n\nMessage');
        expect(mockOnConfirm).toHaveBeenCalled();
        expect(mockOnCancel).not.toHaveBeenCalled();
      });

      it('should call cancel handler when window.confirm returns false', () => {
        const mockOnConfirm = jest.fn();
        const mockOnCancel = jest.fn();
        const buttons = [
          { text: 'Cancel', style: 'cancel', onPress: mockOnCancel },
          { text: 'OK', onPress: mockOnConfirm }
        ];

        mockWindowConfirm.mockReturnValue(false);
        showAlert('Title', 'Message', buttons);

        expect(mockWindowConfirm).toHaveBeenCalledWith('Title\n\nMessage');
        expect(mockOnConfirm).not.toHaveBeenCalled();
        expect(mockOnCancel).toHaveBeenCalled();
      });

      it('should handle more than 2 buttons by falling back to alert', () => {
        const mockOnPress = jest.fn();
        const buttons = [
          { text: 'Option 1', onPress: mockOnPress },
          { text: 'Option 2' },
          { text: 'Option 3' }
        ];

        showAlert('Title', 'Message', buttons);

        expect(mockWindowAlert).toHaveBeenCalledWith('Title\n\nMessage');
        expect(mockOnPress).toHaveBeenCalled();
      });

      it('should handle buttons without onPress gracefully', () => {
        const buttons = [{ text: 'OK' }];

        expect(() => {
          showAlert('Title', 'Message', buttons);
        }).not.toThrow();

        expect(mockWindowAlert).toHaveBeenCalled();
      });
    });
  });

  describe('showSuccessAlert', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('should show success alert with correct title', () => {
      const message = 'Operation successful';
      const mockOnSuccess = jest.fn();

      showSuccessAlert(message, mockOnSuccess);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        message,
        [{ text: 'OK', onPress: mockOnSuccess }],
        {}
      );
    });

    it('should work without onSuccess callback', () => {
      const message = 'Operation successful';

      expect(() => {
        showSuccessAlert(message);
      }).not.toThrow();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        message,
        [{ text: 'OK', onPress: undefined }],
        {}
      );
    });
  });

  describe('showErrorAlert', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('should show error alert with correct title', () => {
      const message = 'Something went wrong';
      const mockOnError = jest.fn();

      showErrorAlert(message, mockOnError);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        message,
        [{ text: 'OK', onPress: mockOnError }],
        {}
      );
    });

    it('should work without onError callback', () => {
      const message = 'Something went wrong';

      expect(() => {
        showErrorAlert(message);
      }).not.toThrow();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        message,
        [{ text: 'OK', onPress: undefined }],
        {}
      );
    });
  });

  describe('showConfirmAlert', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('should show confirm alert with default button texts', () => {
      const title = 'Confirm Action';
      const message = 'Are you sure?';
      const mockOnConfirm = jest.fn();
      const mockOnCancel = jest.fn();

      showConfirmAlert(title, message, mockOnConfirm, mockOnCancel);

      expect(Alert.alert).toHaveBeenCalledWith(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel', onPress: mockOnCancel },
          { text: 'Confirm', style: 'destructive', onPress: mockOnConfirm }
        ],
        {}
      );
    });

    it('should show confirm alert with custom button texts', () => {
      const title = 'Delete Item';
      const message = 'This action cannot be undone';
      const mockOnConfirm = jest.fn();
      const mockOnCancel = jest.fn();
      const confirmText = 'Delete';
      const cancelText = 'Keep';

      showConfirmAlert(title, message, mockOnConfirm, mockOnCancel, confirmText, cancelText);

      expect(Alert.alert).toHaveBeenCalledWith(
        title,
        message,
        [
          { text: 'Keep', style: 'cancel', onPress: mockOnCancel },
          { text: 'Delete', style: 'destructive', onPress: mockOnConfirm }
        ],
        {}
      );
    });

    it('should work without callback functions', () => {
      const title = 'Confirm Action';
      const message = 'Are you sure?';

      expect(() => {
        showConfirmAlert(title, message);
      }).not.toThrow();

      expect(Alert.alert).toHaveBeenCalledWith(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel', onPress: undefined },
          { text: 'Confirm', style: 'destructive', onPress: undefined }
        ],
        {}
      );
    });
  });
}); 