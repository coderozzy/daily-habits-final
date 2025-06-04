import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import habitsReducer from './habitsSlice';
import { syncMiddleware } from './middleware/syncMiddleware';
import { TIMEOUTS } from '../config';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['habits'],
  timeout: TIMEOUTS.REDUX_PERSIST,
};

const persistedReducer = persistReducer(persistConfig, habitsReducer);

export const store = configureStore({
  reducer: {
    habits: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
      immutableCheck: false,
    }).concat(syncMiddleware),
});

export const persistor = persistStore(store);
