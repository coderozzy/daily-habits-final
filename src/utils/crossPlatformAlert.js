import { Platform, Alert } from 'react-native';


export const showAlert = (title, message, buttons = [], options = {}) => {
  if (Platform.OS === 'web') {
    if (buttons.length <= 2) {
      const hasCancel = buttons.some(btn => btn.style === 'cancel' || btn.text === 'Cancel');
      const confirmButton = buttons.find(btn => btn.style !== 'cancel' && btn.text !== 'Cancel');
      const cancelButton = buttons.find(btn => btn.style === 'cancel' || btn.text === 'Cancel');
      
      if (hasCancel) {
        const result = window.confirm(`${title}\n\n${message}`);
        if (result && confirmButton?.onPress) {
          confirmButton.onPress();
        } else if (!result && cancelButton?.onPress) {
          cancelButton.onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
        if (buttons[0]?.onPress) {
          buttons[0].onPress();
        }
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      if (buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons, options);
  }
};

export const showSuccessAlert = (message, onSuccess) => {
  showAlert('Success', message, [
    { text: 'OK', onPress: onSuccess }
  ]);
};

export const showErrorAlert = (message, onError) => {
  showAlert('Error', message, [
    { text: 'OK', onPress: onError }
  ]);
};

export const showConfirmAlert = (title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel') => {
  showAlert(title, message, [
    { text: cancelText, style: 'cancel', onPress: onCancel },
    { text: confirmText, style: 'destructive', onPress: onConfirm }
  ]);
}; 