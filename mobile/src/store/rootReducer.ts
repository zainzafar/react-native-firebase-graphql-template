import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import offlineReducer from './offlineSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  offline: offlineReducer,
});

export type RootReducer = typeof rootReducer;
export default rootReducer;


