import { syncHabits } from '../../utils/api';
import { FEATURES } from '../../config';

export const syncMiddleware = store => next => 
    action => {
      const result = next(action);
      const syncActions = [
        'habits/addHabit',
        'habits/toggleHabitCompletion',
        'habits/deleteHabit',
        'habits/updateHabit',
        'habits/resetHabits'
      ];
      
      if (syncActions.includes(action.type)) {
        if (FEATURES.OFFLINE_MODE === false) {
          console.log('Automatic sync skipped - offline mode enabled');
          store.dispatch({ type: 'habits/updateServerSyncStatus', payload: 'offline' });
          return result;
        }

        try {
          const { habits } = store.getState().habits;
          store.dispatch({ type: 'habits/setLoading', payload: true });
          store.dispatch({ type: 'habits/updateServerSyncStatus', payload: 'loading' });
          syncHabits(habits)
            .then(() => {
              store.dispatch({ type: 'habits/setLoading', payload: false });
              store.dispatch({ type: 'habits/setError', payload: null });
              store.dispatch({ type: 'habits/updateServerSyncStatus', payload: 'succeeded' });
              store.dispatch({ type: 'habits/updateLastSynced' });
      
              if (process.env.NODE_ENV !== 'production') {
                console.log(action.type);
              }
            })
            .catch(error => {
              store.dispatch({ type: 'habits/setLoading', payload: false });
              store.dispatch({ type: 'habits/updateServerSyncStatus', payload: 'failed' });
              store.dispatch({ 
                type: 'habits/setError', 
                payload: `Sync failed: ${error.message}` 
              });
              console.error('Sync error:', error);
            });
        } catch (error) {
          console.error('Error in sync middleware:', error);
        }
      }
      
      return result;
    }; 