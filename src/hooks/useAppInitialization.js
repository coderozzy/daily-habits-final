import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { ensureRegistered } from '../utils/deviceAuth';
import { fetchHabitsFromServer, updateLastSynced } from '../redux/habitsSlice';
import { SYNC_INTERVAL } from '../config/apiConfig';
import { TIMEOUTS, FEATURES } from '../config';


export const useAppInitialization = () => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(true);


  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (FEATURES.OFFLINE_MODE === false) {
          console.log('Server initialization skipped - offline mode enabled');
          return;
        }

        await ensureRegistered();
        
        dispatch(fetchHabitsFromServer());
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    
    const initTimer = setTimeout(() => {
      initializeApp();
    }, TIMEOUTS.APP_INITIALIZATION_DELAY);
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      
      if (state.isConnected && FEATURES.OFFLINE_MODE !== false) {
        dispatch(fetchHabitsFromServer());
      }
    });
    
    return () => {
      clearTimeout(initTimer);
      unsubscribe();
    };
  }, [dispatch]);
  
  useEffect(() => {
    if (!isConnected || FEATURES.OFFLINE_MODE === false) return;
    
    const syncInterval = setInterval(() => {
      dispatch(fetchHabitsFromServer());
      dispatch(updateLastSynced());
    }, SYNC_INTERVAL);
    
    return () => clearInterval(syncInterval);
  }, [dispatch, isConnected]);

  return {
    isConnected,
    isOfflineMode: FEATURES.OFFLINE_MODE === false,
  };
}; 