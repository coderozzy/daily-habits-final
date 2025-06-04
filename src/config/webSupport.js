import { Platform } from 'react-native';
import { UI_CONFIG } from './appConfig';


export const WEB_FEATURES = {
  NATIVE_ANIMATIONS: Platform.OS !== 'web',
  REANIMATED_SUPPORT: Platform.OS !== 'web',
  
  PUSH_NOTIFICATIONS: true,
  DEVICE_INFO: Platform.OS !== 'web',
  
  HAPTIC_FEEDBACK: Platform.OS !== 'web',
  NATIVE_AUDIO: Platform.OS !== 'web',
  
  IMAGE_RESIZE_MODE_PROP: true, 
  IMAGE_TINT_COLOR_PROP: true,
  
  SHADOW_STYLES: Platform.OS !== 'web',
  POINTER_EVENTS_STYLE: true,           
};

export const ANIMATION_CONFIG = {
  USE_NATIVE_DRIVER: Platform.OS !== 'web',
  
  DURATION: {
    FAST: Platform.OS === 'web' ? UI_CONFIG.WEB_ANIMATION_FAST : UI_CONFIG.ANIMATION_FAST,
    MEDIUM: Platform.OS === 'web' ? UI_CONFIG.WEB_ANIMATION_MEDIUM : UI_CONFIG.ANIMATION_MEDIUM,
    SLOW: Platform.OS === 'web' ? UI_CONFIG.WEB_ANIMATION_SLOW : UI_CONFIG.ANIMATION_SLOW,
  },
  
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
  },
};

export const PLATFORM_STYLES = {
  createWebSafeShadow: (shadowConfig) => {
    if (Platform.OS === 'web') {
      const { shadowOffset, shadowOpacity, shadowRadius, shadowColor } = shadowConfig;
      return {
        boxShadow: `${shadowOffset?.width || 0}px ${shadowOffset?.height || 0}px ${shadowRadius || 0}px rgba(0,0,0,${shadowOpacity || UI_CONFIG.WEB_SHADOW_OPACITY})`,
      };
    }
    return shadowConfig;
  },
  
  getPointerEventsStyle: (pointerEvents) => {
    return Platform.OS === 'web' 
      ? { pointerEvents } 
      : {};
  },
};

export const createWebSafeAnimatedView = (OriginalAnimatedView) => {
  return Platform.OS === 'web' ? View : OriginalAnimatedView;
};

export const NOTIFICATION_CONFIG = {
  WEB_SUPPORT: true,
  PUSH_TOKEN_SUPPORT: Platform.OS !== 'web',
  LOCAL_NOTIFICATIONS: true,
  
  WEB_FALLBACK_MESSAGE: null,
};

export default {
  WEB_FEATURES,
  ANIMATION_CONFIG,
  PLATFORM_STYLES,
  createWebSafeAnimatedView,
  NOTIFICATION_CONFIG,
}; 