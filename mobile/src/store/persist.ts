import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer, persistStore } from 'redux-persist';
import rootReducer from './rootReducer';

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth'],
};

export const persistedReducer = persistReducer(persistConfig, rootReducer);
export const createPersistor = (store: any) => persistStore(store);


