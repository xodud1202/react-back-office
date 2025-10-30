// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/loginUser/loginUser';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// RootState와 AppDispatch 타입을 자동 유추
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
