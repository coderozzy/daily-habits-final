import { useNavigation } from '@react-navigation/native';
import { SCREEN_NAMES } from '../config/navigationConfig';


export const useAppNavigation = () => {
  const navigation = useNavigation();

  return {
    navigateToAddHabit: () => navigation.navigate(SCREEN_NAMES.ADD_HABIT),
    navigateToSync: () => navigation.navigate(SCREEN_NAMES.SYNC_SCREEN),
    navigateToDebug: () => navigation.navigate(SCREEN_NAMES.DEBUG_SCREEN),
    navigateToHome: () => navigation.navigate(SCREEN_NAMES.MAIN_TABS, {
      screen: SCREEN_NAMES.HOME
    }),
    navigateToStats: () => navigation.navigate(SCREEN_NAMES.MAIN_TABS, {
      screen: SCREEN_NAMES.STATS
    }),
    navigateToSettings: () => navigation.navigate(SCREEN_NAMES.MAIN_TABS, {
      screen: SCREEN_NAMES.SETTINGS
    }),

    goBack: () => navigation.goBack(),
    canGoBack: () => navigation.canGoBack(),
    
    navigate: (screenName, params) => navigation.navigate(screenName, params),
    
    reset: (routeName) => navigation.reset({
      index: 0,
      routes: [{ name: routeName }]
    }),
  };
}; 