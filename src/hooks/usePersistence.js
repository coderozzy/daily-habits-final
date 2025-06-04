import { useState, useEffect, useRef } from 'react';
import { persistor } from '../redux/store';
import { TIMEOUTS } from '../config';


export const usePersistence = () => {
  const [persistError, setPersistError] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const timeoutRef = useRef(null);


  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (!bootstrapped) {
        setPersistError('Loading timeout - please check your connection and try again');
      }
    }, TIMEOUTS.APP_PERSISTENCE);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [bootstrapped]);

  useEffect(() => {
    const unsubscribe = persistor.subscribe(() => {
      const state = persistor.getState();
      
      if (state.bootstrapped) {
        setBootstrapped(true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setPersistError(null);
      }
    });

    return unsubscribe;
  }, []);

  const handleRetry = () => {
    setPersistError(null);
    setBootstrapped(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (!bootstrapped) {
        setPersistError('Loading timeout - please check your connection and try again');
      }
    }, TIMEOUTS.APP_PERSISTENCE);
    
    persistor.purge().then(() => {
      persistor.persist();
    });
  };

  const handlePersistenceSuccess = () => {
    setBootstrapped(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPersistError(null);
  };

  return {
    persistError,
    bootstrapped,
    handleRetry,
    handlePersistenceSuccess,
  };
}; 