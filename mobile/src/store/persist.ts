import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer, persistStore } from 'redux-persist';
import rootReducer from './rootReducer';
import type { Store } from '@reduxjs/toolkit';

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'offline'],
};

export const persistedReducer = persistReducer(persistConfig, rootReducer);
export const createPersistor = (store: Store) => persistStore(store);


